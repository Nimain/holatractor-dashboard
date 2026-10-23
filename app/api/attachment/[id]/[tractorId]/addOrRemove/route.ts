import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; tractorId: string } }
) {
  const { id, tractorId } = params;

  try {
    const client = await pool.connect();
    try {
      const checkRes = await client.query(
        `SELECT id, "tractorId" FROM "Attachment" WHERE id = $1`,
        [id]
      );

      if (checkRes.rows.length === 0) {
        return NextResponse.json({ message: "Attachment not found" }, { status: 404 });
      }

      let currentTractors: string[] = checkRes.rows[0].tractorId || [];
      if (!Array.isArray(currentTractors)) currentTractors = [];

      let updatedTractors: string[];
      if (currentTractors.includes(tractorId)) {
        updatedTractors = currentTractors.filter((t) => t !== tractorId);
      } else {
        updatedTractors = [...currentTractors, tractorId];
      }

      const updateRes = await client.query(
        `
        UPDATE "Attachment"
        SET "tractorId" = $1, "updatedAt" = NOW()
        WHERE id = $2
        RETURNING *;
      `,
        [updatedTractors, id]
      );

      return NextResponse.json(updateRes.rows[0]);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[addOrRemove Attachment] Error:", error?.message);
    return NextResponse.json(
      { message: error?.message || "Failed to update attachment tractor link" },
      { status: 500 }
    );
  }
}
