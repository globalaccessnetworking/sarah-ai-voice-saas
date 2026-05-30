/**
 * frontend/lib/vicidial-context.ts
 *
 * Shared ViciDial Redis context seeding helper.
 * Used by:
 *   - /api/integrations/vicidial/lead-context  (webhook from ViciDial before transfer)
 *   - /api/integrations/vicidial/ai-join       (AI JOIN bridge - seeds context then originates)
 *
 * Keeps both endpoints in perfect sync: same keys, same TTL, same payload shape.
 */

import redis, { ensureRedisConnected } from "@/lib/redis";

export const VICIDIAL_CONTEXT_TTL = 3600; // 1 hour

export interface VicidialContextPayload {
    phone: string;
    phone_number: string;
    contact_name: string;
    first_name: string;
    last_name: string;
    vicidial_lead_id: string;
    vicidial_campaign_id: string;
    vicidial_list_id: string;
    vicidial_ingroup: string;
    vicidial_call_uniqueid: string;
    vendor_lead_code: string;
    custom_fields: Record<string, any>;
    lead_data: Record<string, any>;
    source: string;
    timestamp: string;
}

export interface SeedResult {
    success: boolean;
    keys_written: string[];
    ttl: number;
    context: VicidialContextPayload;
    error?: string;
}

/**
 * Normalizes and validates a phone number.
 * - Strips +, spaces, dashes, parentheses
 * - Combines phone_code + phone_number if needed
 * - Returns null if invalid (non-digit chars remain, or length out of 7-15 range)
 */
export function normalizePhone(
    phone?: string,
    phoneNumber?: string,
    phoneCode?: string
): string | null {
    let raw = phone || phoneNumber || "";

    // If no full phone but phone_code + phone_number, combine
    if (!raw && phoneCode && phoneNumber) {
        raw = `${phoneCode}${phoneNumber}`;
    }

    // If phone_code provided and phone doesn't already start with it, prepend
    if (raw && phoneCode && !raw.startsWith(phoneCode)) {
        // Only prepend if the number looks like a local number (shorter than 11 digits)
        const stripped = raw.replace(/[\+\s\-\(\)]/g, "");
        if (stripped.length <= 10) {
            raw = `${phoneCode}${stripped}`;
        }
    }

    // Strip all non-digits
    const clean = raw.replace(/[^\d]/g, "");

    // Validate: digits only, 7-15 chars
    if (!clean || clean.length < 7 || clean.length > 15) return null;

    return clean;
}

/**
 * Validates a conference extension.
 * Must be digits only, 4-12 chars.
 */
export function validateConfExten(confExten?: string): string | null {
    if (!confExten) return null;
    const clean = String(confExten).trim();
    if (/^\d{4,12}$/.test(clean)) return clean;
    return null;
}

/**
 * Validates a safe identifier field (user, campaign_id, lead_id, list_id, ingroup).
 * Allows alphanumeric, underscore, hyphen only.
 */
export function validateSafeId(value?: string, maxLen = 100): string {
    if (!value) return "";
    const clean = String(value).trim().slice(0, maxLen);
    // Whitelist: alphanumeric + underscore + hyphen
    if (!/^[A-Za-z0-9_\-]*$/.test(clean)) return "";
    return clean;
}

/**
 * Builds a normalized ViciDial context payload from raw request body fields.
 * Accepts both camelCase and snake_case field names (ViciDial uses snake_case).
 */
