import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await db.select().from(users).where(eq(users.id, id)).limit(1);

        if (user.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user[0]);
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const updatedUser = await db.update(users).set({
            displayName: body.displayName,
            isActive: body.isActive,
            monthlyMinutesQuota: body.monthlyMinutesQuota,
            marginConfig: body.marginConfig,
            assignedAgents: body.assignedAgents,
            assignedNumbers: body.assignedNumbers,
            permissions: body.permissions,
            updatedAt: new Date()
        }).where(eq(users.id, id)).returning();

        if (updatedUser.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(updatedUser[0]);
    } catch (error: any) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Failed to update user", details: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const deletedUser = await db.delete(users).where(eq(users.id, id)).returning();

        if (deletedUser.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, user: deletedUser[0] });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}
