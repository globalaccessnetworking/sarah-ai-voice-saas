export type AgentStatus = "running" | "stopped" | "restarting";
export type AgentHealth = "healthy" | "error";

export interface Agent {
    id: string;
    name: string;
    slug: string;
    status: AgentStatus;
    health: AgentHealth;
    llmProvider: string;
    sttProvider: string;
    ttsProvider: string;
    healthErrors?: string[];
}
