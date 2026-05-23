import { NextResponse } from "next/server";

export async function GET() {
    // TODO: Replace with real metrics from:
    // - Prometheus/Grafana: query STT/LLM/TTS latency histograms
    // - Your call processing pipeline (LiveKit, Deepgram, OpenAI webhooks)
    // - InfluxDB / CloudWatch

    const providers = [
        { provider: "Deepgram Nova-3", category: "STT", p50: 120, p90: 180, p99: 310, avg: 138, trend: "stable" },
        { provider: "OpenAI Whisper", category: "STT", p50: 380, p90: 620, p99: 1100, avg: 420, trend: "down" },
        { provider: "GPT-4o-mini", category: "LLM", p50: 280, p90: 480, p99: 820, avg: 310, trend: "down" },
        { provider: "Gemini 2.5 Flash", category: "LLM", p50: 195, p90: 310, p99: 590, avg: 220, trend: "down" },
        { provider: "Cartesia Sonic-2", category: "TTS", p50: 88, p90: 135, p99: 210, avg: 96, trend: "down" },
        { provider: "ElevenLabs Flash v2.5", category: "TTS", p50: 72, p90: 118, p99: 195, avg: 81, trend: "down" },
    ];

    const waterfall = {
        networkInbound: 25,
        stt: 120,
        llm: 280,
        tts: 88,
        networkOutbound: 18,
        totalMs: 531,
    };

    const ttfb = { p50: 431, p90: 682, p99: 1041, current: Math.round(490 + Math.random() * 90) };
    const mos = Math.max(1, 5 - (ttfb.p50 - 200) / 300);

    return NextResponse.json({ providers, waterfall, ttfb, mos: mos.toFixed(1) });
}
