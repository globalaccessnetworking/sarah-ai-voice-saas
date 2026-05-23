import { db, schema } from "@/db";
import { desc } from "drizzle-orm";
import TopBar from "@/components/TopBar";
import CampaignsView from "@/components/CampaignsView";

const { campaigns, agents, sipTrunks } = schema;

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
    let initialCampaigns: any[] = [];
    let initialAgents: any[] = [];
    let initialTrunks: any[] = [];
    let dbError = false;

    try {
        [initialCampaigns, initialAgents, initialTrunks] = await Promise.all([
            db.select().from(campaigns).orderBy(desc(campaigns.createdAt)),
            db.select().from(agents).orderBy(desc(agents.createdAt)),
            db.select().from(sipTrunks).where(require('drizzle-orm').eq(sipTrunks.type, 'outbound')).orderBy(desc(sipTrunks.createdAt))
        ]);
    } catch (err) {
        console.error("Failed to fetch campaign data from DB:", err);
        dbError = true;
    }

    return (
        <div className="flex flex-col h-full bg-[var(--bg-primary)]">
            <TopBar title="Campaigns" subtitle="Outbound Auto-Dialer" />

            <div className="p-8 pb-32 overflow-y-auto">
                {dbError && (
                    <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-3">
                        <i className="bi bi-exclamation-triangle-fill shrink-0"></i>
                        <div>
                            <h3 className="font-semibold text-sm">Database Connection Error</h3>
                            <p className="text-sm opacity-90 mt-1">
                                Unable to connect to the Global Access PostgreSQL database.
                            </p>
                        </div>
                    </div>
                )}

                <CampaignsView
                    initialCampaigns={initialCampaigns}
                    agents={initialAgents}
                    trunks={initialTrunks}
                />
            </div>
        </div>
    );
}
