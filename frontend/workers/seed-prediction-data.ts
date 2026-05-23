import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db, schema } from "@/db";

async function seedPredictionData() {
    console.log("🚀 Seeding historical email logs for AI Prediction Hub...");
    console.log("DB URL Loaded:", process.env.DATABASE_URL ? "Yes" : "No");

    const recipients = ["demo1@example.com", "demo2@example.com", "user@gmail.com", "lead@outlook.com"];
    const statuses: ("SENT" | "FAILED" | "BOUNCED")[] = ["SENT", "SENT", "SENT", "SENT", "FAILED", "BOUNCED"];
    
    // Create logs for the last 7 days
    const now = new Date();
    const batch = [];

    for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
            // Skew success toward morning (9-11) and afternoon (14-16)
            const isPeak = (hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16);
            const count = isPeak ? 15 : 5;

            for (let i = 0; i < count; i++) {
                const timestamp = new Date(now);
                timestamp.setDate(now.getDate() - day);
                timestamp.setHours(hour);
                timestamp.setMinutes(Math.floor(Math.random() * 60));

                const recipient = recipients[Math.floor(Math.random() * recipients.length)];
                const status = isPeak ? "SENT" : statuses[Math.floor(Math.random() * statuses.length)];

                batch.push({
                    recipient,
                    subject: "Seeded Engagement Log",
                    templateType: "system_newsletter",
                    status,
                    timestamp,
                });
            }
        }
    }

    // Insert in chunks of 500
    for (let i = 0; i < batch.length; i += 500) {
        process.stdout.write(`Inserting chunk ${i / 500 + 1}... `);
        await db.insert(schema.emailLogs).values(batch.slice(i, i + 500));
        console.log("Done.");
    }

    console.log("✅ Seeding complete. AI Prediction Hub now has data.");
}

seedPredictionData().catch(console.error);
