import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';

const { campaigns } = schema;

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: campaignId } = await params;

        // In a real predictive dialer, this would also resume enqueueing logic or wake up a cron
        await db.update(campaigns)
            .set({ status: 'running' })
            .where(eq(campaigns.id, campaignId));

        return NextResponse.json({
            success: true,
            message: "Campaign resumed."
        }, { status: 200 });

    } catch (error: any) {
        console.error("Error resuming campaign:", error);
        return NextResponse.json({ error: "Failed to resume campaign", details: error.message }, { status: 500 });
    }
}
