import { db } from "@/db";
import { webChatAgents } from "@/db/schema";
import { eq } from "drizzle-orm";
import WidgetClient from "./WidgetClient";

// We want this layout to be totally empty, but since it's nested under app/
// and the root layout has the sidebar, we might need a separate routing group 
// or tell the client to render fullscreen over everything.
// For now we will render the Client component which will apply fixed 100vh styling.

export default async function WidgetPage(
    { params }: { params: Promise<{ agent_id: string }> }
) {
    const { agent_id } = await params;

    // Fetch agent config
    const agent = await db.query.webChatAgents.findFirst({
        where: eq(webChatAgents.id, agent_id)
    });

    if (!agent) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-zinc-100 text-zinc-500 font-sans">
                Widget Configuration Not Found
            </div>
        );
    }

    const config = (agent.widgetConfig as any) || {};

    return (
        <WidgetClient
            agentId={agent.id}
            title={config.title || "Chat with us"}
            primaryColor={config.primary_color || "#1a73e8"}
            theme={config.theme || "light"}
            welcomeMessage={config.welcome_message || "Hello! How can I assist you today?"}
            brandingText={config.branding_text !== undefined ? config.branding_text : "Powered by LiveKit"}
        />
    );
}
