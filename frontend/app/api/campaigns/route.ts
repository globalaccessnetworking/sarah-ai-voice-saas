import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { desc, eq } from 'drizzle-orm';

const { campaigns, campaignNumbers } = schema;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limitParam = searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam, 10) : 50;

        const allCampaigns = await db.select()
            .from(campaigns)
            .orderBy(desc(campaigns.createdAt))
            .limit(limit);

        return NextResponse.json(allCampaigns);
    } catch (error) {
        console.error("Error fetching campaigns:", error);
        return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // 1. Create the campaign
        const newCampaigns = await db.insert(campaigns).values({
            name: body.name,
            sipTrunkId: body.sipTrunkId || null,
            agentId: body.agentId || null,
            concurrency: body.concurrency || 1,
            callDelaySeconds: body.callDelaySeconds || 0,
            status: 'idle',
            stats: { total: body.numbers ? body.numbers.length : 0, completed: 0, failed: 0 }
        }).returning();

        const campaign = newCampaigns[0];

        // 2. Insert the numbers if provided
        if (body.numbers && Array.isArray(body.numbers) && body.numbers.length > 0) {
            const numbersData = body.numbers.map((n: any) => ({
                campaignId: campaign.id,
                phone: n.phone,
                name: n.name || null,
                companyName: n.companyName || null,
                status: 'pending'
            }));

            await db.insert(campaignNumbers).values(numbersData);
        }

        return NextResponse.json(campaign, { status: 201 });
    } catch (error) {
        console.error("Error creating campaign:", error);
        return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
    }
}
