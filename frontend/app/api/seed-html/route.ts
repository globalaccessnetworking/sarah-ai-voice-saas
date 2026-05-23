import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

const BASE_STYLE = `
    body { margin: 0; padding: 0; background-color: #09090b; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #f4f4f5; }
    .container { max-width: 600px; margin: 40px auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .header { background-color: #121214; padding: 24px; border-bottom: 1px solid #27272a; text-align: center; }
    .header-text { color: #22c55e; font-size: 14px; font-weight: bold; letter-spacing: 0.2em; text-transform: uppercase; }
    .content { padding: 40px; }
    .footer { background-color: #121214; padding: 20px; border-top: 1px solid #27272a; text-align: center; }
    .footer-text { color: #52525b; font-size: 11px; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; }
    .headline { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #ffffff; }
    .subtext { font-size: 15px; color: #a1a1aa; line-height: 1.6; margin-bottom: 30px; }
    .data-box { background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin-bottom: 30px; }
    .data-item { font-size: 13px; margin-bottom: 8px; color: #e4e4e7; font-family: 'Monaco', 'Consolas', 'Courier New', monospace; }
    .data-label { color: #71717a; font-weight: bold; margin-right: 8px; }
    .button { display: inline-block; padding: 14px 28px; border-radius: 10px; font-size: 14px; font-weight: bold; text-decoration: none; transition: all 0.2s; }
    .button-green { background-color: #22c55e; color: #ffffff; box-shadow: 0 4px 14px rgba(34, 197, 94, 0.3); }
    .button-red { background-color: #ef4444; color: #ffffff; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3); }
`;

const wrapTemplate = (headline: string, subtext: string, dataItems: { label: string, value: string }[], buttonText: string, buttonColor: 'green' | 'red', buttonLink: string = "#") => `
<!DOCTYPE html>
<html>
<head>
    <style>${BASE_STYLE}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="header-text">Global Access AI</span>
        </div>
        <div class="content">
            <div class="headline" style="${buttonColor === 'red' ? 'color: #ef4444;' : ''}">${headline}</div>
            <div class="subtext">${subtext}</div>
            
            ${dataItems.length > 0 ? `
            <div class="data-box">
                ${dataItems.map(item => `
                    <div class="data-item">
                        <span class="data-label">${item.label}:</span> ${item.value}
                    </div>
                `).join('')}
            </div>
            ` : ''}

            <a href="${buttonLink}" class="button ${buttonColor === 'green' ? 'button-green' : 'button-red'}">
                ${buttonText}
            </a>
        </div>
        <div class="footer">
            <span class="footer-text">Automated message from Global Access Network Operations Center.</span>
        </div>
    </div>
</body>
</html>
`;

export async function GET() {
    try {
        const templates = [
            {
                identifier: "system_service_down_alert",
                html: wrapTemplate(
                    "CRITICAL ALERT: Service Offline",
                    "The automated monitoring system has detected an outage in your infrastructure and requires immediate attention.",
                    [
                        { label: "Service", value: "{{service_name}} ({{service_type}})" },
                        { label: "Instance ID", value: "{{service_id}}" },
                        { label: "Detected At", value: "{{detected_at}}" },
                        { label: "Duration", value: "{{downtime_duration}}" }
                    ],
                    "Acknowledge Alert",
                    "red"
                )
            },
            {
                identifier: "system_campaign_completion",
                html: wrapTemplate(
                    "Campaign Completed Successfully",
                    "Your AI voice campaign has finished processing all leads. Detailed analytics are now available for review.",
                    [
                        { label: "Campaign Name", value: "{{campaign_name}}" },
                        { label: "Campaign ID", value: "#{{campaign_id}}" },
                        { label: "AI Agent", value: "{{agent_name}}" }
                    ],
                    "View Analytics Dashboard",
                    "green"
                )
            },
            {
                identifier: "system_password_reset",
                html: wrapTemplate(
                    "Password Reset Request",
                    "Hello {{username}}, a password reset was requested for your Global Access Cloud account. If this was you, click the button below securely. This link expires in 15 minutes.",
                    [],
                    "Reset Password",
                    "green",
                    "{{reset_link}}"
                )
            }
        ];

        const results = [];
        for (const t of templates) {
            const result = await db.update(schema.emailTemplates)
                .set({ 
                    htmlContent: t.html,
                    updatedAt: new Date()
                })
                .where(eq(schema.emailTemplates.uniqueIdentifier, t.identifier))
                .returning();
            results.push({ identifier: t.identifier, updated: result.length > 0 });
        }

        return NextResponse.json({
            message: "Master HTML Templates Injected",
            results
        });
    } catch (error: any) {
        console.error("[SeedAPI] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
