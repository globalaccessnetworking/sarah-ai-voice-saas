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

        await db.update(campaigns)
            .set({ status: 'paused' })
            .where(eq(campaigns.id, campaignId));

        return NextResponse.json({
            success: true,
            message: "Campaign paused."
        }, { status: 200 });

    } catch (error: any) {
        console.error("Error pausing campaign:", error);
        return NextResponse.json({ error: "Failed to pause campaign", details: error.message }, { status: 500 });
    }
}
