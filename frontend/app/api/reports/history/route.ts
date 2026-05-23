import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reportHistory, reportRules } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Fetch history and join with rules to get the rule name
        const historyLogs = await db
            .select({
                id: reportHistory.id,
                ruleId: reportHistory.ruleId,
                ruleName: reportRules.name,
                status: reportHistory.status,
                errorMessage: reportHistory.errorMessage,
                executedAt: reportHistory.executedAt,
            })
            .from(reportHistory)
            .leftJoin(reportRules, eq(reportHistory.ruleId, reportRules.id))
            .orderBy(desc(reportHistory.executedAt))
            .limit(100);

        return NextResponse.json(historyLogs);
    } catch (error: any) {
        console.error("Failed to fetch report history", error);
        return NextResponse.json({ error: "Failed to fetch report history", details: error.message }, { status: 500 });
    }
}
