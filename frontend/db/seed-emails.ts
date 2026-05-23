import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { emailTemplates } from "./schema";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:phagelabdrshafiq@localhost:5432/global_access";
const pool = new Pool({ connectionString });
const db = drizzle(pool);

const systemTemplates = [
    {
        name: "System-Password Reset",
        uniqueIdentifier: "system_password_reset",
        type: "SYSTEM",
        subject: "Reset Your Password - Global Access AI",
        htmlContent: "<h1>Reset Your Password</h1><p>Hi {{username}}, click here to reset your password: {{reset_link}}</p><p>Regards,<br>{{from_name}}</p>",
        expectedVariables: ["from_name", "username", "reset_link"]
    },
    {
        name: "System-Report: AI Analysis",
        uniqueIdentifier: "system_ai_analysis",
        type: "SYSTEM",
        subject: "AI Analysis Report: Call #{{call_id}}",
        htmlContent: "<h1>AI Call Analysis</h1><p>Agent: {{agent_name}}</p><p>Caller: {{caller_number}}</p><h3>Summary</h3><p>{{summary}}</p><p>Sentiment: {{sentiment}}</p><h3>Action Items</h3><p>{{action_items}}</p>",
        expectedVariables: ["call_id", "agent_name", "caller_number", "summary", "sentiment", "action_items"]
    },
    {
        name: "System-Report: Campaign Completion",
        uniqueIdentifier: "system_campaign_completion",
        type: "SYSTEM",
        subject: "Campaign Complete: {{campaign_name}}",
        htmlContent: "<h1>Campaign Report</h1><p>The campaign {{campaign_name}} (ID: {{campaign_id}}) has been completed by {{agent_name}}.</p>",
        expectedVariables: ["campaign_name", "campaign_id", "agent_name"]
    },
    {
        name: "System-Report: Post-Call Summary",
        uniqueIdentifier: "system_post_call_summary",
        type: "SYSTEM",
        subject: "Post-Call Summary: {{call_id}}",
        htmlContent: "<h1>Call Summary</h1><p>Agent: {{agent_name}}</p><p>Caller: {{caller_number}}</p><p>Duration: {{duration}}s</p><p>Total Cost: ${{total_cost}}</p>",
        expectedVariables: ["call_id", "agent_name", "caller_number", "duration", "total_cost"]
    },
    {
        name: "System-Report: Scheduled Summary",
        uniqueIdentifier: "system_scheduled_summary",
        type: "SYSTEM",
        subject: "Scheduled Report: {{period}} Summary",
        htmlContent: "<h1>{{period}} Performance Summary</h1><p>Date Range: {{date_range}}</p><ul><li>Total Calls: {{total_calls}}</li><li>Total Minutes: {{total_minutes}}</li><li>Total Cost: ${{total_cost}}</li></ul>",
        expectedVariables: ["period", "date_range", "total_calls", "total_minutes", "total_cost"]
    },
    {
        name: "System-Service Down Alert",
        uniqueIdentifier: "system_service_down_alert",
        type: "SYSTEM",
        subject: "CRITICAL ALERT: {{service_name}} is Down",
        htmlContent: "<h1>Service Outage Detected</h1><p>Service: {{service_name}} (ID: {{service_id}})</p><p>Type: {{service_type}}</p><p>Detected At: {{detected_at}}</p><p>Current Downtime: {{downtime_duration}}</p>",
        expectedVariables: ["service_name", "service_id", "service_type", "detected_at", "downtime_duration"]
    },
    {
        name: "System-Test Email",
        uniqueIdentifier: "system_test_email",
        type: "SYSTEM",
        subject: "Global Access AI - Test Connection",
        htmlContent: "<h1>SMTP Test Success</h1><p>This is a test email from Global Access AI Dashboard.</p><p>Provider: {{provider}}</p><p>Sender: {{from_name}} ({{from_email}})</p>",
        expectedVariables: ["from_name", "from_email", "provider"]
    }
];

async function seed() {
    console.log("🌱 Seeding system email templates...");

    for (const template of systemTemplates) {
        await db.insert(emailTemplates).values({
            ...template,
            updatedAt: new Date()
        }).onConflictDoUpdate({
            target: emailTemplates.uniqueIdentifier,
            set: {
                name: template.name,
                subject: template.subject,
                htmlContent: template.htmlContent,
                expectedVariables: template.expectedVariables,
                updatedAt: new Date()
            }
        });

        console.log(` ✅ Seeded: ${template.name}`);
    }

    console.log("🏁 Seeding complete.");
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
