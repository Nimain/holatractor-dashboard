import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const client = await pool.connect();
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let idx = 1;

      const fields: string[] = [
        "first_name",
        "last_name",
        "middle_name",
        "email",
        "mobile",
        "gender",
        "image",
        "city",
        "status",
      ];

      for (const f of fields) {
        if (body[f] !== undefined) {
          updates.push(`${f} = $${idx}`);
          values.push(body[f]);
          idx++;
        }
      }

      if (updates.length === 0) {
        return NextResponse.json({ success: true, message: "No changes requested" });
      }

      updates.push(`"updatedAt" = NOW()`);
      values.push(id);

      const query = `
        UPDATE "DealerCustomer"
        SET ${updates.join(", ")}
        WHERE id = $${idx}
        RETURNING *;
      `;

      const result = await client.query(query, values);
      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, customer: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[/api/dealer/customers/[id]] PATCH error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM "DealerCustomer" WHERE id = $1;', [id]);
      return NextResponse.json({ success: true, message: "Customer deleted successfully", id });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[/api/dealer/customers/[id]] DELETE error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to delete customer" }, { status: 500 });
  }
}
