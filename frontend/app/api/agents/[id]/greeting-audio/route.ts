import { NextResponse } from "next/server";
import { writeFile, unlink, mkdir, rename } from "fs/promises";
import path from "path";
import { existsSync, readFileSync } from "fs";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Restrict to .wav as per Lead Architect's instructions
        if (!file.name.toLowerCase().endsWith(".wav")) {
            return NextResponse.json({ error: "Only .wav files are allowed" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Construct paths
        const rootDir = process.cwd();
        const uploadDir = rootDir.endsWith("frontend") 
            ? path.join(rootDir, "public/audio/greetings")
            : path.join(rootDir, "frontend/public/audio/greetings");

        // Ensure directory exists recursively before writing
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Use agent ID in filename
        const filename = `${id}.wav`;
        const filepath = path.join(uploadDir, filename);
        const tempPath = `${filepath}.tmp`;

        // Atomic write: write to .tmp then rename to .wav
        await writeFile(tempPath, buffer);
        await rename(tempPath, filepath);

        // RECOVERY LOGIC: Use Env OR detect from Host Header
        let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
        
        // If Env is missing, try to detect from the incoming request (unless it's localhost)
        if (!baseUrl || baseUrl.includes("localhost")) {
            const host = request.headers.get("host");
            if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
                const protocol = request.headers.get("x-forwarded-proto") || "http";
                baseUrl = `${protocol}://${host}`;
            }
        }

        // Final Validation: If we still don't have a valid IP/Domain, throw clear error
        if (!baseUrl || baseUrl.includes("localhost")) {
            console.error("CONFIG ERROR: No valid Base URL found. Please check .env.local");
            return NextResponse.json({ 
                error: "Server Configuration Error: NEXT_PUBLIC_APP_URL is missing and could not be detected from request.",
                success: false 
            }, { status: 500 });
        }

        const absoluteUrl = `${baseUrl}/api/agents/${id}/greeting-audio`;

        return NextResponse.json({ 
            success: true, 
            url: absoluteUrl,
            filename: filename
        });
    } catch (error) {
        console.error("Failed to upload greeting audio:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const filename = `${id}.wav`;
        const rootDir = process.cwd();
        const uploadDir = rootDir.endsWith("frontend") 
            ? path.join(rootDir, "public/audio/greetings")
            : path.join(rootDir, "frontend/public/audio/greetings");
        
        const filepath = path.join(uploadDir, filename);

        if (existsSync(filepath)) {
            await unlink(filepath);
        }

        return NextResponse.json({ success: true, message: "Recording deleted" });
    } catch (error) {
        console.error("Failed to delete greeting audio:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const filename = `${id}.wav`;
        const rootDir = process.cwd();
        const uploadDir = rootDir.endsWith("frontend") 
            ? path.join(rootDir, "public/audio/greetings")
            : path.join(rootDir, "frontend/public/audio/greetings");
        
        const filepath = path.join(uploadDir, filename);

        if (!existsSync(filepath)) {
            return new Response("Not found", { status: 404 });
        }

        const fs = require('fs');
        const buffer = fs.readFileSync(filepath);
        
        return new Response(buffer, {
            headers: {
                "Content-Type": "audio/wav",
                "Cache-Control": "no-store, must-revalidate",
                "Content-Disposition": `inline; filename="${filename}"`
            }
        });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
