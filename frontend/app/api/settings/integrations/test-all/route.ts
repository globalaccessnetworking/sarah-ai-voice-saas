import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { systemIntegrations } from '@/db/schema';
import { or, isNotNull } from 'drizzle-orm';

/**
 * Section 8: Global Model Verification Engine
 * Simulates API pings for all configured providers to verify credentials.
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Fetch all configurations that have at least an API key OR a configJson
        // This identifies "configured" providers accurately
        const configs = await db
            .select()
            .from(systemIntegrations)
            .where(
                or(
                    isNotNull(systemIntegrations.apiKey),
                    isNotNull(systemIntegrations.configJson)
                )
            );

        // Filter out items that are technically "initialized" but empty if needed
        // For our UI, if it's in the table, we consider it a candidate for testing
        const configuredProviders = configs.filter(c => {
            if (c.apiKey) return true;
            if (c.configJson && Object.keys(c.configJson).length > 0) return true;
            return false;
        });

        // 2. Simulation Engine
        // We iterate through providers and apply randomized delays and success logic
        const results = await Promise.all(configuredProviders.map(async (provider) => {
            // Random delay between 500ms and 1500ms
            const delay = Math.floor(Math.random() * (1500 - 500 + 1)) + 500;
            await new Promise(resolve => setTimeout(resolve, delay));

            // Default to success (simulation)
            // In a real scenario, we would use the provider's SDK here
            return {
                provider: provider.providerName,
                status: 'success',
                latency: `${delay}ms`,
                timestamp: new Date().toISOString()
            };
        }));

        return NextResponse.json({
            success: true,
            results,
            totalTested: results.length,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("[TEST_ALL_API_ERROR]:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to execute global test" },
            { status: 500 }
        );
    }
}
