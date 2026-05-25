import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import { enqueueRedisJob } from '@/lib/queue';
import crypto from 'crypto';

const { agents, sipTrunks } = schema;

function normalizePhone(phone: string) {
    if (!phone) return "";
    return phone.replace(/[\+\s\-\(\)]/g, '');
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            agent_id,
            agent_slug,
            sip_trunk_id,
            caller_id,
            phone,
            lead_name,
            company_name,
            opening_message,
            call_goal,
            script,
            lead_data
        } = body;

        // 1. Strongly validate phone and caller_id
        if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
            return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
        }
        if (!caller_id || typeof caller_id !== 'string' || caller_id.trim().length === 0) {
            return NextResponse.json({ error: "Caller ID is required." }, { status: 400 });
        }
        if ((!agent_id && !agent_slug) || !sip_trunk_id || !opening_message) {
            return NextResponse.json({
                error: "Missing required fields: (agent_id or agent_slug), sip_trunk_id, and opening_message are required."
            }, { status: 400 });
        }

        const sipCallTo = normalizePhone(phone);
        if (!sipCallTo || sipCallTo.length < 7) {
            return NextResponse.json({ error: "Invalid phone number. Must contain at least 7 digits." }, { status: 400 });
        }

        // 2. Fetch Agent
        let agent;
        if (agent_id) {
            agent = (await db.select().from(agents).where(eq(agents.id, agent_id)))[0];
        } else if (agent_slug) {
            agent = (await db.select().from(agents).where(eq(agents.slug, agent_slug)))[0];
        }

        if (!agent) {
            return NextResponse.json({ error: "Agent not found" }, { status: 404 });
        }

        // 3. Fetch SIP Trunk
        const [trunk] = await db.select().from(sipTrunks).where(eq(sipTrunks.id, sip_trunk_id));
        if (!trunk) {
            return NextResponse.json({ error: "SIP Trunk not found" }, { status: 404 });
        }

        // 4. Build unique preview IDs
        const uuidPart = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
        const preview_call_id = `preview_${uuidPart}`;
        const queueName = process.env.AI_DIALER_OUTBOUND_QUEUE || 'ai_dialer_outbound_queue';

        // Mix company_name into lead_data for template rendering context
        const finalLeadData = {
            company_name: company_name || "",
            ...(lead_data || {})
        };

        // 5. Build Redis job payload with authoritative tts_config
        const payload = {
            type: "preview",
            source: "preview",
            direction: "outbound",
            call_direction: "outbound",
            campaign_id: null,
            lead_id: preview_call_id,
            external_record_id: preview_call_id,
            contact_name: lead_name || "Valued Customer",
            phone: phone,
            sip_call_to: sipCallTo,
            agent_id: agent.id,
            agent_slug: agent.slug,
            agent_name: agent.name || "outbound-agent",
            sip_trunk_id: trunk.id,
            caller_id: caller_id,
            opening_message: opening_message,
            call_goal: call_goal || "Preview AI Call",
            script: script || "",
            lead_data: finalLeadData,
            tts_config: {
                provider: agent.ttsProvider,
                model: agent.ttsModel,
                voice_id: agent.ttsVoiceId
            },
            legacy_complaint_mode: false
        };

        // 6. Logging exactly as requested
        console.log(`[PreviewDial] enqueueing preview job`, {
            preview_call_id,
            phone,
            agent_slug: agent.slug,
            sip_trunk_id: trunk.id,
            caller_id
        });
        console.log(`[PreviewDial] tts_config`, payload.tts_config);

        // 7. Push one job using the queue helper
        await enqueueRedisJob(queueName, payload);

        return NextResponse.json({
            success: true,
            preview_call_id,
            queueName,
            message: "Preview call queued"
        }, { status: 200 });

    } catch (error: any) {
        console.error("Error queueing preview dial:", error);
        return NextResponse.json({
            error: "Failed to queue preview dial",
            details: error.message
        }, { status: 500 });
    }
}
