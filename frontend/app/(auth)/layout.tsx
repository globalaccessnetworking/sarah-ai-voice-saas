import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import AuthLayoutClient from "./AuthLayoutClient";

export const dynamic = "force-dynamic";

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    let brandingConfig = {};

    try {
        // Fetch branding settings on the server
        const settings = await db
            .select()
            .from(systemSettings)
            .where(eq(systemSettings.id, "global_config"))
            .limit(1);

        const config = settings[0] || {};
        brandingConfig = config.brandingConfig || {};
    } catch (error) {
        console.error("[Build/Runtime] Failed to fetch branding settings:", error);
    }

    return (
        <AuthLayoutClient branding={brandingConfig}>
            {children}
        </AuthLayoutClient>
    );
}
