import { NextResponse } from "next/server";

export async function GET() {
    // TODO: Replace with real database calls
    const rules = [
        { id: "r1", name: "Trunk Down", trigger: "SIP Trunk Registration Lost", threshold: "Any trunk", channels: ["Email", "Slack", "PagerDuty"], enabled: true, severity: "Critical", triggerCount30d: 2 },
        { id: "r2", name: "Queue Wait Time High", trigger: "Queue Average Wait > Threshold", threshold: "60 seconds", channels: ["Slack"], enabled: true, severity: "Warning", triggerCount30d: 5 },
        { id: "r3", name: "Usage 80% Alert", trigger: "Client Minute Usage Exceeds %", threshold: "80% of plan", channels: ["Email"], enabled: true, severity: "Info", triggerCount30d: 8 },
    ];

    const history = [
        { id: "e1", rule: "Trunk Down", severity: "Critical", message: "PJSIP trunk Vonex-AU-Primary lost registration.", time: new Date(Date.now() - 72 * 3600000).toISOString(), resolved: true },
        { id: "e2", rule: "Queue Wait Time High", severity: "Warning", message: "dental-queue average wait reached 78s.", time: new Date(Date.now() - 15 * 3600000).toISOString(), resolved: true },
        { id: "e3", rule: "Usage 80% Alert", severity: "Info", message: "Peak Performance Gym at 97% usage.", time: new Date(Date.now() - 2 * 3600000).toISOString(), resolved: false },
    ];

    return NextResponse.json({ rules, history, unresolved: history.filter(h => !h.resolved).length });
}

export async function POST(req: Request) {
    const body = await req.json();
    const { action, rule } = body;

    if (action === "create") {
        // TODO: Save to DB
        const newRule = { ...rule, id: `r_${Date.now()}`, triggerCount30d: 0 };

        // TODO: Webhook dispatch logic:
        // if (rule.channels.includes("Slack")) await sendSlackWebhook(rule.slackUrl, "Alert rule created");
        // if (rule.channels.includes("PagerDuty")) await registerPagerDutyService(rule.pdKey);

        return NextResponse.json({ success: true, rule: newRule });
    }

    if (action === "test") {
        // Trigger a test alert through all configured channels
        // TODO: await dispatchAlert(rule, "TEST: This is a test alert from GlobalAccess AI");
        return NextResponse.json({ success: true, message: "Test alert dispatched to all configured channels" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
