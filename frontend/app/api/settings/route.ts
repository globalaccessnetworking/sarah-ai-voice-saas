import { NextResponse } from 'next/server';
import { db } from '@/db';
import { systemSettings } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

// ── GET /api/settings ────────────────────────────────────────────────────────
// Fetches the global_config row. If it doesn't exist, we return a default structure.
// Includes a self-healing check to create the table or add missing columns!
export async function GET() {
    try {
        let config;
        try {
            config = await db.query.systemSettings.findFirst({
                where: eq(systemSettings.id, 'global_config')
            });
        } catch (dbError: any) {
            // Self-healing: If table doesn't exist, create it!
            if (dbError.message.includes('relation "system_settings" does not exist')) {
                console.log("Detecting missing system_settings table. Bootstrapping...");
                await bootstrapTable();
                config = await db.query.systemSettings.findFirst({
                    where: eq(systemSettings.id, 'global_config')
                });
            } else {
                throw dbError;
            }
        }

        // Check if new columns exist by checking if the structure is missing them
        if (config && (!('emailConfig' in config) || !('backupConfig' in config) || !('notesConfig' in config))) {
            console.log("Detecting missing columns in system_settings. Upgrading schema...");
            await upgradeTable();
            config = await db.query.systemSettings.findFirst({
                where: eq(systemSettings.id, 'global_config')
            });
        }

        if (!config) {
            return NextResponse.json({
                id: 'global_config',
                apiKeys: {},
                pricingConfig: {},
                brandingConfig: {},
                storageConfig: {},
                emailConfig: {},
                backupConfig: {},
                notesConfig: { content: "" }
            });
        }

        return NextResponse.json(config);
    } catch (error: any) {
        console.error("Error fetching global config:", error);
        return NextResponse.json({ error: error.message || 'Failed to fetch global configuration' }, { status: 500 });
    }
}

async function bootstrapTable() {
    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS system_settings (
            id varchar(50) PRIMARY KEY DEFAULT 'global_config',
            api_keys jsonb DEFAULT '{}',
            pricing_config jsonb DEFAULT '{}',
            branding_config jsonb DEFAULT '{}',
            storage_config jsonb DEFAULT '{}',
            email_config jsonb DEFAULT '{}',
            backup_config jsonb DEFAULT '{}',
            notes_config jsonb DEFAULT '{"content": ""}',
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now()
        )
    `);
}

async function upgradeTable() {
    try {
        await db.execute(sql`ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS email_config jsonb DEFAULT '{}'`);
        await db.execute(sql`ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS backup_config jsonb DEFAULT '{}'`);
        await db.execute(sql`ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS notes_config jsonb DEFAULT '{"content": ""}'`);
    } catch (e) {
        console.error("Schema upgrade error:", e);
    }
}

// ── POST /api/settings ───────────────────────────────────────────────────────
// Performs a partial update on the JSONB fields.
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Ensure row exists first
        let config = await db.query.systemSettings.findFirst({
            where: eq(systemSettings.id, 'global_config')
        });

        if (!config) {
            // First time setup
            await db.insert(systemSettings).values({
                id: 'global_config',
                apiKeys: body.apiKeys || {},
                pricingConfig: body.pricingConfig || {},
                brandingConfig: body.brandingConfig || {},
                storageConfig: body.storageConfig || {},
                emailConfig: body.emailConfig || {},
                backupConfig: body.backupConfig || {},
                notesConfig: body.notesConfig || { content: "" },
            });
            return NextResponse.json({ message: "Global config initialized", status: 'success' });
        }

        // Partial update for existing row
        const updateData: any = { updatedAt: new Date() };

        const fields = [
            'apiKeys', 'pricingConfig', 'brandingConfig',
            'storageConfig', 'emailConfig', 'backupConfig', 'notesConfig'
        ];

        fields.forEach(field => {
            if (body[field] !== undefined) {
                updateData[field] = { ...(config![field as keyof typeof config] as object), ...body[field] };
            }
        });

        await db.update(systemSettings)
            .set(updateData)
            .where(eq(systemSettings.id, 'global_config'));

        return NextResponse.json({ message: "Global config updated", status: 'success' });
    } catch (error: any) {
        console.error("Error updating global config:", error);
        return NextResponse.json({ error: error.message || 'Failed to update global configuration' }, { status: 500 });
    }
}
