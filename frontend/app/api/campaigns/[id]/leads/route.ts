import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';

const { campaigns, campaignNumbers } = schema;

/**
 * POST /api/campaigns/[id]/leads
 *
 * Append leads to an existing campaign.
 * Only allowed for campaigns in draft or paused status.
 * Does NOT enqueue calls. Does NOT auto-start the campaign.
 *
 * Body:
 *   { numbers: Array<{ phone, name?, companyName?, leadData? }> }
 *
 * Returns:
 *   { inserted: number, skipped: number, campaignId: string }
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. Verify campaign exists
        const campaignRows = await db
            .select({ id: campaigns.id, status: campaigns.status })
            .from(campaigns)
            .where(eq(campaigns.id, id))
            .limit(1);

        if (campaignRows.length === 0) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        const campaign = campaignRows[0];

        // 2. Safety: only allow appending to draft or paused campaigns
        const allowedStatuses = ['draft', 'paused', 'idle'];
        if (!allowedStatuses.includes(campaign.status ?? '')) {
            return NextResponse.json(
                {
                    error: `Cannot add leads to a campaign with status "${campaign.status}". ` +
                        `Campaign must be draft, paused, or idle.`
                },
                { status: 409 }
            );
        }

        // 3. Parse and validate body
        const body = await request.json();
        const numbers = body.numbers;

        if (!Array.isArray(numbers) || numbers.length === 0) {
            return NextResponse.json({ error: 'numbers array is required and must not be empty' }, { status: 400 });
        }

        // 4. Build insert rows — skip any entry missing a phone
        let inserted = 0;
        let skipped = 0;
        const insertBatch: typeof campaignNumbers.$inferInsert[] = [];

        for (const n of numbers) {
            const phone = String(n.phone ?? '').trim();
            if (!phone) { skipped++; continue; }

            insertBatch.push({
                campaignId: id,
                phone,
                name: n.name || null,
                companyName: n.companyName || null,
                status: 'pending',
                // leadData contains ALL normalized columns (original + canonical keys)
                leadData: n.leadData || null,
            });
        }

        if (insertBatch.length > 0) {
            await db.insert(campaignNumbers).values(insertBatch);
            inserted = insertBatch.length;
        }

        return NextResponse.json({ inserted, skipped, campaignId: id }, { status: 201 });
    } catch (error) {
        console.error('Error appending leads to campaign:', error);
        return NextResponse.json({ error: 'Failed to append leads' }, { status: 500 });
    }
}

/**
 * GET /api/campaigns/[id]/leads
 *
 * Fetch all leads for a campaign with basic stats.
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const leads = await db
            .select()
            .from(campaignNumbers)
            .where(eq(campaignNumbers.campaignId, id));

        return NextResponse.json({
            campaignId: id,
            total: leads.length,
            pending: leads.filter(l => l.status === 'pending').length,
            completed: leads.filter(l => l.status === 'completed').length,
            failed: leads.filter(l => l.status === 'failed').length,
            leads,
        });
    } catch (error) {
        console.error('Error fetching campaign leads:', error);
        return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }
}
