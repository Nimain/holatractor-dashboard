import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const body = await req.json();
    const { name, slug, description, price, category_id, image } = body;

    const client = await pool.connect();
    try {
      const updates: string[] = [];
      const values: any[] = [id];

      if (name !== undefined) {
        values.push(name.trim());
        updates.push(`name = $${values.length}`);
      }
      if (slug !== undefined) {
        values.push(slug.trim().toLowerCase());
        updates.push(`slug = $${values.length}`);
      }
      if (description !== undefined) {
        values.push(description.trim());
        updates.push(`description = $${values.length}`);
      }
      if (price !== undefined) {
        values.push(price.toString().replace("$", "").trim());
        updates.push(`price = $${values.length}`);
      }
      if (category_id !== undefined) {
        values.push(category_id);
        updates.push(`category_id = $${values.length}`);
      }
      if (image !== undefined) {
        values.push(image);
        updates.push(`image = $${values.length}`);
      }

      if (updates.length === 0) {
        return NextResponse.json({ message: "No fields to update" });
      }

      updates.push(`"updatedAt" = NOW()`);

      const query = `UPDATE "Services" SET ${updates.join(", ")} WHERE id = $1 RETURNING *;`;
      const res = await client.query(query, values);

      if (res.rowCount === 0) {
        return NextResponse.json({ error: "Service not found" }, { status: 404 });
      }

      return NextResponse.json({ message: "Service updated successfully", service: res.rows[0] });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error updating service:", error);
    return NextResponse.json({ error: error.message || "Failed to update service" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM "Services" WHERE id = $1;', [id]);
      return NextResponse.json({ message: "Service deleted successfully" });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error deleting service:", error);
    return NextResponse.json({ error: error.message || "Failed to delete service" }, { status: 500 });
  }
}
