import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Simulated DB for local slang dictionary
let dictionaryDb = [
    { id: "1", term: "Ghattar", meaning: "Sewerage / Drainage", tags: ["Plumbing", "Urdu Slang"] },
    { id: "2", term: "Bijli", meaning: "Electricity / WAPDA", tags: ["Utility", "Urdu"] },
    { id: "3", term: "WAPDA", meaning: "Water and Power Development Authority (Electricity Provider)", tags: ["Utility", "Acronym"] },
    { id: "4", term: "LDA", meaning: "Lahore Development Authority", tags: ["Government", "Acronym"] },
    { id: "5", term: "Pai ji", meaning: "Brother (Respectful)", tags: ["Punjabi Slang", "Greeting"] },
    { id: "6", term: "Kharab", meaning: "Broken / Out of order", tags: ["Status", "Urdu"] },
    { id: "7", term: "Sui Gas", meaning: "Piped Natural Gas", tags: ["Utility", "Entity"] }
];

export async function GET() {
    return NextResponse.json({
        terms: dictionaryDb,
        contextInjectionEnabled: true,
        lastSynced: new Date().toISOString()
    });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { term, meaning, tags } = body;
        
        if (!term || !meaning) {
            return NextResponse.json({ error: "Term and Meaning are required" }, { status: 400 });
        }

        const newEntry = {
            id: Date.now().toString(),
            term,
            meaning,
            tags: tags || []
        };
        
        dictionaryDb = [newEntry, ...dictionaryDb];
        
        return NextResponse.json({ success: true, entry: newEntry });
    } catch (err) {
        return NextResponse.json({ error: "Failed to add term" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get("id");
        
        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }
        
        dictionaryDb = dictionaryDb.filter(t => t.id !== id);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: "Failed to delete term" }, { status: 500 });
    }
}
