// frontend/lib/redis.ts
import { createClient } from 'redis';

// Resolve URL exactly like queue.ts
let redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
    const host = process.env.REDIS_HOST || '127.0.0.1';
    const port = process.env.REDIS_PORT || '6379';
    const password = process.env.REDIS_PASSWORD ? `:${process.env.REDIS_PASSWORD}@` : '';
    redisUrl = `redis://${password}${host}:${port}`;
}

let redisClient: any = null;
let isConnected = false;

// 3. The "Mock" Object (This is what your Laptop uses)
const redisMock = {
    get: async () => null,
    set: async () => "OK",
    del: async () => 1,
    hget: async () => null,
    hset: async () => 1,
    exists: async () => 0,
    publish: async () => 0,
    expire: async () => true,
    ttl: async () => -2,
    isOpen: false
};

export function getSanitizedRedisTarget(): string {
    let url = process.env.REDIS_URL;
    if (!url) {
        const host = process.env.REDIS_HOST || '127.0.0.1';
        const port = process.env.REDIS_PORT || '6379';
        url = `redis://${host}:${port}`;
    }
    try {
        const parsed = new URL(url);
        const host = parsed.host;
        const db = parsed.pathname.replace("/", "") || "0";
        return `${host}/db:${db}`;
    } catch {
        const match = url.match(/redis:\/\/(?:[^@]+@)?([^/]+)(?:\/(.+))?/);
        if (match) {
            return `${match[1]}/db:${match[2] || "0"}`;
        }
        return url;
    }
}

// Initial server connection trigger
if (typeof window === 'undefined') {
    try {
        redisClient = createClient({ url: redisUrl });
        redisClient.on('error', (err: any) => {
            console.error("[Redis] Client Error:", err);
            isConnected = false;
        });
        redisClient.connect().then(() => {
            console.log("[Redis] Connected to:", getSanitizedRedisTarget());
            isConnected = true;
        }).catch((err: any) => {
            console.warn("[Redis] Connection failed, using mock client fallback:", err.message);
            isConnected = false;
        });
    } catch (e) {
        console.error("[Redis] Initialization failed:", e);
    }
}

// Helper to ensure connection is alive before using
export async function ensureRedisConnected(): Promise<boolean> {
    if (!redisClient) return false;
    if (isConnected) return true;
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
        isConnected = true;
        return true;
    } catch (err) {
        isConnected = false;
        return false;
    }
}

export function isRedisClientConnected(): boolean {
    return isConnected;
}

// Proxied Client: If connected, use real client. Otherwise fallback to mock!
const redis = new Proxy({}, {
    get(target, prop) {
        if (isConnected && redisClient) {
            return (...args: any[]) => redisClient[prop](...args);
        }
        // Fallback to mock
        return (redisMock as any)[prop];
    }
}) as any;

/**
 * Pushes agent configuration to Redis for immediate worker pickup.
 * Maps Drizzle's camelCase object back to the snake_case format the Python worker expects.
 */
export async function pushAgentToRedis(agent: any) {
    await ensureRedisConnected();
    if (!isConnected || !redisClient) return true; // mock fallback for local development

    try {
        const agentData = {
            id: agent.id,
            name: agent.name,
            slug: agent.slug,
            status: agent.status,
            system_prompt: agent.systemPrompt,
            initial_greeting: agent.initialGreeting,
            knowledge_base: agent.knowledgeBase,
            tool_instructions: agent.toolInstructions,
            pipeline_mode: agent.pipelineMode,
            llm_config: {
                provider: agent.llmProvider,
                model: agent.llmModel,
                temperature: parseFloat(String(agent.llmTemperature || "0.8")),
                azure_deployment: agent.llmAzureDeployment
            },
            stt_config: {
                provider: agent.sttProvider,
                model: agent.sttModel,
                language: agent.sttLanguage,
                responsiveness: parseFloat(String(agent.sttResponsiveness || "0.6")),
                detect_language: agent.sttDetectLanguage,
                custom_vocab: agent.sttCustomVocab,
                smart_formatting: agent.sttSmartFormatting,
                remove_fillers: agent.sttRemoveFillers,
                azure_deployment: agent.sttAzureDeployment
            },
            tts_config: {
                provider: agent.ttsProvider,
                model: agent.ttsModel,
                voice: agent.ttsVoiceId, // Worker expects 'voice'
                language: agent.ttsLanguage,
                speed: parseFloat(String(agent.ttsSpeed || "1.0")),
                stability: parseFloat(String(agent.elevenLabsStability || "0.5")),
                similarity: parseFloat(String(agent.elevenLabsSimilarity || "0.75")),
                azure_deployment: agent.ttsAzureDeployment
            },
            realtime_config: {
                enabled: agent.pipelineMode === "realtime",
                provider: agent.rtProvider,
                model: agent.rtModel,
                voice: agent.rtVoice,
                language: agent.rtLanguage,
                modalities: agent.rtModalities,
                proactivity: agent.rtProactivity,
                affective_dialog: agent.rtAffectiveDialog,
                noise_reduction: agent.rtNoiseReduction,
                thinking_budget: agent.rtThinkingBudget,
                max_output_tokens: agent.rtMaxOutputTokens,
                top_p: agent.rtTopP ? parseFloat(String(agent.rtTopP)) : null,
                temperature: parseFloat(String(agent.rtTemperature || "0.8")),
                speed: agent.rtSpeed ? parseFloat(String(agent.rtSpeed)) : null,
                turn_detection: agent.rtTurnDetection,
                turn_detection_eagerness: agent.rtTurnDetectionEagerness,
                ctx_compression_enabled: agent.rtCtxCompressionEnabled,
                ctx_compression_trigger: agent.rtCtxCompressionTrigger,
                ctx_compression_target: agent.rtCtxCompressionTarget,
                azure_deployment: agent.rtAzureDeployment
            },
            tools_config: agent.toolsConfig || {},
            extra_config: agent.extraConfig || {},
            // Eligibility (Phase 18)
            eligibility_rules: agent.eligibilityRules || {}
        };

        const json = JSON.stringify(agentData);
        await redisClient.set(`agent:${agent.id}`, json);
        if (agent.slug) {
            await redisClient.set(`agent:${agent.slug}`, json);
        }
        
        // Notify worker of update
        await redisClient.publish("agent_updates", JSON.stringify({ id: agent.id, action: "update" }));
        
        console.log(`[Redis] Pushed config for agent: ${agent.name} (${agent.id})`);
        return true;
    } catch (err) {
        console.error("[Redis] Failed to push agent to Redis:", err);
        return false;
    }
}

/**
 * Pushes system integrations (API keys) to Redis.
 */
export async function syncIntegrationToRedis(provider: string, apiKey: string, config: any = {}) {
    await ensureRedisConnected();
    if (!isConnected || !redisClient) return true;

    try {
        const data = {
            api_key: apiKey,
            ...config
        };
        await redisClient.set(`integration:${provider}`, JSON.stringify(data));
        
        // Special case for global API key discovery in worker
        await redisClient.hSet("api_keys", provider, apiKey);
        
        console.log(`[Redis] Synced integration: ${provider}`);
        return true;
    } catch (err) {
        console.error(`[Redis] Failed to sync integration ${provider}:`, err);
        return false;
    }
}

// --- THE DEFAULT EXPORT ---
export default redis;