import { db } from "../db";
import { districts } from "../db/schema";
import { sql } from "drizzle-orm";

const LAHORE_DISTRICTS = [
    { name: "Johar Town", slug: "johar-town" },
    { name: "Township", slug: "township" },
    { name: "DHA (Defence)", slug: "dha" },
    { name: "Cantonment (Cantt)", slug: "cantonment" },
    { name: "Bahria Town", slug: "bahria-town" },
    { name: "Gulberg", slug: "gulberg" },
    { name: "Model Town", slug: "model-town" },
    { name: "Wapda Town", slug: "wapda-town" },
    { name: "Samnabad", slug: "samnabad" },
    { name: "Mughalpura", slug: "mughalpura" },
    { name: "Iqbal Town", slug: "iqbal-town" }
];

async function seed() {
    console.log("🌱 Seeding Districts Master List...");
    
    for (const district of LAHORE_DISTRICTS) {
        try {
            await db.insert(districts).values(district).onConflictDoNothing();
            console.log(`✅ Seeded: ${district.name}`);
        } catch (error) {
            console.error(`❌ Failed: ${district.name}`, error);
        }
    }
    
    console.log("✨ Seeding Complete.");
    process.exit(0);
}

seed();
