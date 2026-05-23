import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'pricing_config.json');
const BAK_FILE_PATH = path.join(DATA_DIR, 'pricing_config.json.bak');

export async function PUT(request: Request) {
    try {
        const body = await request.json();

        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        // Backup existing payload if exists
        if (fs.existsSync(FILE_PATH)) {
            fs.copyFileSync(FILE_PATH, BAK_FILE_PATH);
        }

        // Atomic write to a temporary file first
        const tmpPath = path.join(DATA_DIR, `pricing_config_${Date.now()}.json`);
        fs.writeFileSync(tmpPath, JSON.stringify(body, null, 2));
        
        // Rename the temp file into the actual file to ensure atomicity
        fs.renameSync(tmpPath, FILE_PATH);

        return NextResponse.json({ success: true, message: 'Configuration securely synced and backed up.' });
    } catch (error: any) {
        console.error("Master Sync Engine Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        if (!fs.existsSync(FILE_PATH)) {
            return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
        }
        const data = fs.readFileSync(FILE_PATH, 'utf-8');
        return NextResponse.json(JSON.parse(data));
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
