import { NextResponse } from "next/server";

export async function GET() {
    // TODO: Replace with real Stripe API calls:
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const invoices = await stripe.invoices.list({ limit: 50 });
    // const customers = await stripe.customers.list({ limit: 50 });

    const usage = [
        { clientId: "c1", name: "Bright Smiles Dental", plan: "Professional", monthlyFee: 299, includedMinutes: 2000, usedMinutes: 1640, usedCalls: 480, overageRate: 0.18, status: "Active" },
        { clientId: "c2", name: "Peak Performance Gym", plan: "Starter", monthlyFee: 99, includedMinutes: 500, usedMinutes: 487, usedCalls: 143, overageRate: 0.25, status: "Active" },
        { clientId: "c3", name: "City Medical Centre", plan: "Enterprise", monthlyFee: 799, includedMinutes: 10000, usedMinutes: 3210, usedCalls: 1020, overageRate: 0.10, status: "Active" },
        { clientId: "c4", name: "24h Locksmith AU", plan: "Starter", monthlyFee: 99, includedMinutes: 500, usedMinutes: 612, usedCalls: 198, overageRate: 0.25, status: "Past Due" },
    ].map(c => ({
        ...c,
        overageMinutes: Math.max(0, c.usedMinutes - c.includedMinutes),
        overageCharge: Math.max(0, c.usedMinutes - c.includedMinutes) * c.overageRate,
        totalDue: c.monthlyFee + Math.max(0, c.usedMinutes - c.includedMinutes) * c.overageRate,
        usagePct: Math.min(100, (c.usedMinutes / c.includedMinutes) * 100),
        at80PctAlert: (c.usedMinutes / c.includedMinutes) >= 0.8,
    }));

    const mrr = usage.filter(c => c.status === "Active").reduce((s, c) => s + c.monthlyFee, 0);
    const overageRevenue = usage.reduce((s, c) => s + c.overageCharge, 0);

    return NextResponse.json({ usage, summary: { mrr, overageRevenue, totalClients: usage.length, activeClients: usage.filter(c => c.status === "Active").length } });
}

export async function POST(req: Request) {
    const body = await req.json();
    const { action, clientId, amount } = body;

    if (action === "charge") {
        // TODO: await stripe.paymentIntents.create({ amount: amount * 100, currency: 'aud', customer: stripeCustomerId });
        return NextResponse.json({ success: true, message: `Charged $${amount} to client ${clientId} via Stripe`, stripePaymentIntentId: `pi_mock_${Date.now()}` });
    }

    if (action === "create_customer") {
        // TODO: const customer = await stripe.customers.create({ email: body.email, name: body.name });
        return NextResponse.json({ success: true, stripeCustomerId: `cus_mock_${Date.now()}` });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
