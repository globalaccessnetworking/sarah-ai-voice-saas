/**
 * Global Access AI Engine
 * GET /api/agents/[id]     — fetch single agent
 * PATCH /api/agents/[id]   — update status (start / stop / restart)
 * DELETE /api/agents/[id]  — delete agent
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, ne } from "drizzle-orm";
import redis, { pushAgentToRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// ── GET /api/agents/[id] ────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
    const { id } = await params;
    try {
        const [agent] = await db
            .select()
            .from(schema.agents)
            .where(eq(schema.agents.id, id))
            .limit(1);

        if (!agent) {
            return NextResponse.json({ error: "Agent not found" }, { status: 404 });
        }

        // Apply healthy defaults for null numeric fields to prevent frontend crashes
        const safeAgent = { ...agent };
        const numericFields: (keyof typeof agent)[] = [
            'llmTemperature', 'rtTemperature', 'sttResponsiveness',
            'ttsSpeed', 'elevenLabsStability', 'elevenLabsSimilarity',
            'outboundLlmTemperature'
        ];

        numericFields.forEach(field => {
            if (safeAgent[field] === null || safeAgent[field] === undefined) {
                if (field === 'ttsSpeed') (safeAgent as any)[field] = "1.0";
                else if (field === 'elevenLabsStability') (safeAgent as any)[field] = "0.5";
                else if (field === 'elevenLabsSimilarity') (safeAgent as any)[field] = "0.75";
                else (safeAgent as any)[field] = "0.8";
            }
        });

        return NextResponse.json({ agent: safeAgent }, { status: 200 });
    } catch (err) {
        console.error(`[GET /api/agents/${id}]`, err);
        return NextResponse.json(
            { error: "Failed to fetch agent" },
            { status: 500 }
        );
    }
}

// ── PATCH /api/agents/[id] ──────────────────────────────────────────────────
// Supports partial updates: { status } | { name, ... } | full agent payload
export async function PATCH(req: NextRequest, { params }: Params) {
    const { id } = await params;
    try {
        const body = await req.json();

        // Allow status-only updates (start/stop from the table)
        const allowedStatuses = ["running", "stopped", "restarting"];
        if (body.status && !allowedStatuses.includes(body.status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${allowedStatuses.join(", ")}` },
                { status: 400 }
            );
        }

        // Build update object — only include defined fields
        const updates: Partial<typeof schema.agents.$inferInsert> = {};
        if (body.status !== undefined) updates.status = body.status;
        if (body.name !== undefined) updates.name = body.name;
        if (body.slug !== undefined) updates.slug = body.slug;
        if (body.systemPrompt !== undefined) updates.systemPrompt = body.systemPrompt;
        if (body.initialGreeting !== undefined) updates.initialGreeting = body.initialGreeting;
        if (body.knowledgeBase !== undefined) updates.knowledgeBase = body.knowledgeBase;
        if (body.toolInstructions !== undefined) updates.toolInstructions = body.toolInstructions;

        // Pipeline & LLM
        if (body.pipelineMode !== undefined) updates.pipelineMode = body.pipelineMode;
        if (body.llmProvider !== undefined) updates.llmProvider = body.llmProvider;
        if (body.llmModel !== undefined) updates.llmModel = body.llmModel;
        if (body.llmTemperature !== undefined) updates.llmTemperature = String(body.llmTemperature);
        if (body.llmAzureDeployment !== undefined) updates.llmAzureDeployment = body.llmAzureDeployment;

        // RT
        if (body.rtProvider !== undefined) updates.rtProvider = body.rtProvider;
        if (body.rtModel !== undefined) updates.rtModel = body.rtModel;
        if (body.rtVoice !== undefined) updates.rtVoice = body.rtVoice;
        if (body.rtLanguage !== undefined) updates.rtLanguage = body.rtLanguage;
        if (body.rtModalities !== undefined) updates.rtModalities = body.rtModalities;
        if (body.rtProactivity !== undefined) updates.rtProactivity = body.rtProactivity;
        if (body.rtAffectiveDialog !== undefined) updates.rtAffectiveDialog = body.rtAffectiveDialog;
        if (body.rtNoiseReduction !== undefined) updates.rtNoiseReduction = body.rtNoiseReduction;
        if (body.rtThinkingBudget !== undefined) updates.rtThinkingBudget = body.rtThinkingBudget;
        if (body.rtMaxOutputTokens !== undefined) updates.rtMaxOutputTokens = body.rtMaxOutputTokens ? parseInt(body.rtMaxOutputTokens) : null;
        if (body.rtTopP !== undefined) updates.rtTopP = body.rtTopP ? String(body.rtTopP) : null;
        if (body.rtTemperature !== undefined) updates.rtTemperature = String(body.rtTemperature);
        if (body.rtSpeed !== undefined) updates.rtSpeed = body.rtSpeed ? String(body.rtSpeed) : null;
        if (body.rtTurnDetection !== undefined) updates.rtTurnDetection = body.rtTurnDetection;
        if (body.rtTurnDetectionEagerness !== undefined) updates.rtTurnDetectionEagerness = body.rtTurnDetectionEagerness;
        if (body.rtCtxCompression !== undefined) updates.rtCtxCompressionEnabled = body.rtCtxCompression;
        if (body.rtCtxTrigger !== undefined) updates.rtCtxCompressionTrigger = body.rtCtxTrigger ? parseInt(body.rtCtxTrigger) : null;
        if (body.rtCtxTarget !== undefined) updates.rtCtxCompressionTarget = body.rtCtxTarget ? parseInt(body.rtCtxTarget) : null;
        if (body.rtAzureDeployment !== undefined) updates.rtAzureDeployment = body.rtAzureDeployment;

        // STT
        if (body.sttProvider !== undefined) updates.sttProvider = body.sttProvider;
        if (body.sttModel !== undefined) updates.sttModel = body.sttModel;
        if (body.sttLanguage !== undefined) updates.sttLanguage = body.sttLanguage;
        if (body.sttResponsiveness !== undefined) updates.sttResponsiveness = String(body.sttResponsiveness);
        if (body.sttDetectLanguage !== undefined) updates.sttDetectLanguage = body.sttDetectLanguage;
        if (body.sttCustomVocab !== undefined) updates.sttCustomVocab = body.sttCustomVocab;
        if (body.sttSmartFormatting !== undefined) updates.sttSmartFormatting = body.sttSmartFormatting;
        if (body.sttRemoveFillers !== undefined) updates.sttRemoveFillers = body.sttRemoveFillers;
        if (body.sttAzureDeployment !== undefined) updates.sttAzureDeployment = body.sttAzureDeployment;

        // TTS
        if (body.ttsProvider !== undefined) updates.ttsProvider = body.ttsProvider;
        if (body.ttsModel !== undefined) updates.ttsModel = body.ttsModel;
        if (body.ttsVoiceId !== undefined) updates.ttsVoiceId = body.ttsVoiceId || null;
        if (body.ttsLanguage !== undefined) updates.ttsLanguage = body.ttsLanguage;
        if (body.ttsSpeed !== undefined) updates.ttsSpeed = String(body.ttsSpeed);
        if (body.elevenLabsStability !== undefined) updates.elevenLabsStability = String(body.elevenLabsStability);
        if (body.elevenLabsSimilarity !== undefined) updates.elevenLabsSimilarity = String(body.elevenLabsSimilarity);
        if (body.ttsAzureDeployment !== undefined) updates.ttsAzureDeployment = body.ttsAzureDeployment;

        // Tools & Routing
        if (body.toolsConfig !== undefined) updates.toolsConfig = body.toolsConfig;

        // Outbound Robocall Config
        if (body.outboundGreetingText !== undefined) updates.outboundGreetingText = body.outboundGreetingText;
        if (body.outboundGreetingWav !== undefined) updates.outboundGreetingWav = body.outboundGreetingWav;
        if (body.resolvedFarewellText !== undefined) updates.resolvedFarewellText = body.resolvedFarewellText;
        if (body.resolvedFarewellWav !== undefined) updates.resolvedFarewellWav = body.resolvedFarewellWav;
        if (body.unresolvedFarewellText !== undefined) updates.unresolvedFarewellText = body.unresolvedFarewellText;
        if (body.unresolvedFarewellWav !== undefined) updates.unresolvedFarewellWav = body.unresolvedFarewellWav;

        // Robocall Governance Config
        if (body.outboundBatchLimit !== undefined) updates.outboundBatchLimit = body.outboundBatchLimit;
        if (body.outboundRetryInterval !== undefined) updates.outboundRetryInterval = body.outboundRetryInterval;
        if (body.outboundMaxRetries !== undefined) updates.outboundMaxRetries = body.outboundMaxRetries;
        if (body.outboundAllowedStart !== undefined) updates.outboundAllowedStart = body.outboundAllowedStart;
        if (body.outboundAllowedEnd !== undefined) updates.outboundAllowedEnd = body.outboundAllowedEnd;
        if (body.isOutboundActive !== undefined) updates.isOutboundActive = body.isOutboundActive;
        if (body.bypassOperatingHours !== undefined) updates.bypassOperatingHours = body.bypassOperatingHours;
        
        // New Dynamic Outbound Fields
        if (body.outboundSttModel !== undefined) updates.outboundSttModel = body.outboundSttModel;
        if (body.outboundLlmModel !== undefined) updates.outboundLlmModel = body.outboundLlmModel;
        if (body.outboundLlmTemperature !== undefined) updates.outboundLlmTemperature = String(body.outboundLlmTemperature);
        if (body.outboundTtsVoiceId !== undefined) updates.outboundTtsVoiceId = body.outboundTtsVoiceId;
        if (body.outboundTtsDictionaryId !== undefined) updates.outboundTtsDictionaryId = body.outboundTtsDictionaryId;
        if (body.bypassOutboundDictionary !== undefined) updates.bypassOutboundDictionary = body.bypassOutboundDictionary;
        if (body.outboundWatchdogNudgeText !== undefined) updates.outboundWatchdogNudgeText = body.outboundWatchdogNudgeText;
        
        // Eligibility Gating (Phase 18)
        if (body.eligibilityRules !== undefined) {
            updates.eligibilityRules = body.eligibilityRules;
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: "No valid fields provided to update" }, { status: 400 });
        }

        const [updated] = await db
            .update(schema.agents)
            .set(updates)
            .where(eq(schema.agents.id, id))
            .returning();

        if (!updated) {
            return NextResponse.json({ error: "Agent not found" }, { status: 404 });
        }

        // Sync to Redis
        await pushAgentToRedis(updated);

        return NextResponse.json({ agent: updated }, { status: 200 });
    } catch (err) {
        console.error(`[PATCH /api/agents/${id}]`, err);
        return NextResponse.json({ error: "Failed to update agent" }, { status: 500 });
    }
}

// ── DELETE /api/agents/[id] ─────────────────────────────────────────────────
export async function DELETE(req: NextRequest, context: any) {
    // Next.js 15+ uses async params, let's handle both for safety
    const params = await context.params;
    const id = params.id;

    console.log("🚀 DELETE REQUEST RECEIVED FOR ID:", id);

    try {
        const [deleted] = await db
            .delete(schema.agents)
            .where(eq(schema.agents.id, id))
            .returning({ id: schema.agents.id });

        if (!deleted) {
            console.log("❌ DELETE FAILED: No agent found in DB with ID:", id);
            return NextResponse.json({ error: "Agent not found in database" }, { status: 404 });
        }

        console.log("✅ SUCCESSFULLY DELETED FROM DB:", deleted.id);

        if (redis) {
            try {
                await redis.del(`agent:${deleted.id}`);
                console.log("🧹 REDIS CACHE CLEARED");
            } catch (e) {
                console.error("Failed to delete from Redis", e);
            }
        }

        return NextResponse.json({ success: true, id: deleted.id }, { status: 200 });
    } catch (err) {
        console.error(`[DELETE /api/agents/${id}]`, err);
        return NextResponse.json({ error: "Database error during deletion" }, { status: 500 });
    }
}
