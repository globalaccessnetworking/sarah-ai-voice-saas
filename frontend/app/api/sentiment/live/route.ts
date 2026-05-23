import { NextResponse } from "next/server";

export async function GET() {
    // TODO: Replace with real-time data from:
    // - OpenAI Whisper / Deepgram sentiment inference pipeline
    // - Your AMI live channel feed

    const liveCalls = [
        { id: "c1", caller: "+61412345678", agent: "Sarah AI", client: "Bright Smiles Dental", duration: 145, sentiment: 0.72, trend: "rising", escalated: false, keywords: ["appointment", "Tuesday"] },
        { id: "c2", caller: "+61298765432", agent: "Emma AI", client: "Peak Performance Gym", duration: 67, sentiment: -0.18, trend: "falling", escalated: false, keywords: ["cancel", "refund"] },
        { id: "c3", caller: "+61387654321", agent: "James AI", client: "City Medical", duration: 230, sentiment: 0.35, trend: "stable", escalated: false, keywords: ["booking"] },
    ];

    const history = [
        { callId: "h1", avgSentiment: 0.68, lowestSentiment: 0.21, escalated: false, outcome: "Booked", client: "Bright Smiles", date: new Date().toISOString() },
        { callId: "h2", avgSentiment: -0.45, lowestSentiment: -0.82, escalated: true, escalationTimeSecs: 142, outcome: "Escalated → Resolved", client: "Peak Performance", date: new Date(Date.now() - 15 * 60000).toISOString() },
    ];

    const avgSentiment = liveCalls.reduce((s, c) => s + c.sentiment, 0) / liveCalls.length;
    return NextResponse.json({ liveCalls, history, avgSentiment, escalatedCount: liveCalls.filter(c => c.escalated).length });
}

export async function POST(req: Request) {
    const body = await req.json();
    const { action, callId, threshold } = body;

    if (action === "escalate") {
        // TODO: AMI Action: Redirect channel to human agent queue
        // await amiAction({ Action: "Redirect", Channel: callId, Context: "human-agents", Exten: "8999" });
        return NextResponse.json({ success: true, message: `Call ${callId} escalated to human agent queue` });
    }

    if (action === "update_threshold") {
        // TODO: Update in DB
        return NextResponse.json({ success: true, threshold });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
