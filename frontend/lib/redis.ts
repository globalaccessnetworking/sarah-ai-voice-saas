// frontend/lib/redis.ts
import { createClient } from 'redis';

// 1. Safety Switch: Detect if we are on your Laptop or the VPS
const isLocal = process.env.NODE_ENV === 'development' || !process.env.REDIS_URL;

// 2. Initialize Real Client (Only runs on VPS)
const redisClient = !isLocal ? createClient({ url: process.env.REDIS_URL }) : null;
if (redisClient) {
    redisClient.connect().catch((err) => console.error("Redis Connection Error:", err));
}

// 3. The "Mock" Object (This is what your Laptop uses)
const redisMock = {
    get: async () => null,
    set: async () => "OK",
    del: async () => 1,
    hget: async () => null,
    hset: async () => 1,
    exists: async () => 0,
    publish: async () => 0,
};

// 4. Create the final "redis" object
const redis = isLocal ? redisMock : (redisClient as any);

/**
 * Pushes agent configuration to Redis for immediate worker pickup.
 * Maps Drizzle's camelCase object back to the snake_case format the Python worker expects.
 */
export async function pushAgentToRedis(agent: any) {
    if (isLocal || !redisClient) return true;

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
    if (isLocal || !redisClient) return true;

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