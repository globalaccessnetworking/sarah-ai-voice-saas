import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';

const { campaigns, campaignNumbers } = schema;

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const campaignData = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
        if (campaignData.length === 0) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        const numbersData = await db.select().from(campaignNumbers).where(eq(campaignNumbers.campaignId, id));

        return NextResponse.json({
            ...campaignData[0],
            numbers: numbersData
        });
    } catch (error) {
        console.error("Error fetching campaign:", error);
        return NextResponse.json({ error: "Failed to fetch campaign" }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Allow updating campaign fields
        const updateData: any = {
            updatedAt: new Date(),
        };

        const fields = [
            'name', 'description', 'campaignType', 'status', 'sipTrunkId', 
            'callerId', 'agentId', 'openingMessage', 'callGoal', 'script',
            'concurrency', 'callDelaySeconds', 'dialingMode', 'retryAttempts',
            'retryDelaySeconds', 'timezone', 'callingWindowStart', 'callingWindowEnd',
            'daysOfWeek', 'recordingEnabled', 'transcriptionEnabled', 
            'vicidialCampaignId', 'vicidialIngroup'
        ];

        for (const field of fields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        const updatedCampaign = await db.update(campaigns)
            .set(updateData)
            .where(eq(campaigns.id, id))
            .returning();

        if (updatedCampaign.length === 0) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        return NextResponse.json(updatedCampaign[0]);
    } catch (error) {
        console.error("Error updating campaign:", error);
        return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    return PUT(request, { params });
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // Due to CASCADE ON DELETE, this will also delete campaign_numbers
        const deletedCampaign = await db.delete(campaigns).where(eq(campaigns.id, id)).returning();

        if (deletedCampaign.length === 0) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting campaign:", error);
        return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
    }
}
