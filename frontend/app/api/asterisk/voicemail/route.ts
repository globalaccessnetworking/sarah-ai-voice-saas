import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/asterisk/voicemail
 * Returns all voicemail messages across all mailboxes.
 * In production: read /var/spool/asterisk/voicemail/ directory structure,
 * or query via AMI "VoicemailUsersList"
 */
export async function GET(req: NextRequest) {
    try {
        const voicemails = [
            {
                mailbox: "dental@default",
                folder: "INBOX",
                message: 1,
                callerNum: "+61412345678",
                callerName: "John Smith",
                duration: 48,
                receivedAt: "2026-03-11T06:01:23Z",
                read: false,
                transcription: "Hi, this is John from ABC Dental...",
                filePath: "/var/spool/asterisk/voicemail/default/dental/INBOX/msg0001.wav",
            },
            {
                mailbox: "sales@default",
                folder: "INBOX",
                message: 1,
                callerNum: "+61298765432",
                callerName: "Unknown",
                duration: 32,
                receivedAt: "2026-03-11T05:45:10Z",
                read: false,
                transcription: null,
                filePath: "/var/spool/asterisk/voicemail/default/sales/INBOX/msg0001.wav",
            },
        ];

        return NextResponse.json({ success: true, data: voicemails, count: voicemails.length });
    } catch (error) {
        console.error("Asterisk voicemail error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch voicemail data" },
            { status: 503 }
        );
    }
}

/**
 * POST /api/asterisk/voicemail/transcribe
 * Transcribes a voicemail using OpenAI Whisper API.
 * Body: { mailbox, message, filePath }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { mailbox, message, filePath } = body;

        if (!mailbox || !message) {
            return NextResponse.json(
                { success: false, error: "mailbox and message are required" },
                { status: 400 }
            );
        }

        // In production:
        // 1. Read audio from filePath (or stream from S3)
        // 2. Send to OpenAI Whisper: openai.audio.transcriptions.create({ file, model: "whisper-1" })
        // 3. Store transcript in database
        // 4. Return transcript

        const mockTranscript = "Hi there, I saw your advertisement online and I'm very interested in finding out more about your AI phone system for my business. We currently handle about 200 calls per day. Please call me back.";

        return NextResponse.json({
            success: true,
            data: {
                mailbox,
                message,
                transcript: mockTranscript,
                model: "whisper-1",
                duration: 32,
                timestamp: new Date().toISOString(),
            }
        });
    } catch (error) {
        console.error("Voicemail transcribe error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to transcribe voicemail" },
            { status: 500 }
        );
    }
}
