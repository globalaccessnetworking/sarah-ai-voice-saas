/**
 * Global Access AI Engine
 * GET /api/calls/live-feed
 * Simulates the dual websocket pipeline:
 * 1. Deepgram Nova-3 (Raw Urdu/Punjabi phonetic capture)
 * 2. Claude 3.5 Sonnet (Refined English translation and CRM tagging)
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    // Return an initial state for the live call
    return NextResponse.json({
        callId: "call_ptcl_lhr_09392",
        status: "in-progress",
        startTime: new Date(Date.now() - 45000).toISOString(), // 45 seconds ago
        caller: {
            phone: "+92 300 1234567",
            location: "Lahore, Pakistan",
            name: "Zubair Ahmad",
        },
        aiAgent: {
            id: "agent_urdu_support",
            name: "Support Agent (Urdu/Punjabi)",
            voice: "ElevenLabs (Lahori Male Clone)",
            llm: "GPT-4o (Reasoning) + Claude 3.5 (Analysis)"
        },
        // Real-time Deepgram STT feed
        rawTranscript: [
            { id: 1, speaker: "ai", text: "Assalam-o-Alaikum, Global Access Support mein khush aamdeed. Main aap ki kya madad kar sakta hoon?", time: "00:03" },
            { id: 2, speaker: "user", text: "Assalam-o-Alaikum, bhai Johar Town G-Block mein ghattar band hai, sara pani raste pe aa raha hai.", time: "00:12" },
            { id: 3, speaker: "ai", text: "Walaikum Assalam Zubair Bhai, pareshan na hon. Main abhi Johar Town ki complaint note kar leta hoon.", time: "00:18" },
            { id: 4, speaker: "user", text: "Yar jaldi bhejain kisi ko, bara masla ban gaya hai gali mein.", time: "00:25" },
            { id: 5, speaker: "ai", text: "Jee bilkul, main emergency team ko assign kar raha hoon. G-Block ke kis house number ke paas hai ye?", time: "00:32" },
            { id: 6, speaker: "user", text: "House number 142 ke bilkul samne.", time: "00:41" }
        ],
        // Claude 3.5 Smart Summary updated in parallel
        claudeAnalysis: {
            summary: "Sewerage blockage reported in Johar Town, G-Block outside House 142. Customer is distressed and requesting urgent assistance. AI has initiated emergency ticket creation.",
            tags: ["EMERGENCY", "SEWERAGE", "JOHAR TOWN", "FRUSTRATED CUSTOMER"],
            sentimentScore: 28, // 0-100 (Angry -> Happy)
            actionRequired: "Dispatch Plumber Team",
            lastUpdated: new Date().toISOString()
        },
        sysMetrics: {
            deepgramLatencyMs: 145,
            gpt4oLatencyMs: 650,
            claudeLatencyMs: 2100, // Background processing, doesn't block voice
            elevenLabsLatencyMs: 320
        }
    });
}
