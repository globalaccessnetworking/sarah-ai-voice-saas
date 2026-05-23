import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Using the same data directory as pricing config
const DATA_DIR = path.join(process.cwd(), 'data');
const PRICING_PATH = path.join(DATA_DIR, 'pricing_config.json');

// Interface to match the frontend table
export interface HistoricalCall {
    id: string;
    date: string;
    agentId: string;
    agentName: string;
    userName: string;
    userPhone: string;
    durationSeconds: number;
    tokens: {
        llmInput: number;
        llmOutput: number;
        ttsChars: number;
    };
    status: 'completed' | 'failed' | 'in-progress';
    providerOverrides: {
        llm?: string;
        stt?: string;
        tts?: string;
        realtime?: string;
    };
    // The calculated values based on JSON state
    cost?: number; 
}

// Utility to read the live pricing config
const getPricingConfig = () => {
    try {
        if (fs.existsSync(PRICING_PATH)) {
            return JSON.parse(fs.readFileSync(PRICING_PATH, 'utf-8'));
        }
        return null;
    } catch {
        return null; // Fallback gracefully if missing
    }
};

// Pure mathematical engine mapping against our Phase 7 logic
const calculateExactCost = (call: HistoricalCall, config: any): { total: number; ai: number; telephony: number } => {
    if (!config) return { total: 0, ai: 0, telephony: 0 }; // Unmeasurable without config

    // Note: A real app would track specifically which provider completed the call
    // For this demonstration, we map to the first 'enabled' provider in the array.
    const getActiveProvider = (array: any[]) => array?.find(p => p.enabled) || array?.[0];

    const llm = getActiveProvider(config.llmProviders);
    const stt = getActiveProvider(config.sttProviders);
    const tts = getActiveProvider(config.ttsProviders);
    const sip = config.telephony;
    const durMins = call.durationSeconds / 60;

    let aiCost = 0;

    // 1. LLM Tokens Cost
    if (call.tokens.llmInput > 0 && llm) {
        // (Input tokens / 1M) * input price + (Output tokens / 1M) * output price
        aiCost += (call.tokens.llmInput / 1000000) * parseFloat(llm.input);
        aiCost += (call.tokens.llmOutput / 1000000) * parseFloat(llm.output);
    }

    // 2. STT Duration Cost ($/Minute)
    if (stt && stt.rate) {
        aiCost += durMins * parseFloat(stt.rate);
    }

    // 3. TTS Character Cost ($/1M chars)
    if (call.tokens.ttsChars > 0 && tts && tts.rate) {
        aiCost += (call.tokens.ttsChars / 1000000) * parseFloat(tts.rate);
    }

    // 4. Telephony Bridge (VoIP rates phase 6)
    let sipCost = 0;
    if (sip) {
        // Assume outbound cold call for simple mock
        sipCost += durMins * parseFloat(sip.outboundRate || '0.00');
    }

    return {
        total: parseFloat((aiCost + sipCost).toFixed(4)),
        ai: parseFloat(aiCost.toFixed(4)),
        telephony: parseFloat(sipCost.toFixed(4))
    };
};

// 50 Handcrafted Mocks blending real LiveKit Agent data
const generateMockCalls = (): HistoricalCall[] => {
    const agents = [
        { id: 'ag_x8j2', name: 'Sales Closer V2' },
        { id: 'ag_9m4v', name: 'Inbound Support' },
        { id: 'ag_z2k1', name: 'Appointment Setter' }
    ];

    const now = new Date();
    const calls: HistoricalCall[] = [];

    for (let i = 0; i < 50; i++) {
        // Randomize historical dates sequentially
        const callDate = new Date(now.getTime() - (i * Math.random() * 86400000));
        const agent = agents[Math.floor(Math.random() * agents.length)];
        const durSecs = Math.floor(Math.random() * 480) + 15; // 15s to 8 mins
        
        calls.push({
            id: `call_${Math.random().toString(36).substr(2, 9)}`,
            date: callDate.toISOString(),
            agentId: agent.id,
            agentName: agent.name,
            userName: `User ${i + 130}`,
            userPhone: `+1(555)${Math.floor(100+Math.random()*899)}-${Math.floor(1000+Math.random()*8999)}`,
            durationSeconds: durSecs,
            status: Math.random() > 0.05 ? 'completed' : 'failed',
            tokens: {
                llmInput: Math.floor(durSecs * 3.5),   // Est. speaking velocity
                llmOutput: Math.floor(durSecs * 1.5),  // Est. AI reply velocity
                ttsChars: Math.floor(durSecs * 6.5)    // Est. Character generation
            },
            providerOverrides: {}
        });
    }

    return calls;
}

export async function GET() {
    const config = getPricingConfig();
    const rawCalls = generateMockCalls();

    // Map the database, resolving financial vectors via our JSON Engine
    const financialLedger = rawCalls.map(call => {
        const costBreakdown = calculateExactCost(call, config);
        return {
            ...call,
            cost: costBreakdown.total,
            costBreakdown
        };
    });

    return NextResponse.json({ calls: financialLedger });
}
