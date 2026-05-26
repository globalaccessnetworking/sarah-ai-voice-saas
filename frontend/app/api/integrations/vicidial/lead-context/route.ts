import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

// Safe authentication helper
function isAuthorized(req: NextRequest): boolean {
    const configToken = process.env.VICIDIAL_WEBHOOK_TOKEN || "vicidial_secure_token_2026";
    
    // 1. Check Bearer Token
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7).trim();
        if (token === configToken) return true;
    }

    // 2. Check Custom Header
    const customHeader = req.headers.get("x-vicidial-token");
    if (customHeader && customHeader.trim() === configToken) {
        return true;
    }

    // 3. Optional IP Allowlist check
    const allowedIpsEnv = process.env.VICIDIAL_ALLOWED_IPS;
    if (allowedIpsEnv) {
        const allowedIps = allowedIpsEnv.split(",").map(ip => ip.trim());
        const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
                         req.headers.get("x-real-ip")?.trim();
        
        if (clientIp && allowedIps.includes(clientIp)) {
            return true;
        }
    }

    return false;
}

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate Request
        if (!isAuthorized(req)) {
            console.warn("[VICIDIAL_AUTH] Unauthorized request attempt blocked.");
            return NextResponse.json(
                { error: "Unauthorized. Valid token required." },
                { status: 401 }
            );
        }

        const body = await req.json();

        // 2. Input Validation
        const phone = body.phone || body.phone_number;
        if (!phone) {
            return NextResponse.json(
                { error: "phone or phone_number is required" },
                { status: 400 }
            );
        }

        // Clean phone number (strip spaces, dashes, parentheses, leading plus)
        const cleanPhone = String(phone).replace(/[\+\s\-\(\)]/g, "");
        if (!cleanPhone || cleanPhone.length < 7) {
            return NextResponse.json(
                { error: "Invalid phone number format" },
                { status: 400 }
            );
        }

        // 3. Preserved Fields & Normalization
        const vicidialLeadId = String(body.leadId || body.vicidial_lead_id || "").trim();
        const vicidialCampaignId = String(body.vicidialCampaignId || body.vicidial_campaign_id || "").trim();
        const vicidialListId = String(body.vicidialListId || body.vicidial_list_id || "").trim();
        const vicidialIngroup = String(body.vicidialIngroup || body.vicidial_ingroup || "").trim();
        const callUniqueid = String(body.callUniqueid || body.call_uniqueid || "").trim();
        const vendorLeadCode = String(body.vendorLeadCode || body.vendor_lead_code || "").trim();
        const firstName = String(body.firstName || body.first_name || "").trim();
        const lastName = String(body.lastName || body.last_name || "").trim();
        const address1 = String(body.address1 || "").trim();
        const address2 = String(body.address2 || "").trim();
        const address3 = String(body.address3 || "").trim();
        const city = String(body.city || "").trim();
        const state = String(body.state || "").trim();
        const province = String(body.province || "").trim();
        const postalCode = String(body.postalCode || body.postal_code || "").trim();
        const email = String(body.email || "").trim();
        const securityPhrase = String(body.securityPhrase || body.security_phrase || "").trim();
        const comments = String(body.comments || "").trim();
        
        // Dynamic custom fields payload
        const rawCustomFields = body.leadData || body.lead_data || {};
        const leadData: Record<string, any> = {};

        // Merge standard custom fields with normalized keys
        if (typeof rawCustomFields === "object" && rawCustomFields !== null) {
            Object.entries(rawCustomFields).forEach(([k, v]) => {
                leadData[k] = v;
            });
        }

        // Store original ViciDial parameters inside lead_data too
        leadData.vicidial_lead_id = vicidialLeadId;
        leadData.vicidial_campaign_id = vicidialCampaignId;
        leadData.vicidial_list_id = vicidialListId;
        leadData.vicidial_ingroup = vicidialIngroup;
        leadData.vicidial_call_uniqueid = callUniqueid;
        leadData.vendor_lead_code = vendorLeadCode;
        leadData.first_name = firstName;
        leadData.last_name = lastName;
        leadData.address1 = address1;
        leadData.address2 = address2;
        leadData.address3 = address3;
        leadData.city = city;
        leadData.state = state;
        leadData.province = province;
        leadData.postal_code = postalCode;
        leadData.email = email;
        leadData.security_phrase = securityPhrase;
        leadData.comments = comments;

        // Structured normalized context
        const contextPayload = {
            phone: cleanPhone,
            phone_number: cleanPhone,
            contact_name: `${firstName} ${lastName}`.trim() || "Customer",
            first_name: firstName,
            last_name: lastName,
            vicidial_lead_id: vicidialLeadId,
            vicidial_campaign_id: vicidialCampaignId,
            vicidial_list_id: vicidialListId,
            vicidial_ingroup: vicidialIngroup,
            vicidial_call_uniqueid: callUniqueid,
            vendor_lead_code: vendorLeadCode,
            lead_data: leadData,
            source: "vicidial",
            timestamp: new Date().toISOString()
        };

        const serialized = JSON.stringify(contextPayload);
        const ttlSeconds = 3600; // 1-hour transient TTL
        
        // 4. Save to Redis under multiple lookup keys for collision protection
        const keysWritten: string[] = [];

        // Key 1: Phone Fallback
        const phoneKey = `vicidial_context:phone:${cleanPhone}`;
        await redis.set(phoneKey, serialized);
        // Expiry setting (EX: 3600) via raw client when available, or manual config
        if (redis.expire) {
            await redis.expire(phoneKey, ttlSeconds);
        }
        keysWritten.push(phoneKey);

        // Key 2: Unique call ID (if provided)
        if (callUniqueid) {
            const uniqueidKey = `vicidial_context:uniqueid:${callUniqueid}`;
            await redis.set(uniqueidKey, serialized);
            if (redis.expire) {
                await redis.expire(uniqueidKey, ttlSeconds);
            }
            keysWritten.push(uniqueidKey);
        }

        // Key 3: ViciDial Lead ID (if provided)
        if (vicidialLeadId) {
            const leadKey = `vicidial_context:lead:${vicidialLeadId}`;
            await redis.set(leadKey, serialized);
            if (redis.expire) {
                await redis.expire(leadKey, ttlSeconds);
            }
            keysWritten.push(leadKey);
        }

        console.log(`[VICIDIAL_CONTEXT] Saved transient context keys=${keysWritten.join(", ")} TTL=${ttlSeconds}s`);

        return NextResponse.json({
            success: true,
            message: "Transient ViciDial lead context saved successfully.",
            keys_written: keysWritten,
            ttl: ttlSeconds,
            data: contextPayload
        });

    } catch (err: any) {
        console.error("[VICIDIAL_CONTEXT_ERROR]", err);
        return NextResponse.json(
            { error: "Internal server error", details: err?.message || "" },
            { status: 500 }
        );
    }
}
