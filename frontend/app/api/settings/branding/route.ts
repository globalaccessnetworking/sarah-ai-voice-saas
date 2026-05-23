import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export async function GET() {
    try {
        const profile = await db.query.emailBrandingProfile.findFirst();
        
        if (!profile) {
            return NextResponse.json({
                companyName: "Global Access AI",
                logoUrl: "",
                primaryColor: "#22c55e",
                supportEmail: "",
                customDomain: "",
                isDomainVerified: false
            });
        }

        return NextResponse.json(profile);
    } catch (error: any) {
        console.error("[BrandingAPI] GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch branding profile" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { companyName, logoUrl, primaryColor, supportEmail, customDomain } = body;

        const existing = await db.query.emailBrandingProfile.findFirst();

        if (existing) {
            await db.update(schema.emailBrandingProfile)
                .set({
                    companyName,
                    logoUrl,
                    primaryColor,
                    supportEmail,
                    customDomain,
                    updatedAt: new Date()
                })
                .where(eq(schema.emailBrandingProfile.id, existing.id));
        } else {
            await db.insert(schema.emailBrandingProfile).values({
                companyName,
                logoUrl,
                primaryColor,
                supportEmail,
                customDomain
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[BrandingAPI] POST Error:", error);
        return NextResponse.json({ error: "Failed to update branding profile" }, { status: 500 });
    }
}
