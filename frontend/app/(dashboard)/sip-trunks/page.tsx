import { db } from "@/db";
import { sipTrunks, SipTrunk } from "@/db/schema";
import { desc } from "drizzle-orm";
import TopBar from "@/components/TopBar";
import SipTrunksView from "@/components/SipTrunksView";

export const dynamic = "force-dynamic";

export default async function SipTrunksPage() {
    let trunks: SipTrunk[] = [];
    let dbError = false;

    try {
        trunks = await db.select().from(sipTrunks).orderBy(desc(sipTrunks.createdAt));
    } catch (err) {
        console.error("Failed to fetch sip trunks from DB:", err);
        dbError = true;
    }

    return (
        <div className="flex flex-col h-full bg-[var(--bg-primary)]">
            <TopBar title="Telephony" subtitle="Configuration - SIP Trunks" />

            <div className="p-8 pb-32 overflow-y-auto">
                {dbError && (
                    <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-3">
                        <i className="bi bi-exclamation-triangle-fill shrink-0"></i>
                        <div>
                            <h3 className="font-semibold text-sm">Database Connection Error</h3>
                            <p className="text-sm opacity-90 mt-1">
                                Unable to connect to the Global Access PostgreSQL database. Please verify your connection string.
                            </p>
                        </div>
                    </div>
                )}

                {/* The main client component managing the tabs, table, and modal */}
                <SipTrunksView initialTrunks={trunks} />
            </div>
        </div>
    );
}
