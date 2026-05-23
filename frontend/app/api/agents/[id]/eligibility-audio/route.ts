import { NextResponse } from "next/server";
import { writeFile, unlink, mkdir, rename } from "fs/promises";
import path from "path";
import { existsSync, readdirSync } from "fs";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { pushAgentToRedis } from "@/lib/redis";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type"); // city, area, commercial, latency_masking

        if (!type || !["city", "area", "commercial", "latency_masking"].includes(type)) {
            return NextResponse.json({ error: "Invalid or missing audio type (city, area, commercial, or latency_masking)" }, { status: 400 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Restrict to .wav as per instructions
        if (!file.name.toLowerCase().endsWith(".wav")) {
            return NextResponse.json({ error: "Only .wav files are allowed" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Construct paths
        const rootDir = process.cwd();
        const uploadDir = rootDir.endsWith("frontend") 
            ? path.join(rootDir, "public/audio/eligibility")
            : path.join(rootDir, "frontend/public/audio/eligibility");

        // Ensure directory exists
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Clean up OLD files for this agent/type to avoid clutter 
        // (Matching [agent_id]_[type]_*)
        try {
            const files = readdirSync(uploadDir);
            for (const f of files) {
                if (f.startsWith(`${id}_${type}_`)) {
                    await unlink(path.join(uploadDir, f)).catch(() => {});
                }
            }
        } catch (e) {
            console.warn("Cleanup of old eligibility audio failed:", e);
        }

        // Use agent ID, type, and timestamp in filename to prevent caching
        const timestamp = Date.now();
        const filename = `${id}_${type}_${timestamp}.wav`;
        const filepath = path.join(uploadDir, filename);
        const tempPath = `${filepath}.tmp`;

        // Atomic write
        await writeFile(tempPath, buffer);
        await rename(tempPath, filepath);

        // ─── Database Update ───
        // Fetch current agent to get eligibilityRules
        const [agent] = await db
            .select()
            .from(schema.agents)
            .where(eq(schema.agents.id, id))
            .limit(1);

        if (!agent) {
            return NextResponse.json({ error: "Agent not found" }, { status: 404 });
        }

        const currentRules = (agent.eligibilityRules as any) || {};
        
        // Map types to JSONB keys
        const keyMap: Record<string, string> = {
            city: "cityApologyAudio",
            area: "areaApologyAudio",
            commercial: "commercialApologyAudio",
            latency_masking: "latencyMaskingAudio"
        };
        
        const audioKey = keyMap[type];
        const audioUrl = `/api/agents/${id}/eligibility-audio?type=${type}&t=${timestamp}`;

        const updatedRules = {
            ...currentRules,
            [audioKey]: audioUrl
        };

        const [updated] = await db
            .update(schema.agents)
            .set({ eligibilityRules: updatedRules })
            .where(eq(schema.agents.id, id))
            .returning();

        // Sync to Redis so Python worker picks up the new rules
        await pushAgentToRedis(updated);

        // Detect Base URL for response
        let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
        if (!baseUrl || baseUrl.includes("localhost")) {
            const host = request.headers.get("host");
            if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
                const protocol = request.headers.get("x-forwarded-proto") || "http";
                baseUrl = `${protocol}://${host}`;
            }
        }

        const absoluteUrl = baseUrl ? `${baseUrl}${audioUrl}` : audioUrl;

        return NextResponse.json({ 
            success: true, 
            url: absoluteUrl,
            filename: filename,
            type: type
        });
    } catch (error) {
        console.error("Failed to upload eligibility audio:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");

        if (!type) {
            return new Response("Missing type parameter", { status: 400 });
        }

        const rootDir = process.cwd();
        const uploadDir = rootDir.endsWith("frontend") 
            ? path.join(rootDir, "public/audio/eligibility")
            : path.join(rootDir, "frontend/public/audio/eligibility");
        
        if (!existsSync(uploadDir)) {
            return new Response("Not found", { status: 404 });
        }

        // Find the latest file for this agent/type (since we appended timestamp)
        const files = readdirSync(uploadDir);
        const matchingFiles = files
            .filter(f => f.startsWith(`${id}_${type}_`))
            .sort((a, b) => {
                const tsA = parseInt(a.split('_').pop()?.replace('.wav', '') || '0');
                const tsB = parseInt(b.split('_').pop()?.replace('.wav', '') || '0');
                return tsB - tsA;
            });

        if (matchingFiles.length === 0) {
            return new Response("Audio file not found for this agent and type", { status: 404 });
        }

        const latestFile = matchingFiles[0];
        const filepath = path.join(uploadDir, latestFile);
        
        const { readFileSync } = require('fs');
        const buffer = readFileSync(filepath);
        
        return new Response(buffer, {
            headers: {
                "Content-Type": "audio/wav",
                "Cache-Control": "no-store, must-revalidate",
                "Content-Disposition": `inline; filename="${latestFile}"`
            }
        });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