export function buildContextPayload(body: Record<string, any>, cleanPhone: string): VicidialContextPayload {
    const vicidialLeadId   = validateSafeId(body.leadId || body.lead_id || body.vicidial_lead_id);
    const vicidialCampaignId = validateSafeId(body.vicidialCampaignId || body.vicidial_campaign_id || body.campaign_id || body.campaign);
    const vicidialListId   = validateSafeId(body.vicidialListId || body.vicidial_list_id || body.list_id);
    const vicidialIngroup  = validateSafeId(body.vicidialIngroup || body.vicidial_ingroup || body.ingroup);
    const callUniqueid     = String(body.callUniqueid || body.call_uniqueid || "").trim().slice(0, 200);
    const vendorLeadCode   = String(body.vendorLeadCode || body.vendor_lead_code || "").trim().slice(0, 200);
    const firstName        = String(body.firstName || body.first_name || "").trim().slice(0, 100);
    const lastName         = String(body.lastName || body.last_name || "").trim().slice(0, 100);
    const address1         = String(body.address1 || "").trim().slice(0, 255);
    const address2         = String(body.address2 || "").trim().slice(0, 255);
    const address3         = String(body.address3 || "").trim().slice(0, 255);
    const city             = String(body.city || "").trim().slice(0, 100);
    const state            = String(body.state || "").trim().slice(0, 100);
    const province         = String(body.province || "").trim().slice(0, 100);
    const postalCode       = String(body.postalCode || body.postal_code || "").trim().slice(0, 20);
    const email            = String(body.email || "").trim().slice(0, 255);
    const securityPhrase   = String(body.securityPhrase || body.security_phrase || "").trim().slice(0, 255);
    const comments         = String(body.comments || "").trim().slice(0, 1000);

    // Dynamic custom fields — supports custom_fields, customFields, leadData, lead_data
    const rawCustomFields = body.custom_fields || body.customFields || body.leadData || body.lead_data || {};
    const customFields: Record<string, any> = {};

    if (typeof rawCustomFields === "object" && rawCustomFields !== null) {
        Object.entries(rawCustomFields).forEach(([k, v]) => {
            const cleanKey = String(k).trim().toLowerCase().replace(/[-\s]/g, "_").slice(0, 100);
            customFields[cleanKey] = v;
            if (cleanKey !== k) customFields[k] = v;
        });
    }

    // Build lead_data object (includes all ViciDial standard fields + custom fields)
    const leadData: Record<string, any> = {
        ...customFields,
        vicidial_lead_id: vicidialLeadId,
        vicidial_campaign_id: vicidialCampaignId,
        vicidial_list_id: vicidialListId,
        vicidial_ingroup: vicidialIngroup,
        vicidial_call_uniqueid: callUniqueid,
        vendor_lead_code: vendorLeadCode,
        first_name: firstName,
        last_name: lastName,
        address1,
        address2,
        address3,
        city,
        state,
        province,
        postal_code: postalCode,
        email,
        security_phrase: securityPhrase,
        comments,
    };

    return {
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
        custom_fields: rawCustomFields,
        lead_data: leadData,
        source: "vicidial",
        timestamp: new Date().toISOString(),
    };
}

/**
 * Seeds Redis with ViciDial context under all relevant lookup keys.
 * Returns the list of keys written and the TTL used.
 */
export async function seedVicidialContext(
    payload: VicidialContextPayload,
    ttl: number = VICIDIAL_CONTEXT_TTL
): Promise<SeedResult> {
    await ensureRedisConnected();

    const serialized = JSON.stringify(payload);
    const keysWritten: string[] = [];

    try {
        // Key 1: Phone (primary lookup key used by the worker)
        const phoneKey = `vicidial_context:phone:${payload.phone}`;
        await redis.set(phoneKey, serialized, { EX: ttl });
        keysWritten.push(phoneKey);

        // Key 2: Unique call ID (if provided)
        if (payload.vicidial_call_uniqueid) {
            const uniqueidKey = `vicidial_context:uniqueid:${payload.vicidial_call_uniqueid}`;
            await redis.set(uniqueidKey, serialized, { EX: ttl });
            keysWritten.push(uniqueidKey);
        }

        // Key 3: ViciDial Lead ID (if provided)
        if (payload.vicidial_lead_id) {
            const leadKey = `vicidial_context:lead:${payload.vicidial_lead_id}`;
            await redis.set(leadKey, serialized, { EX: ttl });
            keysWritten.push(leadKey);
        }

        return { success: true, keys_written: keysWritten, ttl, context: payload };
    } catch (err: any) {
        return {
            success: false,
            keys_written: keysWritten,
            ttl,
            context: payload,
            error: err?.message || "Redis write failed",
        };
    }
}
