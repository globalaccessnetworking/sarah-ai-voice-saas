import { NextResponse } from "next/server";
import { writeFile, unlink, mkdir, rename } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

/**
 * Sarah Outbound Robocall - Audio Asset Handler
 * Handles:
 * - POST: Upload .wav (greeting / resolved / unresolved)
 * - DELETE: Remove .wav
 * Files are stored in public/uploads/outbound/
 */

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const url = new URL(request.url);
        const fieldType = url.searchParams.get("type"); // e.g. greeting, resolved, unresolved

        if (!fieldType) {
            return NextResponse.json({ error: "Missing 'type' parameter" }, { status: 400 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        if (!file.name.toLowerCase().endsWith(".wav")) {
            return NextResponse.json({ error: "Only .wav files are allowed" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Path Determination
        const rootDir = process.cwd();
        const uploadDir = rootDir.endsWith("frontend") 
            ? path.join(rootDir, "public/uploads/outbound")
            : path.join(rootDir, "frontend/public/uploads/outbound");

        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Filename: {agent_id}_{fieldType}.wav (Atomic Overwrite)
        const filename = `${id}_${fieldType}.wav`;
        const filepath = path.join(uploadDir, filename);

        // Explicitly delete old file if it exists to be sure
        if (existsSync(filepath)) {
            await unlink(filepath).catch(() => {});
        }

        await writeFile(filepath, buffer);

        // Dynamic URL detection
        let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
        if (!baseUrl || baseUrl.includes("localhost")) {
            const host = request.headers.get("host");
            if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
                const protocol = request.headers.get("x-forwarded-proto") || "http";
                baseUrl = `${protocol}://${host}`;
            }
        }

        const publicUrl = `${baseUrl}/uploads/outbound/${filename}`;

        return NextResponse.json({ 
            success: true, 
            url: publicUrl,
            filename: filename
        });
    } catch (error) {
        console.error("Failed to upload outbound audio:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const url = new URL(request.url);
        const fieldType = url.searchParams.get("type");

        if (!fieldType) {
            return NextResponse.json({ error: "Missing 'type' parameter" }, { status: 400 });
        }

        const filename = `${id}_${fieldType}.wav`;
        const rootDir = process.cwd();
        const uploadDir = rootDir.endsWith("frontend") 
            ? path.join(rootDir, "public/uploads/outbound")
            : path.join(rootDir, "frontend/public/uploads/outbound");
        
        const filepath = path.join(uploadDir, filename);

        if (existsSync(filepath)) {
            await unlink(filepath);
        }

        return NextResponse.json({ success: true, message: "Recording deleted" });
    } catch (error) {
        console.error("Failed to delete outbound audio:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
