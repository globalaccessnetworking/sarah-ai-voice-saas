import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const clientId = searchParams.get("clientId");
    const flagged = searchParams.get("flagged") === "true";

    // TODO: Replace with real vector search or full-text SQL search
    // E.g. SELECT * FROM call_transcripts WHERE to_tsvector(transcript) @@ plainto_tsquery($1)
    // Or use Pinecone/Weaviate for semantic search

    const mockTranscripts = [
        { id: "t1", callId: "CALL-001", client: "Bright Smiles", date: new Date().toISOString(), snippet: "...appointment for a dental check-up...", sentiment: 0.72, flags: [] },
        { id: "t2", callId: "CALL-002", client: "Peak Gym", date: new Date(Date.now() - 900000).toISOString(), snippet: "...cancel membership immediately. charged twice...", sentiment: -0.82, flags: ["refund", "cancel"] },
        { id: "t3", callId: "CALL-003", client: "Locksmith", date: new Date(Date.now() - 7200000).toISOString(), snippet: "...credit card number is 4532... CVV...", sentiment: -0.91, flags: ["credit card number", "CVV", "PCI violation"] },
    ];

    const filtered = mockTranscripts.filter(t => {
        if (query && !t.snippet.toLowerCase().includes(query.toLowerCase())) return false;
        if (clientId && !t.client.toLowerCase().includes(clientId.toLowerCase())) return false;
        if (flagged && t.flags.length === 0) return false;
        return true;
    });

    return NextResponse.json({ results: filtered, total: filtered.length, query });
}

export async function POST(req: Request) {
    const body = await req.json();
    const { action, callId, transcript } = body;

    if (action === "analyze") {
        // TODO: const analysis = await openai.chat.completions.create({
        //   model: "gpt-4o",
        //   messages: [{ role: "user", content: `Analyze this call transcript and explain why it failed:\n\n${transcript}` }]
        // });
        await new Promise(r => setTimeout(r, 1000));
        return NextResponse.json({
            callId,
            failureReason: "Agent did not acknowledge the primary complaint within 30 seconds, causing sentiment to drop.",
            keyMoments: [{ time: "0:08", event: "Complaint raised — not acknowledged", impact: "negative" }],
            recommendations: ["Add complaint detection keyword → empathy response", "Acknowledge financial issues in first 2 turns"],
            objections: ["Feeling ignored", "No resolution offered"],
        });
    }

    if (action === "flag_compliance") {
        // TODO: Log to compliance DB + send alert
        return NextResponse.json({ success: true, message: `Call ${callId} flagged for compliance review` });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
