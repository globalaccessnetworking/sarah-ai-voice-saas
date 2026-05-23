import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/asterisk/status
 * Returns Asterisk PBX connection status, uptime, version, and channel counts.
 * In production, this would query the AMI (Asterisk Manager Interface) via a WebSocket or TCP connection.
 */
export async function GET(req: NextRequest) {
    try {
        // Mock Asterisk status response
        // In production: connect via AMI at port 5038, authenticate, run "core show channels" and "core show version"
        const status = {
            connected: true,
            version: "20.8.1",
            uptime: "14d 6h 22m",
            activeChannels: 4,
            ringingChannels: 1,
            registeredTrunks: 3,
            totalTrunks: 4,
            cpu: 12,
            memoryPercent: 38,
            mosScore: 4.3,
            packetLoss: 0.1,
            jitterMs: 2.3,
            agiConnected: true,
            cdrConnected: true,
            timestamp: new Date().toISOString(),
        };

        return NextResponse.json({ success: true, data: status });
    } catch (error) {
        console.error("Asterisk status error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to connect to Asterisk AMI" },
            { status: 503 }
        );
    }
}
