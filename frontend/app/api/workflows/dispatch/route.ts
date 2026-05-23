import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Simulated DB for workflow rules
let workflows = [
    { 
        id: "1", 
        name: "Sewerage Emergency (Johar Town)",
        isActive: true,
        conditions: [
            { type: "Tag", operator: "CONTAINS", value: "EMERGENCY" },
            { type: "Location", operator: "CONTAINS", value: "JOHAR TOWN" }
        ],
        actions: [
            { type: "WhatsApp", target: "+923001234567", template: "New Emergency: {{summary}} at {{location}}. Contact: {{caller_phone}}" },
            { type: "CRM_Tag", target: "High Priority Team", template: "" }
        ]
    },
    { 
        id: "2", 
        name: "Angry Customer Escalation",
        isActive: true,
        conditions: [
            { type: "Sentiment", operator: "LESS_THAN", value: "30" }
        ],
        actions: [
            { type: "SMS", target: "+923211234567", template: "Angry customer call ended. Supervisor review required for: {{caller_phone}}" }
        ]
    }
];

export async function GET() {
    return NextResponse.json({
        workflows,
        dispatchStats: {
            today: 142,
            failed: 0,
            activeRules: workflows.length
        }
    });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, conditions, actions } = body;
        
        if (!name || !conditions || !actions) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newWorkflow = {
            id: Date.now().toString(),
            name,
            isActive: true,
            conditions,
            actions
        };
        
        workflows = [newWorkflow, ...workflows];
        return NextResponse.json({ success: true, workflow: newWorkflow });
    } catch (err) {
        return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get("id");
        
        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }
        
        workflows = workflows.filter(w => w.id !== id);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: "Failed to delete workflow" }, { status: 500 });
    }
}
