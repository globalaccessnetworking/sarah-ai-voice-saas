import { createClient } from 'redis';

let client: ReturnType<typeof createClient> | null = null;

async function getClient() {
    if (client) return client;
    
    // Fallback logic for Redis connection
    let url = process.env.REDIS_URL;
    if (!url) {
        const host = process.env.REDIS_HOST || '127.0.0.1';
        const port = process.env.REDIS_PORT || '6379';
        const password = process.env.REDIS_PASSWORD ? `:${process.env.REDIS_PASSWORD}@` : '';
        url = `redis://${password}${host}:${port}`;
    }

    client = createClient({ url });
    client.on('error', (err) => console.error('Redis Queue Client Error:', err));
    
    await client.connect();
    return client;
}

export async function enqueueRedisJob(queueName: string, payload: unknown): Promise<void> {
    // We use lPush here because the consumer (outbound_dialer.py) uses BRPOP.
    // LPUSH + BRPOP = FIFO queue behavior.
    try {
        const c = await getClient();
        const json = JSON.stringify(payload);
        await c.lPush(queueName, json);
        const len = await c.lLen(queueName);
        console.log("[Queue] Enqueued", { queueName, length: len });
    } catch (error) {
        console.error(`[Queue] Failed to enqueue job to ${queueName}:`, error);
        throw error; // Let the route handle the error and keep transaction safety
    }
}
