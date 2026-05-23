import { db, schema } from "./db";
import { eq } from "drizzle-orm";

async function verifyBranding() {
    console.log("--- Verification: Phase 14 Branding Engine ---");
    
    try {
        // 1. Check Schema
        console.log("1. Verifying schema...");
        const columns = await db.execute(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'email_branding_profile';
        `);
        console.log("Columns found:", columns.rows);

        // 2. Test Upsert Logic
        console.log("\n2. Testing upsert logic...");
        const testData = {
            companyName: "Test Brand AI",
            logoUrl: "https://example.com/logo.png",
            primaryColor: "#FF5733",
            supportEmail: "test@example.com"
        };

        // Insert/Update
        const existing = await db.query.emailBrandingProfile.findFirst();
        if (existing) {
            await db.update(schema.emailBrandingProfile).set(testData).where(eq(schema.emailBrandingProfile.id, existing.id));
            console.log("Updated existing profile.");
        } else {
            await db.insert(schema.emailBrandingProfile).values(testData);
            console.log("Inserted new profile.");
        }

        // Fetch back
        const result = await db.query.emailBrandingProfile.findFirst();
        console.log("Fetched Result:", result);

        if (result?.companyName === testData.companyName) {
            console.log("\n✅ API Logic Verification: SUCCESS");
        } else {
            console.log("\n❌ API Logic Verification: FAILED");
        }

    } catch (error) {
        console.error("Verification Error:", error);
    }
}

// For execution via npx tsx
verifyBranding();
