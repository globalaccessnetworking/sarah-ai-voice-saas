import { db } from "@/db";
import { phoneNumbers, sipTrunks, dispatchRules, agents } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import TelephonyView from "@/components/TelephonyView";

export const dynamic = "force-dynamic";

export default async function TelephonyPage() {
    try {
        // Fetch requisite data for both tabs
        const trunks = await db.select().from(sipTrunks).orderBy(desc(sipTrunks.createdAt));
        const numbers = await db.select().from(phoneNumbers).orderBy(desc(phoneNumbers.createdAt));
        const rulesDb = await db.select({
            id: dispatchRules.id,
            name: dispatchRules.name,
            phoneNumberId: dispatchRules.phoneNumberId,
            agentId: dispatchRules.agentId,
            createdAt: dispatchRules.createdAt,
            phoneNumber: phoneNumbers.number,
            agentName: agents.name,
        })
            .from(dispatchRules)
            .leftJoin(phoneNumbers, eq(dispatchRules.phoneNumberId, phoneNumbers.id))
            .leftJoin(agents, eq(dispatchRules.agentId, agents.id))
            .orderBy(desc(dispatchRules.createdAt));

        const agentsList = await db.select().from(agents).orderBy(desc(agents.createdAt));

        return (
            <div className="p-8 max-w-[1600px] mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Telephony Dispatcher</h1>
                    <p className="text-slate-400">Manage phone numbers and routing rules for your AI agents.</p>
                </div>

                <TelephonyView
                    initialNumbers={numbers}
                    initialRules={rulesDb}
                    trunks={trunks}
                    agents={agentsList}
                />
            </div>
        );
    } catch (error) {
        console.error("Failed to load telephony data:", error);
        return (
            <div className="p-8 max-w-[1600px] mx-auto text-center">
                <h1 className="text-2xl font-bold text-red-500 mb-4">Database Connection Error</h1>
                <p className="text-slate-400">Make sure PostgreSQL is running and the credentials are correct.</p>
            </div>
        );
    }
}
