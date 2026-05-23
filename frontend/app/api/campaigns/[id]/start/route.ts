import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, and, sql } from 'drizzle-orm';
import redis from '@/lib/redis';

const { campaigns, campaignNumbers, agents, sipTrunks } = schema;

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: campaignId } = await params;

        // 1. Fetch Campaign with Agent and Trunk
        const [campaign] = await db.select()
            .from(campaigns)
            .where(eq(campaigns.id, campaignId));

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        if (campaign.status !== 'draft' && campaign.status !== 'paused') {
            return NextResponse.json({ error: "Campaign can only be started from draft or paused status." }, { status: 400 });
        }

        // 2. Fetch Agent
        let agent;
        if (campaign.agentId) {
            agent = (await db.select().from(agents).where(eq(agents.id, campaign.agentId)))[0];
        }

        if (!agent) {
            return NextResponse.json({ error: "Campaign is missing a valid agent." }, { status: 400 });
        }

        // 3. Fetch SipTrunk
        let trunk;
        if (campaign.sipTrunkId) {
            trunk = (await db.select().from(sipTrunks).where(eq(sipTrunks.id, campaign.sipTrunkId)))[0];
        } else {
            // Fallback to first outbound trunk
            trunk = (await db.select().from(sipTrunks).where(eq(sipTrunks.type, 'outbound')).limit(1))[0];
        }

        if (!trunk) {
            return NextResponse.json({ error: "Campaign is missing a valid SIP Trunk." }, { status: 400 });
        }

        // 4. Update Status to Running
        await db.update(campaigns)
            .set({ status: 'running' })
            .where(eq(campaigns.id, campaignId));

        // 5. Fetch a small batch of pending numbers based on max_concurrency
        const concurrency = campaign.concurrency || 1;
        const batchSize = Math.min(concurrency, 5); // Safe batch enqueue size for now

        const numbersToCall = await db.select()
            .from(campaignNumbers)
            .where(and(
                eq(campaignNumbers.campaignId, campaignId),
                eq(campaignNumbers.status, 'pending')
            ))
            .limit(batchSize);

        if (numbersToCall.length === 0) {
            return NextResponse.json({ success: true, message: "Campaign started, but no pending numbers left." }, { status: 200 });
        }

        // 6. Enqueue to Redis
        let enqueuedCount = 0;
        for (const number of numbersToCall) {
            const payload = {
                type: "outbound_campaign_call",
                direction: "outbound",
                campaign_id: campaignId,
                campaign_name: campaign.name,
                lead_id: number.id,
                external_record_id: number.id,
                contact_name: number.name || "Customer",
                phone: number.phone,
                agent_id: agent.id,
                agent_slug: agent.slug,
                agent_name: "outbound-agent",
                sip_trunk_id: trunk.id,
                caller_id: campaign.callerId || ((Array.isArray(trunk.numbers) && trunk.numbers.length > 0 && typeof trunk.numbers[0] === 'string') ? trunk.numbers[0] : trunk.name),
                opening_message: campaign.openingMessage,
                call_goal: campaign.callGoal || `Campaign Outbound Call - ${campaign.name}`,
                legacy_complaint_mode: false
            };

            await redis.lPush('AI_DIALER_OUTBOUND_QUEUE', JSON.stringify(payload));
            
            // Fallback for legacy workers that haven't updated queue names yet
            // await redis.lPush('sarah_robocall_queue', JSON.stringify(payload));
            
            // Mark as processing
            await db.update(campaignNumbers)
                .set({ status: 'processing' })
                .where(eq(campaignNumbers.id, number.id));
                
            enqueuedCount++;
        }

        return NextResponse.json({
            success: true,
            message: `Campaign started. Enqueued ${enqueuedCount} leads.`,
            enqueued: enqueuedCount
        }, { status: 200 });

    } catch (error: any) {
        console.error("Error starting campaign:", error);
        return NextResponse.json({ error: "Failed to start campaign", details: error.message }, { status: 500 });
    }
}
