import { db } from "../db";
import { smsTemplates } from "../db/schema";

const DEFAULT_TEMPLATES = [
    {
        name: "Complaint Submission (Citizen)",
        triggerType: "complaint_submitted",
        content: "Dear Citizen, your complaint has been received. Ticket ID: {{ticket_id}}. We are working on it. - Suthra Punjab",
        useUnicode: false
    },
    {
        name: "Ticket Re-opened (Supervisor)",
        triggerType: "ticket_reopened",
        content: "ALERT: Ticket {{ticket_id}} in your district has been re-opened by the citizen after a resolution review. Please investigate immediately.",
        useUnicode: false
    }
];

async function seed() {
    console.log("🌱 Seeding Default SMS Templates...");
    
    for (const template of DEFAULT_TEMPLATES) {
        try {
            await db.insert(smsTemplates).values(template).onConflictDoNothing();
            console.log(`✅ Seeded Template: ${template.name}`);
        } catch (error) {
            console.error(`❌ Failed Template: ${template.name}`, error);
        }
    }
    
    console.log("✨ Template Seeding Complete.");
    process.exit(0);
}

seed();
