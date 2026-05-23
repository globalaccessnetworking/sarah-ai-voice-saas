import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'pricing_config.json');

// Helper to ensure file exists and read
const readConfig = () => {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        if (!fs.existsSync(FILE_PATH)) {
            return null; // File doesn't exist yet
        }
        const data = fs.readFileSync(FILE_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        console.error("Error reading pricing config:", e);
        return null; // Return null if read fails
    }
};

// Helper to write
const writeConfig = (data: any) => {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error("Error writing pricing config:", e);
        return false;
    }
};

export async function GET() {
    const config = readConfig();
    return NextResponse.json(config ? config : { message: "No custom config found" });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const success = writeConfig(body);
        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: "Failed to persist configuration" }, { status: 500 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
