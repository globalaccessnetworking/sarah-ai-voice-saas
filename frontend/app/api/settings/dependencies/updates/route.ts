import { NextResponse } from "next/server";

const TRACKED_PACKAGES = [
    "aioboto3", "anthropic", "boto3", "cartesia", "deepgram-sdk", "elevenlabs", 
    "google-cloud-speech", "google-cloud-texttospeech", "google-generativeai", 
    "livekit", "livekit-agents", "livekit-api", "livekit-blingfire", 
    "livekit-plugins-anthropic", "livekit-plugins-aws", "livekit-plugins-azure", 
    "livekit-plugins-cartesia", "livekit-plugins-deepgram", "livekit-plugins-elevenlabs", 
    "livekit-plugins-google", "livekit-plugins-groq", "livekit-plugins-noise-cancellation", 
    "livekit-plugins-openai", "livekit-plugins-silero", "livekit-plugins-turn-detector", 
    "livekit-plugins-xai", "livekit-protocol", "openai"
];

export async function GET() {
    try {
        const latestVersions: Record<string, string> = {};

        // Fetch all PyPI data in parallel using Promise.allSettled
        const results = await Promise.allSettled(
            TRACKED_PACKAGES.map(async (pkg) => {
                const response = await fetch(`https://pypi.org/pypi/${pkg}/json`, {
                    next: { revalidate: 3600 } // Cache for 1 hour to prevent rate limiting
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${pkg}`);
                }
                
                const data = await response.json();
                return {
                    pkg,
                    version: data.info.version
                };
            })
        );

        // Process results
        results.forEach((result) => {
            if (result.status === 'fulfilled') {
                latestVersions[result.value.pkg] = result.value.version;
            } else {
                console.warn("PyPI Fetch Error:", result.reason);
            }
        });

        return NextResponse.json({
            status: "success",
            latestVersions
        });

    } catch (error) {
        console.error("PyPI Engine Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch PyPI versions" },
            { status: 500 }
        );
    }
}
