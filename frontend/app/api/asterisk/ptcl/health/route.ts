import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    // Simulated live metrics for PTCL SIP Trunk
    const packetLoss = Math.max(0, parseFloat((Math.random() * 0.8).toFixed(2))); // 0 to 0.8%
    const pingMs = Math.floor(25 + Math.random() * 15); // 25 to 40ms
    const activeCalls = Math.floor(Math.random() * 30); // 0 to 30

    // Dialect routing config simulate
    const dialectConfig = {
        enabled: true,
        ivrPrompt: "Welcome to Global Access. Urdu ke liye 1 dabayein, Punjabi layi 2 dabao.",
        routes: [
            { dtmf: "1", dialect: "Urdu", agentProfile: "agent_urdu_formal", voice: "elevenlabs_lahori_formal" },
            { dtmf: "2", dialect: "Punjabi", agentProfile: "agent_punjabi_casual", voice: "elevenlabs_punjabi_fluent" }
        ]
    };

    return NextResponse.json({
        health: {
            status: packetLoss > 0.5 ? "Degraded" : "Healthy",
            trunkName: "PTCL_LHR_001",
            host: "10.0.0.1 (PTCL SBC)",
            pingMs,
            packetLoss,
            activeCalls,
            maxCalls: 100,
            uptime: "45d 12h 30m"
        },
        dialectRouting: dialectConfig
    });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        // Simulate save config
        return NextResponse.json({ success: true, message: "Configuration saved successfully" });
    } catch (err) {
        return NextResponse.json({ error: "Failed to update configuration" }, { status: 500 });
    }
}
