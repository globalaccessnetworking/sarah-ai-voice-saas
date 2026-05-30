/**
 * POST /api/integrations/vicidial/lead-context
 *
 * Webhook endpoint called by ViciDial BEFORE transferring a call to AI.
 * Caches the lead's context in Redis so the AI worker can do a lookup_hit
 * when it joins the room.
 *
 * Authentication: Authorization: Bearer <VICIDIAL_WEBHOOK_TOKEN>
 *                 or x-vicidial-token header
 *
 * Response shape is unchanged from before the Phase 10 refactor.
 * Internal seeding logic is now shared with /api/integrations/vicidial/ai-join
 * via frontend/lib/vicidial-context.ts.
 */

import { NextRequest, NextResponse } from "next/server";
import { isRedisClientConnected, getSanitizedRedisTarget, ensureRedisConnected } from "@/lib/redis";
import redis from "@/lib/redis";
import {
    normalizePhone,
    buildContextPayload,
    seedVicidialContext,
    VICIDIAL_CONTEXT_TTL,
} from "@/lib/vicidial-context";

// Safe authentication helper (identical logic to ai-join route)
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

        // 2. Validate phone (uses shared normalizer)
        const phone = body.phone || body.phone_number;
        const cleanPhone = normalizePhone(phone, body.phone_number, body.phone_code);
        if (!cleanPhone) {
            return NextResponse.json(
                { error: "phone or phone_number is required and must be 7–15 digits" },
                { status: 400 }
            );
        }

        // 3. Build normalized context payload (shared helper)
        const contextPayload = buildContextPayload(body, cleanPhone);

        // 4. Ensure Redis connected
        await ensureRedisConnected();

        // 5. Seed Redis (shared helper — same keys as ai-join)
        const seedResult = await seedVicidialContext(contextPayload, VICIDIAL_CONTEXT_TTL);

        // 6. Verify the primary key was written with a valid TTL
        let ttlCheck = -2;
        try {
            ttlCheck = await redis.ttl(`vicidial_context:phone:${cleanPhone}`);
        } catch (ttlErr) {
            console.error("[VICIDIAL_CONTEXT] TTL verification check threw error:", ttlErr);
        }

        const isRealAndValid = isRedisClientConnected() && ttlCheck > 0;

        if (!isRealAndValid) {
            console.error(`[VICIDIAL_CONTEXT] Redis verification failed. Connected=${isRedisClientConnected()} TTL=${ttlCheck}`);
            return NextResponse.json({
                success: false,
                error: "Redis verification failed. The key was not successfully written with a valid TTL.",
                redis_target: getSanitizedRedisTarget(),
                ttl_check: ttlCheck,
                connected: isRedisClientConnected()
            }, { status: 500 });
        }

        console.log(`[VICIDIAL_CONTEXT] Saved transient context keys=${seedResult.keys_written.join(", ")} verified_ttl=${ttlCheck}s target=${getSanitizedRedisTarget()}`);

        // Response shape is identical to pre-Phase-10 (fully backwards compatible)
        return NextResponse.json({
            success: true,
            message: "Transient ViciDial lead context saved successfully.",
            keys_written: seedResult.keys_written,
            ttl: VICIDIAL_CONTEXT_TTL,
            redis_target: getSanitizedRedisTarget(),
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
