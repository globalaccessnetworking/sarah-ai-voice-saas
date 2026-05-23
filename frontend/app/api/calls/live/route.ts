import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PRICING_PATH = path.join(DATA_DIR, 'pricing_config.json');

// Memory-persistent mock for ticking sessions
// In a real app, this would be a Redis/DB state
let liveSessions = [
    {
        id: 'sess_live_001',
        agentName: 'Sales Closer V2',
        userName: 'John Doe',
        userPhone: '+1 (415) 555-0123',
        startedAt: new Date(Date.now() - 45000).toISOString(), // 45s ago
        status: 'active',
        tokens: { llmInput: 156, llmOutput: 82, ttsChars: 412 },
        transcript: [
            { role: 'user', text: 'Hello, I was calling about the pricing plans.' },
            { role: 'agent', text: "I'd be happy to help! We have three main tiers starting from $49/month. Which one are you interested in?" },
            { role: 'user', text: "Tell me more about the Enterprise one." }
        ]
    },
    {
        id: 'sess_live_002',
        agentName: 'Inbound Support',
        userName: 'Sarah Smith',
        userPhone: '+1 (212) 555-9876',
        startedAt: new Date(Date.now() - 120000).toISOString(), // 2m ago
        status: 'active',
        tokens: { llmInput: 412, llmOutput: 198, ttsChars: 1205 },
        transcript: [
            { role: 'user', text: 'My agent is not responding to the webhooks.' },
            { role: 'agent', text: 'I apologize for the trouble. Let me check your configuration logs real quick.' }
        ]
    }
];

// Reusing the mathematical engine logic from history (could be modularized)
const calculateLiveCost = (session: any, config: any) => {
    if (!config) return 0;
    const getActiveProvider = (array: any[]) => array?.find(p => p.enabled) || array?.[0];
    const llm = getActiveProvider(config.llmProviders);
    const stt = getActiveProvider(config.sttProviders);
    const tts = getActiveProvider(config.ttsProviders);
    const sip = config.telephony;
    
    const durationSecs = (Date.now() - new Date(session.startedAt).getTime()) / 1000;
    const durMins = durationSecs / 60;

    let cost = 0;
    if (llm) {
        cost += (session.tokens.llmInput / 1000000) * parseFloat(llm.input);
        cost += (session.tokens.llmOutput / 1000000) * parseFloat(llm.output);
    }
    if (stt) cost += durMins * parseFloat(stt.rate);
    if (tts) cost += (session.tokens.ttsChars / 1000000) * parseFloat(tts.rate);
    if (sip) cost += durMins * parseFloat(sip.inbound_rate || sip.inboundRate || '0.00');

    return parseFloat(cost.toFixed(4));
};

export async function GET() {
    let config = null;
    try {
        if (fs.existsSync(PRICING_PATH)) {
            config = JSON.parse(fs.readFileSync(PRICING_PATH, 'utf-8'));
        }
    } catch {}

    // Simulated update: Ticking tokens and duration
    // In a stateless serverless func this is tricky, so we just add small increments per request
    liveSessions = liveSessions.map(s => ({
        ...s,
        tokens: {
            llmInput: s.tokens.llmInput + Math.floor(Math.random() * 5),
            llmOutput: s.tokens.llmOutput + Math.floor(Math.random() * 2),
            ttsChars: s.tokens.ttsChars + Math.floor(Math.random() * 10)
        }
    }));

    const response = liveSessions.map(s => ({
        ...s,
        durationSeconds: Math.floor((Date.now() - new Date(s.startedAt).getTime()) / 1000),
        currentCost: calculateLiveCost(s, config)
    }));

    return NextResponse.json({ sessions: response });
}
