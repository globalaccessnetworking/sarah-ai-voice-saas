import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Simulated DB for Voice Tuning
let voiceConfig = {
    voiceId: "lahori_male_v1",
    stability: 35, // Lower stability for emotional range
    similarityBoost: 85, // High similarity for native clone precision
    styleExaggeration: 0,
    speakerBoost: true,
    features: {
        ssmlAutoInject: true,
        pitchCorrectionOnQuestion: true,
        laughInsertion: false
    }
};

export async function GET() {
    return NextResponse.json(voiceConfig);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        voiceConfig = { ...voiceConfig, ...body };
        return NextResponse.json({ success: true, config: voiceConfig });
    } catch (err) {
        return NextResponse.json({ error: "Failed to update voice configuration" }, { status: 500 });
    }
}
