import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/asterisk/channels
 * Returns list of active channels from Asterisk.
 * In production: connect to AMI and run "core show channels verbose"
 *
 * POST /api/asterisk/channels/hangup
 * Hangs up a channel via AMI action "Hangup"
 */
export async function GET(req: NextRequest) {
    try {
        const channels = [
            {
                id: "PJSIP/vonex-00000001",
                name: "PJSIP/vonex-00000001",
                state: "Up",
                callerIdNum: "+61412345678",
                callerIdName: "John Smith",
                duration: 180,
                extension: "1001",
                context: "from-trunk",
                linkedChannel: "Local/agent-sarah@agents",
            },
            {
                id: "PJSIP/mynetfone-00000002",
                name: "PJSIP/mynetfone-00000002",
                state: "Up",
                callerIdNum: "+61298765432",
                callerIdName: "Sarah Johnson",
                duration: 65,
                extension: "1002",
                context: "from-trunk",
                linkedChannel: "Local/agent-emma@agents",
            },
            {
                id: "PJSIP/symbio-00000003",
                name: "PJSIP/symbio-00000003",
                state: "Ringing",
                callerIdNum: "+61387654321",
                callerIdName: "Unknown",
                duration: 5,
                extension: "1003",
                context: "from-trunk",
                linkedChannel: null,
            },
        ];

        return NextResponse.json({ success: true, data: channels, count: channels.length });
    } catch (error) {
        console.error("Asterisk channels error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch channels from Asterisk" },
            { status: 503 }
        );
    }
}

/**
 * POST /api/asterisk/channels
 * Originate a new call via AMI "Originate" action.
 * Body: { endpoint: string, extension: string, context: string, priority?: number }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { endpoint, extension, context = "from-internal", callerIdName, callerIdNum } = body;

        if (!endpoint || !extension) {
            return NextResponse.json(
                { success: false, error: "endpoint and extension are required" },
                { status: 400 }
            );
        }

        // In production: send AMI Originate action
        // Action: Originate
        // Channel: PJSIP/${endpoint}
        // Exten: ${extension}
        // Context: ${context}
        // Priority: 1
        // CallerID: "${callerIdName}" <${callerIdNum}>

        const result = {
            actionId: `originate-${Date.now()}`,
            channel: `PJSIP/${endpoint}`,
            extension,
            context,
            status: "Initiated",
            timestamp: new Date().toISOString(),
        };

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error("Asterisk originate error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to originate call" },
            { status: 500 }
        );
    }
}
