import { db } from "@/db";
import { tools, agents, agentTools } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import ToolsView from "@/components/ToolsView";

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
    try {
        const allTools = await db.select().from(tools).orderBy(desc(tools.createdAt));
        const allAgents = await db.select({
            id: agents.id,
            name: agents.name,
            status: agents.status,
            pipelineMode: agents.pipelineMode,
        }).from(agents).orderBy(desc(agents.createdAt));

        const assignments = await db.select({
            id: agentTools.id,
            agentId: agentTools.agentId,
            toolId: agentTools.toolId,
            toolName: tools.name,
            toolType: tools.type,
        })
            .from(agentTools)
            .leftJoin(tools, eq(agentTools.toolId, tools.id));

        return (
            <div className="max-w-[1600px] mx-auto text-slate-200">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Tool Registry</h1>
                        <p className="text-slate-400 text-lg">Manage agent tools and function calling capabilities</p>
                    </div>
                </div>

                <ToolsView
                    initialTools={allTools}
                    agents={allAgents}
                    initialAssignments={assignments}
                />
            </div>
        );
    } catch (error) {
        console.error("Failed to load tools data:", error);
        return (
            <div className="p-8 max-w-[1600px] mx-auto text-center">
                <h1 className="text-2xl font-bold text-red-500 mb-4">Database Connection Error</h1>
                <p className="text-slate-400">Make sure PostgreSQL is running and environment variables are loaded.</p>
            </div>
        );
    }
}
