import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname, "../.env.local") });

import { db, schema } from "../db";

async function checkStatus() {
    console.log("--- Current Provider Health Status ---");
    const configs = await db.query.emailConfigurations.findMany();
    
    if (configs.length === 0) {
        console.log("No email configurations found.");
        return;
    }

    configs.forEach(c => {
        console.log(`[${c.provider}] ID: ${c.id} | Health: ${c.healthStatus} | Last Checked: ${c.lastCheckedAt}`);
    });
    console.log("--------------------------------------");
}

checkStatus().catch(console.error);
