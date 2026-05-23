import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

/**
 * Global Access AI Branding Engine
 * Resolves brand assets (Logos, Colors, Domains) based on Workspace/Tenant identity.
 */

export interface BrandAssets {
    logoUrl: string;
    primaryColor: string;
    accentColor: string;
    companyName: string;
    supportEmail: string;
    websiteUrl: string;
}

const DEFAULT_BRAND: BrandAssets = {
    logoUrl: "https://globalaccess.ai/logo.png", // Fallback logo
    primaryColor: "#10b981", // Emerald-500
    accentColor: "#3b82f6", // Blue-500
    companyName: "Global Access AI",
    supportEmail: "support@globalaccess.ai",
    websiteUrl: "https://globalaccess.ai"
};

export async function getBrandForWorkspace(workspaceId?: string): Promise<BrandAssets> {
    try {
        if (!workspaceId) return DEFAULT_BRAND;

        const brandConfig = await db.query.workspaceBranding.findFirst({
            where: eq(schema.workspaceBranding.workspaceId, workspaceId)
        });

        if (brandConfig) {
            return {
                logoUrl: brandConfig.logoUrl || DEFAULT_BRAND.logoUrl,
                primaryColor: brandConfig.primaryColor || DEFAULT_BRAND.primaryColor,
                accentColor: brandConfig.accentColor || DEFAULT_BRAND.accentColor,
                companyName: brandConfig.companyName || DEFAULT_BRAND.companyName,
                supportEmail: brandConfig.supportEmail || DEFAULT_BRAND.supportEmail,
                websiteUrl: brandConfig.websiteUrl || DEFAULT_BRAND.websiteUrl,
            };
        }

        return DEFAULT_BRAND;
    } catch (error) {
        console.error("[BrandingEngine] Failed to resolve brand:", error);
        return DEFAULT_BRAND;
    }
}

/**
 * Generates DNS records for DKIM/SPF verification.
 */
export function generateDnsRecords(domain: string) {
    return [
        {
            type: "TXT",
            host: "@",
            value: "v=spf1 include:_spf.globalaccess.ai ~all",
            status: "Pending"
        },
        {
            type: "CNAME",
            host: "ga._domainkey",
            value: "dkim.globalaccess.ai",
            status: "Pending"
        },
        {
            type: "TXT",
            host: "_ga-verification",
            value: `ga-verification-${Math.random().toString(36).substring(7)}`,
            status: "Pending"
        }
    ];
}

/**
 * Injects branding variables into the Handlebars context.
 */
export async function injectBranding(existingVars: Record<string, any>, workspaceId?: string) {
    const brand = await getBrandForWorkspace(workspaceId);
    
    return {
        ...existingVars,
        brand_logo: brand.logoUrl,
        brand_primary_color: brand.primaryColor,
        brand_accent_color: brand.accentColor,
        brand_company_name: brand.companyName,
        brand_support_email: brand.supportEmail,
        brand_website_url: brand.websiteUrl,
        year: new Date().getFullYear()
    };
}
