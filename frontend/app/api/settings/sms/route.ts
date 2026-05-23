import { NextResponse } from 'next/server';
import { db } from "@/db";
import { 
    smsConfigurations, 
    smsTemplates, 
    supervisorRegistry, 
    districts,
    auditLogs
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

// --- Validation Schemas ---

const supervisorSchema = z.object({
    name: z.string().min(2, "Name is required"),
    phoneNumber: z.string().transform((val) => {
        // Strip dashes, spaces, and enforce +923 prefix for Pakistan
        let cleaned = val.replace(/[\s-]/g, "");
        if (cleaned.startsWith("0")) cleaned = "+92" + cleaned.slice(1);
        if (!cleaned.startsWith("+")) cleaned = "+" + cleaned;
        return cleaned;
    }).refine((val) => /^\+923\d{9}$/.test(val), "Invalid Pakistan mobile number format (+923XXXXXXXXX)"),
    districtId: z.number().int(),
    isPrimary: z.boolean().optional().default(true),
});

const gatewaySchema = z.object({
    providerName: z.string().min(1),
    apiUrl: z.string().url(),
    senderId: z.string().min(1),
    apiParams: z.record(z.string(), z.any()).default({}),
    isActive: z.boolean().default(false),
});

// --- API Handlers ---

export async function GET() {
    try {
        const [configs, templates, supervisors, allDistricts] = await Promise.all([
            db.select().from(smsConfigurations).orderBy(desc(smsConfigurations.isActive)),
            db.select().from(smsTemplates),
            db.select().from(supervisorRegistry),
            db.select().from(districts).orderBy(districts.name),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                configs,
                templates,
                supervisors,
                districts: allDistricts
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, data } = body;

        // Mock User Session for Audit (In production, replace with actual session user)
        const mockUser = { id: undefined, email: "admin@suthrapunjab.gov.pk" };

        switch (type) {
            case 'gateway': {
                const validated = gatewaySchema.parse(data);
                
                // If this is set to active, deactivate others
                if (validated.isActive) {
                    await db.update(smsConfigurations).set({ isActive: false });
                }

                await db.insert(smsConfigurations)
                    .values(validated)
                    .onConflictDoUpdate({
                        target: smsConfigurations.providerName,
                        set: validated
                    });
                
                return NextResponse.json({ success: true, message: "Gateway configuration updated" });
            }

            case 'template': {
                const { id, content, useUnicode } = data;
                
                const [oldTemplate] = await db.select().from(smsTemplates).where(eq(smsTemplates.id, id));
                
                await db.update(smsTemplates)
                    .set({ content, useUnicode, updatedAt: new Date() })
                    .where(eq(smsTemplates.id, id));

                // Audit Trail
                await db.insert(auditLogs).values({
                    userEmail: mockUser.email,
                    action: "UPDATE_SMS_TEMPLATE",
                    resourceType: "sms_templates",
                    resourceId: id,
                    details: `Template '${oldTemplate?.name}' updated. Content length: ${content.length}`
                });

                return NextResponse.json({ success: true, message: "Template updated successfully" });
            }

            case 'supervisor': {
                const validated = supervisorSchema.parse(data);
                
                await db.insert(supervisorRegistry)
                    .values(validated);

                return NextResponse.json({ success: true, message: "Supervisor registered successfully" });
            }

            case 'district': {
                const { name, slug } = data;
                await db.insert(districts).values({ name, slug }).onConflictDoNothing();
                return NextResponse.json({ success: true, message: "District added" });
            }

            default:
                return NextResponse.json({ success: false, error: "Invalid operation type" }, { status: 400 });
        }

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
