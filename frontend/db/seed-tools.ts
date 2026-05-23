import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { tools } from "./schema";

const connectionString = "postgresql://postgres:phagelabdrshafiq@localhost:5432/global_access";
const pool = new Pool({ connectionString });
const db = drizzle(pool);

const defaultTools = [
    // Communication
    { name: "send_email", description: "Send an email to a specified recipient with a subject and body.", type: "system", category: "communication" },
    { name: "send_sms", description: "Send a text message to a phone number.", type: "system", category: "communication" },

    // Data
    { name: "lookup_caller", description: "Retrieve information about the current caller from the CRM.", type: "system", category: "data" },

    // System
    { name: "attended_transfer", description: "Transfer the call to another agent after speaking with them.", type: "system", category: "system" },
    { name: "blind_transfer", description: "Directly transfer the call to another number without consultation.", type: "system", category: "system" },
    { name: "hangup", description: "Terminate the current call.", type: "system", category: "system" },
    { name: "hold", description: "Place the caller on hold or resume the call.", type: "system", category: "system" },

    // Utility
    { name: "background_audio", description: "Control background music or ambient sounds during the call.", type: "system", category: "utility" },
    { name: "collect_dtmf", description: "Collect touch-tone digits provided by the caller.", type: "system", category: "utility" },
    { name: "get_datetime", description: "Retrieve the current date and time in the user's timezone.", type: "system", category: "utility" },
    { name: "play_audio", description: "Play a specific audio file or URL to the caller.", type: "system", category: "utility" },
    { name: "record_note", description: "Save a transcription or recording segment as a memo to the CRM.", type: "system", category: "utility" },
    { name: "schedule_callback", description: "Create a reminder for an agent to call the user back at a specific time.", type: "system", category: "utility" },
];

async function seed() {
    console.log("🌱 Seeding default system tools...");

    for (const tool of defaultTools) {
        const id = `tool_${tool.name}`;

        // We add category to metadata since the schema doesn't have a strict category column yet 
        // OR we can just use the provided description.
        // The user wants grouping by category in UI, so I'll store category in parameters_schema or metadata if available.
        // Actually, I'll just keep the structure standard.

        await db.insert(tools).values({
            id: id,
            name: tool.name,
            description: tool.description,
            type: tool.type,
            parametersSchema: { category: tool.category },
            endpointUrl: null,
        }).onConflictDoUpdate({
            target: tools.id,
            set: {
                description: tool.description,
                parametersSchema: { category: tool.category },
            }
        });

        console.log(` ✅ Seeded: ${tool.name}`);
    }

    console.log("🏁 Seeding complete.");
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
