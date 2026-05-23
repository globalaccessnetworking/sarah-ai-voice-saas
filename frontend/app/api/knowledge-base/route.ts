import { NextResponse } from "next/server";
import { db } from "@/db";
import { knowledgeBaseFiles } from "@/db/schema";
import { desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
    try {
        const files = await db.select().from(knowledgeBaseFiles).orderBy(desc(knowledgeBaseFiles.uploadedAt));
        return NextResponse.json({ files });
    } catch (error) {
        console.error("Failed to fetch knowledge base files:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Mocking the upload and vectorization process
        const newFile = {
            id: uuidv4(),
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type || "application/octet-stream",
            status: "Ready", // Simulate instant readiness for now
            vectorCount: Math.floor(Math.random() * 1500) + 200, // Random count between 200 and 1700
            uploadedAt: new Date(),
        };

        await db.insert(knowledgeBaseFiles).values(newFile);

        return NextResponse.json(newFile);
    } catch (error) {
        console.error("Failed to upload knowledge base file:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
