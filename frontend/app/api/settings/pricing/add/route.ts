import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'pricing_config.json');

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { category, provider } = body;

        if (!category || !provider || !provider.id) {
            return NextResponse.json({ error: "Missing category or provider details" }, { status: 400 });
        }

        let config: any = {};
        if (fs.existsSync(FILE_PATH)) {
            config = JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8'));
        } else if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        // Map frontend categories to JSON keys
        const categoryMap: any = {
            'LLM': 'llmProviders',
            'STT': 'sttProviders',
            'TTS': 'ttsProviders',
            'Realtime': 'realtimeProviders'
        };

        const configKey = categoryMap[category];
        if (!configKey) {
            return NextResponse.json({ error: "Invalid category" }, { status: 400 });
        }

        if (!config[configKey]) {
            config[configKey] = [];
        }

        // Check for duplicate ID
        const exists = config[configKey].some((p: any) => p.id === provider.id);
        if (exists) {
            return NextResponse.json({ error: "Provider ID must be unique." }, { status: 400 });
        }

        config[configKey].push(provider);
        fs.writeFileSync(FILE_PATH, JSON.stringify(config, null, 2));

        return NextResponse.json({ success: true, provider });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
