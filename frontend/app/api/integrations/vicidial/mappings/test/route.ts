import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { vicidialMappings, agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import redis from "@/lib/redis";

export const dynamic = "force-dynamic";

function renderTemplate(template: string, data: Record<string, any>): string {
    if (!template) return "";
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const trimmed = key.trim();
        // Check in case dynamic field exists in nested lead_data
        if (data[trimmed] !== undefined) {
            return String(data[trimmed]);
        }
        if (data.lead_data && data.lead_data[trimmed] !== undefined) {
            return String(data.lead_data[trimmed]);
        }
        return match;
    });
}

// POST /api/integrations/vicidial/mappings/test — Simulate mapping resolution
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const phone = body.phone || body.phone_number || "5551234";
        const cleanPhone = String(phone).replace(/[\+\s\-\(\)]/g, "");
        
        const vicidialCampaignId = String(body.vicidialCampaignId || body.vicidial_campaign_id || "").trim();
        const vicidialListId = String(body.vicidialListId || body.vicidial_list_id || "").trim();
        const vicidialIngroup = String(body.vicidialIngroup || body.vicidial_ingroup || "").trim();
        const vicidialLeadId = String(body.leadId || body.vicidial_lead_id || "999").trim();
        const callUniqueid = String(body.callUniqueid || body.call_uniqueid || "").trim();
        const vendorLeadCode = String(body.vendorLeadCode || body.vendor_lead_code || "").trim();
        const firstName = String(body.firstName || body.first_name || "John").trim();
        const lastName = String(body.lastName || body.last_name || "Doe").trim();

        // 1. Compile lead data
        const leadData = body.leadData || body.lead_data || {};
        const normalizedLeadData: Record<string, any> = { ...leadData };
        
        normalizedLeadData.vicidial_lead_id = vicidialLeadId;
        normalizedLeadData.vicidial_campaign_id = vicidialCampaignId;
        normalizedLeadData.vicidial_list_id = vicidialListId;
        normalizedLeadData.vicidial_ingroup = vicidialIngroup;
        normalizedLeadData.vicidial_call_uniqueid = callUniqueid;
        normalizedLeadData.vendor_lead_code = vendorLeadCode;
        normalizedLeadData.first_name = firstName;
        normalizedLeadData.last_name = lastName;
        normalizedLeadData.phone_number = cleanPhone;

        const contextPayload = {
            phone: cleanPhone,
            phone_number: cleanPhone,
            contact_name: `${firstName} ${lastName}`.trim(),
            first_name: firstName,
            last_name: lastName,
            vicidial_lead_id: vicidialLeadId,
            vicidial_campaign_id: vicidialCampaignId,
            vicidial_list_id: vicidialListId,
            vicidial_ingroup: vicidialIngroup,
            vicidial_call_uniqueid: callUniqueid,
            vendor_lead_code: vendorLeadCode,
            lead_data: normalizedLeadData,
            source: "vicidial",
            timestamp: new Date().toISOString()
        };

        const serialized = JSON.stringify(contextPayload);
        const ttlSeconds = 3600;

        // 2. Perform mock Redis writes (actually writes for live validation)
        const keysWritten: string[] = [];
        try {
            const phoneKey = `vicidial_context:phone:${cleanPhone}`;
            await redis.set(phoneKey, serialized);
            if (redis.expire) await redis.expire(phoneKey, ttlSeconds);
            keysWritten.push(phoneKey);

            if (callUniqueid) {
                const uniqueidKey = `vicidial_context:uniqueid:${callUniqueid}`;
                await redis.set(uniqueidKey, serialized);
                if (redis.expire) await redis.expire(uniqueidKey, ttlSeconds);
                keysWritten.push(uniqueidKey);
            }

            if (vicidialLeadId) {
                const leadKey = `vicidial_context:lead:${vicidialLeadId}`;
                await redis.set(leadKey, serialized);
                if (redis.expire) await redis.expire(leadKey, ttlSeconds);
                keysWritten.push(leadKey);
            }
        } catch (redisErr) {
            console.error("Redis dry-run/write failed in test endpoint", redisErr);
        }

        // 3. Resolve active mappings from PostgreSQL
        const rows = await db
            .select({
                id: vicidialMappings.id,
                name: vicidialMappings.name,
                vicidialCampaignId: vicidialMappings.vicidialCampaignId,
                vicidialListId: vicidialMappings.vicidialListId,
                vicidialIngroup: vicidialMappings.vicidialIngroup,
                agentId: vicidialMappings.agentId,
                openingMessage: vicidialMappings.openingMessage,
                callGoal: vicidialMappings.callGoal,
                script: vicidialMappings.script,
                isActive: vicidialMappings.isActive,
            })
            .from(vicidialMappings)
            .where(eq(vicidialMappings.isActive, true));

        // Hierarchical Match Priority specificity score matching
        let bestMatch: any = null;
        let bestScore = -1;

        const c_id = vicidialCampaignId.trim().toLowerCase();
        const l_id = vicidialListId.trim().toLowerCase();
        const i_id = vicidialIngroup.trim().toLowerCase();

        for (const m of rows) {
            const m_camp = String(m.vicidialCampaignId || "").trim().toLowerCase();
            const m_list = String(m.vicidialListId || "").trim().toLowerCase();
            const m_ing = String(m.vicidialIngroup || "").trim().toLowerCase();

            let score = 0;
            let match = true;

            if (m_camp) {
                if (m_camp === c_id) {
                    score += 10;
                } else {
                    match = false;
                }
            }

            if (m_list) {
                if (m_list === l_id) {
                    score += 5;
                } else {
                    match = false;
                }
            }

            if (m_ing) {
                if (m_ing === i_id) {
                    score += 5;
                } else {
                    match = false;
                }
            }

            // Require at least one criteria to match
            if (!m_camp && !m_list && !m_ing) {
                match = false;
            }

            if (match && score > bestScore) {
                bestScore = score;
                bestMatch = m;
            }
        }

        // 4. Resolve Mapped Agent
        let selectedAgent = null;
        let renderedOpeningMessage = "";

        if (bestMatch && bestMatch.agentId) {
            const agentRows = await db
                .select()
                .from(agents)
                .where(eq(agents.id, bestMatch.agentId))
                .limit(1);

            if (agentRows && agentRows.length > 0) {
                selectedAgent = agentRows[0];
                
                // Greeting resolution precedence
                const mappingGreeting = bestMatch.openingMessage;
                const agentGreeting = selectedAgent.initialGreeting || selectedAgent.systemPrompt;
                const templateToRender = mappingGreeting || agentGreeting || "Hello, this is your AI assistant.";
                
                renderedOpeningMessage = renderTemplate(templateToRender, contextPayload);
            }
        }

        return NextResponse.json({
            success: true,
            simulated: true,
            redis_context: {
                keys_written: keysWritten,
                ttl: ttlSeconds,
                payload: contextPayload
            },
            mapping: bestMatch ? {
                id: bestMatch.id,
                name: bestMatch.name,
                campaign_id: bestMatch.vicidialCampaignId,
                list_id: bestMatch.vicidialListId,
                ingroup: bestMatch.vicidialIngroup,
                score: bestScore
            } : null,
            agent: selectedAgent ? {
                id: selectedAgent.id,
                name: selectedAgent.name,
                slug: selectedAgent.slug,
                status: selectedAgent.status
            } : null,
            rendered_opening_message: renderedOpeningMessage,
            final_lead_data: normalizedLeadData
        });

    } catch (error: any) {
        console.error("[VICIDIAL_SIMULATION_ERROR]", error);
        return NextResponse.json(
            { error: "Simulation failed", details: error?.message || "" },
            { status: 500 }
        );
    }
}
