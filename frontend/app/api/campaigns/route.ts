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
            description: body.description || null,
            campaignType: body.campaignType || 'progressive',
            sipTrunkId: body.sipTrunkId || null,
            callerId: body.callerId || null,
            agentId: body.agentId || null,
            openingMessage: body.openingMessage || null,
            callGoal: body.callGoal || null,
            script: body.script || null,
            concurrency: body.concurrency || 1,
            callDelaySeconds: body.callDelaySeconds || 0,
            dialingMode: body.dialingMode || 'progressive',
            retryAttempts: body.retryAttempts || 3,
            retryDelaySeconds: body.retryDelaySeconds || 3600,
            timezone: body.timezone || 'UTC',
            callingWindowStart: body.callingWindowStart || '09:00',
            callingWindowEnd: body.callingWindowEnd || '18:00',
            daysOfWeek: body.daysOfWeek || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            recordingEnabled: body.recordingEnabled !== undefined ? body.recordingEnabled : true,
            transcriptionEnabled: body.transcriptionEnabled !== undefined ? body.transcriptionEnabled : true,
            vicidialCampaignId: body.vicidialCampaignId || null,
            vicidialIngroup: body.vicidialIngroup || null,
            status: 'draft',
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
                status: 'pending',
                leadData: n.leadData || null
            }));

            await db.insert(campaignNumbers).values(numbersData);
        }

        return NextResponse.json(campaign, { status: 201 });
    } catch (error) {
        console.error("Error creating campaign:", error);
        return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
    }
}
