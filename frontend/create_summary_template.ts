import { db, schema } from "./db";

async function createTemplate() {
    console.log("Creating scheduled summary template...");
    
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{period}} Activity Report</title>
        <style>
            body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; }
            .header { padding: 32px; border-bottom: 1px solid #27272a; background: linear-gradient(135deg, #09090b 0%, #18181b 100%); }
            .content { padding: 32px; }
            .footer { padding: 24px; border-top: 1px solid #27272a; font-size: 12px; color: #71717a; text-align: center; }
            h1 { font-size: 24px; font-weight: 600; color: #ffffff; margin: 0; letter-spacing: -0.025em; }
            .date { color: #3b82f6; font-size: 14px; font-weight: 500; margin-top: 8px; }
            .stats-grid { display: grid; gap: 16px; margin: 24px 0; }
            .stat-card { background-color: #09090b; border: 1px solid #27272a; padding: 20px; rounded-lg; }
            .stat-label { font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.1em; }
            .stat-value { font-size: 24px; font-weight: 600; color: #ffffff; margin-top: 4px; }
            .accent-blue { border-left: 4px solid #3b82f6; }
            .accent-emerald { border-left: 4px solid #10b981; }
            .accent-amber { border-left: 4px solid #f59e0b; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>{{period}} Activity Report</h1>
                <div class="date">Reporting Period: {{date_range}}</div>
            </div>
            <div class="content">
                <div class="stats-grid">
                    <div class="stat-card accent-blue">
                        <div class="stat-label">Total Voice Sessions</div>
                        <div class="stat-value">{{total_calls}}</div>
                    </div>
                    <div class="stat-card accent-emerald">
                        <div class="stat-label">System Minutes Consumed</div>
                        <div class="stat-value">{{total_minutes}}</div>
                    </div>
                    <div class="stat-card accent-amber">
                        <div class="stat-label">Infrastructure Cost</div>
                        <div class="stat-value">{{total_cost}}</div>
                    </div>
                </div>
                <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">
                    All metrics were processed on-sovereign via the Scheduled Summary Aggregation Engine.
                    This report verifies system deliverability and cost efficiency.
                </p>
            </div>
            <div class="footer">
                &copy; {{current_year}} Global Access AI Engine. Confidential // Internal Dispatch Only.
            </div>
        </div>
    </body>
    </html>
    `;

    await db.insert(schema.emailTemplates).values({
        name: "Scheduled Summary Activity Report",
        uniqueIdentifier: "system_report_scheduled_summary",
        subject: "Daily Activity Report: {{total_calls}} Sessions Handled",
        htmlContent: htmlContent,
        expectedVariables: ["period", "date_range", "total_calls", "total_minutes", "total_cost", "current_year"]
    });

    console.log("Template created successfully.");
}

createTemplate().catch(console.error);
