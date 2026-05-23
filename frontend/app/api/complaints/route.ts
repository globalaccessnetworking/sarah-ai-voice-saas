import { NextResponse } from "next/server";
import { Client } from "pg";
import { smsService } from "@/lib/sms-service";

const DB_URL =
    process.env.DATABASE_URL ||
    "postgresql://postgres:pakistansuthrapunjab@115.186.170.43:5432/global_access";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const district = searchParams.get("district") || "all";
    const limit = parseInt(searchParams.get("limit") || "100");

    const client = new Client({ connectionString: DB_URL });
    try {
        await client.connect();

        let conditions: string[] = [];
        let params: any[] = [];
        let idx = 1;

        if (search) {
            conditions.push(
                `(name ILIKE $${idx} OR phone ILIKE $${idx} OR issue ILIKE $${idx} OR address ILIKE $${idx} OR ticket_id ILIKE $${idx})`
            );
            params.push(`%${search}%`);
            idx++;
        }
        if (status !== "all") {
            conditions.push(`LOWER(status) = $${idx}`);
            params.push(status.toLowerCase());
            idx++;
        }
        if (district !== "all") {
            conditions.push(`district ILIKE $${idx}`);
            params.push(`%${district}%`);
            idx++;
        }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
        params.push(limit);

        const result = await client.query(
            `SELECT id, ticket_id, name, phone, asterisk_number, issue, district, address, landmark,
                    status, priority, notes, created_at, sentiment, recording_id
             FROM complaints
             ${where}
             ORDER BY created_at DESC
             LIMIT $${idx}`,
            params
        );

        // Also fetch summary stats
        const statsResult = await client.query(`
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE LOWER(status) = 'pending') AS pending,
                COUNT(*) FILTER (WHERE LOWER(status) = 'resolved') AS resolved,
                COUNT(*) FILTER (WHERE LOWER(status) = 'unresolved') AS unresolved
            FROM complaints
        `);

        // Fetch unique districts for filter dropdown
        const districtsResult = await client.query(
            `SELECT DISTINCT district FROM complaints WHERE district IS NOT NULL AND district <> '' ORDER BY district`
        );

        return NextResponse.json({
            complaints: result.rows,
            stats: statsResult.rows[0],
            districts: districtsResult.rows.map((r: any) => r.district),
        });
    } catch (error) {
        console.error("Complaints API error:", error);
        return NextResponse.json({ error: "Failed to fetch complaints" }, { status: 500 });
    } finally {
        await client.end();
    }
}

export async function PATCH(request: Request) {
    const body = await request.json();
    const { id, status, priority, name, phone, asterisk_number, district, address, issue } = body;

    if (!id) {
        return NextResponse.json({ error: "Complaint ID is required" }, { status: 400 });
    }

    const client = new Client({ connectionString: DB_URL });
    try {
        await client.connect();

        const fields: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (status !== undefined) { fields.push(`status = $${idx++}`); values.push(status); }
        if (priority !== undefined) { fields.push(`priority = $${idx++}`); values.push(priority); }
        if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
        if (phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(phone); }
        if (asterisk_number !== undefined) { fields.push(`asterisk_number = $${idx++}`); values.push(asterisk_number); }
        if (district !== undefined) { fields.push(`district = $${idx++}`); values.push(district); }
        if (address !== undefined) { fields.push(`address = $${idx++}`); values.push(address); }
        if (issue !== undefined) { fields.push(`issue = $${idx++}`); values.push(issue); }

        if (fields.length === 0) {
            return NextResponse.json({ error: "No fields to update" }, { status: 400 });
        }

        values.push(id);
        const result = await client.query(
            `UPDATE complaints SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
            values
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
        }

        return NextResponse.json({ complaint: result.rows[0] });
    } catch (error) {
        console.error("Complaint update error:", error);
        return NextResponse.json({ error: "Failed to update complaint" }, { status: 500 });
    } finally {
        await client.end();
    }
}

export async function POST(request: Request) {
    const body = await request.json();
    const { name, phone, asterisk_number, district, issue } = body;

    if (!name || !phone || !issue) {
        return NextResponse.json({ error: "Name, Phone, and Issue are required" }, { status: 400 });
    }

    const client = new Client({ connectionString: DB_URL });
    try {
        await client.connect();

        // 1. Generate Ticket ID (SP-XX sequence)
        const lastResult = await client.query(
            "SELECT ticket_id FROM complaints WHERE ticket_id LIKE 'SP-%' ORDER BY id DESC LIMIT 1"
        );
        
        let nextNumber = 1;
        if (lastResult.rows.length > 0) {
            const lastId = lastResult.rows[0].ticket_id || "SP-0";
            const match = lastId.match(/SP-(\d+)/);
            if (match) {
                nextNumber = parseInt(match[1]) + 1;
            }
        }
        const ticketId = `SP-${nextNumber}`;

        // 2. Insert with Defaults
        const result = await client.query(
            `INSERT INTO complaints (
                ticket_id, name, phone, asterisk_number, district, issue, 
                status, outbound_status, priority, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING *`,
            [ticketId, name, phone, asterisk_number || null, district || "Other", issue, "Pending", "pending", "Normal"]
        );

        const newComplaint = result.rows[0];

        // 3. Trigger Bilingual SMS Acknowledgment (Non-blocking)
        smsService.sendAsync({
            recipient: newComplaint.phone,
            ticketId: newComplaint.ticket_id,
            triggerType: "complaint_submitted",
            variables: {
                district: newComplaint.district || "Other"
            }
        });

        return NextResponse.json({ complaint: newComplaint });
    } catch (error) {
        console.error("Manual complaint creation error:", error);
        return NextResponse.json({ error: "Failed to create complaint" }, { status: 500 });
    } finally {
        await client.end();
    }
}
