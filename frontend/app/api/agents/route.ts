/**
 * Global Access AI Engine
 * GET/POST /api/agents
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { pushAgentToRedis } from "@/lib/redis";

// Force this route to always run on the server at request time (never statically pre-rendered)
export const dynamic = "force-dynamic";

// ── Helper to generate a sovereign agent ID ───────────────────────────────
function newAgentId(): string {
    return "agt_" + randomBytes(12).toString("hex");
}

// ── Slug validator ─────────────────────────────────────────────────────────
function isValidSlug(slug: string): boolean {
    return /^[a-z0-9-]+$/.test(slug);
}

// ════════════════════════════════════════════════════════════════════════════
// GET /api/agents — list all agents
// ════════════════════════════════════════════════════════════════════════════
export async function GET() {
    try {
        const agents = await db
            .select()
            .from(schema.agents)
            .orderBy(schema.agents.createdAt);

        return NextResponse.json({ agents }, { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[GET /api/agents]", err);
        return NextResponse.json(
            { error: "Failed to fetch agents", detail: message },
            { status: 500 }
        );
    }
}

// ════════════════════════════════════════════════════════════════════════════
// POST /api/agents — create a new agent
// ════════════════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // ── Validation ──────────────────────────────────────────────────────────
        if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
            return NextResponse.json({ error: "Agent name is required" }, { status: 400 });
        }
        if (!body.slug || !isValidSlug(body.slug)) {
            return NextResponse.json(
                { error: "Slug is required and must be lowercase alphanumeric with hyphens only" },
                { status: 400 }
            );
        }
        if (!body.systemPrompt || body.systemPrompt.trim() === "") {
            return NextResponse.json({ error: "System prompt is required" }, { status: 400 });
        }

        // ── Slug uniqueness check ────────────────────────────────────────────────
        const [existing] = await db
            .select({ id: schema.agents.id })
            .from(schema.agents)
            .where(eq(schema.agents.slug, body.slug))
            .limit(1);

        if (existing) {
            return NextResponse.json(
                { error: `An agent with slug "${body.slug}" already exists. Choose a unique slug.` },
                { status: 409 }
            );
        }

        // ── Insert ───────────────────────────────────────────────────────────────
        const [created] = await db
            .insert(schema.agents)
            .values({
                id: newAgentId(),

                // Identity
                name: body.name.trim(),
                slug: body.slug,
                systemPrompt: body.systemPrompt,
                initialGreeting: body.initialGreeting ?? "",
                knowledgeBase: body.knowledgeBase ?? "",
                toolInstructions: body.toolInstructions ?? "",

                // Pipeline
                pipelineMode: body.pipelineMode === "realtime" ? "realtime" : "standard",

                // LLM
                llmProvider: body.llmProvider ?? "openai",
                llmModel: body.llmModel ?? "gpt-4o",
                llmTemperature: String(body.llmTemperature ?? "0.8"),
                llmAzureDeployment: body.llmAzureDeployment ?? null,

                // STT
                sttProvider: body.sttProvider ?? "deepgram",
                sttModel: body.sttModel ?? "nova-3-general",
                sttLanguage: body.sttLanguage ?? "en-US",
                sttResponsiveness: String(body.sttResponsiveness ?? "0.6"),
                sttDetectLanguage: body.sttDetectLanguage ?? false,
                sttCustomVocab: body.sttCustomVocab ?? null,
                sttSmartFormatting: body.sttSmartFormatting ?? true,
                sttRemoveFillers: body.sttRemoveFillers ?? true,
                sttAzureDeployment: body.sttAzureDeployment ?? null,

                // TTS
                ttsProvider: body.ttsProvider ?? "cartesia",
                ttsModel: body.ttsModel ?? "sonic-2",
                ttsVoiceId: body.ttsVoiceId || null,
                ttsLanguage: body.ttsLanguage ?? "en-US",
                ttsSpeed: body.ttsSpeed != null ? String(body.ttsSpeed) : null,
                elevenLabsStability: body.elevenLabsStability != null ? String(body.elevenLabsStability) : null,
                elevenLabsSimilarity: body.elevenLabsSimilarity != null ? String(body.elevenLabsSimilarity) : null,
                ttsAzureDeployment: body.ttsAzureDeployment ?? null,

                // Realtime
                rtProvider: body.rtProvider ?? "google",
                rtModel: body.rtModel ?? "gemini-2.5-flash-native-audio-preview-12-2025",
                rtVoice: body.rtVoice ?? "Puck",
                rtLanguage: body.rtLanguage || null,
                rtModalities: body.rtModalities ?? "text_audio",
                rtProactivity: body.rtProactivity ?? false,
                rtAffectiveDialog: body.rtAffectiveDialog ?? false,
                rtNoiseReduction: body.rtNoiseReduction ?? false,
                rtThinkingBudget: body.rtThinkingBudget ?? "auto",
                rtMaxOutputTokens: body.rtMaxOutputTokens ? Number(body.rtMaxOutputTokens) : null,
                rtTopP: body.rtTopP ? String(body.rtTopP) : null,
                rtTemperature: body.rtTemperature != null ? String(body.rtTemperature) : "0.8",
                rtSpeed: body.rtSpeed ? String(body.rtSpeed) : null,
                rtTurnDetection: body.rtTurnDetection || null,
                rtTurnDetectionEagerness: body.rtTurnDetectionEagerness || null,
                rtCtxCompressionEnabled: body.rtCtxCompression ?? false,
                rtCtxCompressionTrigger: body.rtCtxTrigger ? Number(body.rtCtxTrigger) : null,
                rtCtxCompressionTarget: body.rtCtxTarget ? Number(body.rtCtxTarget) : null,
                rtAzureDeployment: body.rtAzureDeployment ?? null,

                // Extension
                toolsConfig: body.toolsConfig ?? {},
                extraConfig: body.extraConfig ?? {},

                // Always start stopped
                status: "stopped",
            })
            .returning();

        // Sync to Redis
        if (created) {
            await pushAgentToRedis(created);
        }

        return NextResponse.json({ agent: created }, { status: 201 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[POST /api/agents]", err);
        return NextResponse.json(
            { error: "Failed to create agent", detail: message },
            { status: 500 }
        );
    }
}
