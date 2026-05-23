import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, and } from 'drizzle-orm';

const { campaigns, campaignNumbers } = schema;

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: campaignId } = await params;

        await db.update(campaigns)
            .set({ status: 'stopped' })
            .where(eq(campaigns.id, campaignId));

        // Mark remaining pending leads as cancelled
        await db.update(campaignNumbers)
            .set({ status: 'cancelled' })
            .where(and(
                eq(campaignNumbers.campaignId, campaignId),
                eq(campaignNumbers.status, 'pending')
            ));

        return NextResponse.json({
            success: true,
            message: "Campaign stopped and remaining leads cancelled."
        }, { status: 200 });

    } catch (error: any) {
        console.error("Error stopping campaign:", error);
        return NextResponse.json({ error: "Failed to stop campaign", details: error.message }, { status: 500 });
    }
}
