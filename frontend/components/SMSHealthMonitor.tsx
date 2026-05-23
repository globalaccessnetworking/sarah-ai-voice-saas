"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

/**
 * Background component that monitors the health of the SMS Notification System.
 * Pings the health API and alerts admins of critical dispatch failures.
 */
export default function SMSHealthMonitor() {
    useEffect(() => {
        const checkHealth = async () => {
            try {
                const res = await fetch("/api/settings/sms/health");
                const data = await res.json();

                if (data.success && !data.health.isHealthy) {
                    toast.error("SMS GATEWAY ERROR", {
                        description: data.health.recommendation || "Multiple dispatch failures detected.",
                        icon: <AlertCircle className="text-rose-500" />,
                        duration: 15000, // 15 seconds to ensure it's seen
                    });
                } else if (data.success && !data.health.hasActiveConfig) {
                    toast.warning("SMS GATEWAY INACTIVE", {
                        description: "No active SMS gateway configured. Notifications are disabled.",
                        duration: 10000,
                    });
                }
            } catch (error) {
                console.error("[SMS Monitor] Health check failed:", error);
            }
        };

        // Initial check
        checkHealth();

        // Check every 5 minutes
        const interval = setInterval(checkHealth, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return null; // Invisible component
}
