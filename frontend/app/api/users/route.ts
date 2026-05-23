import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
    try {
        const usersList = await db.select({
            id: users.id,
            email: users.email,
            displayName: users.displayName,
            isActive: users.isActive,
            twoFactorEnabled: users.twoFactorEnabled,
            monthlyMinutesQuota: users.monthlyMinutesQuota,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt
        }).from(users).orderBy(desc(users.createdAt));

        return NextResponse.json(usersList);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const newUser = await db.insert(users).values({
            email: body.email,
            displayName: body.displayName,
            passwordHash: body.passwordHash || "default_hash", // In a real app we would hash this
            isActive: body.isActive ?? true,
            monthlyMinutesQuota: body.monthlyMinutesQuota || 0,
            marginConfig: body.marginConfig,
            assignedAgents: body.assignedAgents,
            assignedNumbers: body.assignedNumbers,
            permissions: body.permissions
        }).returning();

        return NextResponse.json(newUser[0], { status: 201 });
    } catch (error: any) {
        console.error("Error creating user:", error);
        return NextResponse.json({ error: "Failed to create user", details: error.message }, { status: 500 });
    }
}
