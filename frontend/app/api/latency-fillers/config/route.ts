import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Simulated DB for latency fillers config
let fillerConfig = {
    triggerThresholdMs: 800,
    randomizePlayback: true,
    enabled: true,
    audioAssets: [
        { id: "1", filename: "aik_second.wav", phrase: "Jee aik second dejiye ga...", durationMs: 1200, status: "Active" },
        { id: "2", filename: "acha_hmm.wav", phrase: "Acha... main dekhta hoon...", durationMs: 1500, status: "Active" },
        { id: "3", filename: "check_karta.wav", phrase: "Main abhi check kar raha hoon...", durationMs: 1800, status: "Active" },
        { id: "4", filename: "zara_line_pe.wav", phrase: "Zara line pe rahiyega...", durationMs: 1400, status: "Inactive" }
    ]
};

export async function GET() {
    return NextResponse.json(fillerConfig);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // Update general config
        if (body.triggerThresholdMs !== undefined) fillerConfig.triggerThresholdMs = body.triggerThresholdMs;
        if (body.randomizePlayback !== undefined) fillerConfig.randomizePlayback = body.randomizePlayback;
        if (body.enabled !== undefined) fillerConfig.enabled = body.enabled;
        
        // Add new audio asset if provided
        if (body.newAsset) {
            fillerConfig.audioAssets.push({
                id: Date.now().toString(),
                filename: body.newAsset.filename || "custom_filler.wav",
                phrase: body.newAsset.phrase,
                durationMs: body.newAsset.durationMs || 1000,
                status: "Active"
            });
        }
        
        return NextResponse.json({ success: true, config: fillerConfig });
    } catch (err) {
        return NextResponse.json({ error: "Failed to update filler configuration" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get("id");
        
        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }
        
        fillerConfig.audioAssets = fillerConfig.audioAssets.filter(a => a.id !== id);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: "Failed to delete filler asset" }, { status: 500 });
    }
}
