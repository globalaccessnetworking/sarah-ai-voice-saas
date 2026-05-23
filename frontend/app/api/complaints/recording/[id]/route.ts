import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Path to the recordings directory in the ai-worker folder
const RECORDINGS_DIR = path.join(process.cwd(), "..", "ai-worker", "recordings");

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const id = params.id;
        if (!id) {
            return NextResponse.json({ error: "Recording ID is required" }, { status: 400 });
        }

        // Case 1: Asterisk Recordings
        if (id.startsWith("asterisk-")) {
            const ASTERISK_MONITOR_DIR = "/var/spool/asterisk/monitor";
            if (!fs.existsSync(ASTERISK_MONITOR_DIR)) {
                return NextResponse.json({ error: "Asterisk storage not accessible" }, { status: 500 });
            }
            const asteriskFiles = fs.readdirSync(ASTERISK_MONITOR_DIR);
            const searchPattern = id.replace("asterisk-", "");
            const targetFile = asteriskFiles.find(f => f.includes(searchPattern));
            
            if (!targetFile) {
                return NextResponse.json({ error: "Asterisk recording not found" }, { status: 404 });
            }
            
            const filePath = path.join(ASTERISK_MONITOR_DIR, targetFile);
            const fileBuffer = fs.readFileSync(filePath);
            return new NextResponse(fileBuffer, {
                headers: {
                    "Content-Type": "audio/wav",
                    "Content-Length": fileBuffer.length.toString(),
                },
            });
        }

        // Case 2: LiveKit Egress Recordings
        const files = fs.readdirSync(RECORDINGS_DIR);
        const targetFile = files.find(f => f.includes(id));

        if (!targetFile) {
            return NextResponse.json({ error: "Recording not found" }, { status: 404 });
        }

        const filePath = path.join(RECORDINGS_DIR, targetFile);
        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(targetFile).toLowerCase();
        
        let contentType = "audio/mpeg";
        if (ext === ".mp4") contentType = "video/mp4";
        if (ext === ".wav") contentType = "audio/wav";
        if (ext === ".m4a") contentType = "audio/mp4";

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": contentType,
                "Content-Length": fileBuffer.length.toString(),
            },
        });
    } catch (error: any) {
        console.error("Recording stream error:", error);
        return NextResponse.json({ error: "Failed to stream recording" }, { status: 500 });
    }
}
