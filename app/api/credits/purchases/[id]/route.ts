import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

function generateCuid(): string {
  const timestamp = Date.now().toString(36);
  const randChars =
    Math.random().toString(36).substring(2, 10) +
    Math.random().toString(36).substring(2, 10);
  return `crd_${timestamp}${randChars}`.slice(0, 25);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const body = await req.json();
    const { status } = body;

    if (!["Completed", "Rejected", "Pending"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN;");

      const purRes = await client.query('SELECT * FROM "CreditPurchase" WHERE id = $1 FOR UPDATE;', [id]);
      const purchase = purRes.rows[0];

      if (!purchase) {
        await client.query("ROLLBACK;");
        return NextResponse.json({ error: "Purchase record not found" }, { status: 404 });
      }

      await client.query(
        'UPDATE "CreditPurchase" SET status = $1::"PurchaseStatus", "updatedAt" = NOW() WHERE id = $2;',
        [status, id]
      );

      // If completing, update User Credits balance
      if (status === "Completed" && purchase.status !== "Completed") {
        const creditsToAdd = Number(purchase.credits_received || 0);
        const userId = purchase.user_id;
        const baseId = purchase.base_id || "default_base";

        const creditRes = await client.query(
          'SELECT id, balance, "total_purchased" FROM "Credits" WHERE user_id = $1 LIMIT 1;',
          [userId]
        );
        const existingCredit = creditRes.rows[0];

        if (existingCredit) {
          await client.query(
            `UPDATE "Credits" 
             SET balance = balance + $1,
                 "total_purchased" = "total_purchased" + $1,
                 "updatedAt" = NOW()
             WHERE id = $2;`,
            [creditsToAdd, existingCredit.id]
          );
        } else {
          const newCreditId = generateCuid();
          await client.query(
            `INSERT INTO "Credits" (id, user_id, balance, "total_purchased", "total_used", base_id, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $3, 0, $4, NOW(), NOW());`,
            [newCreditId, userId, creditsToAdd, baseId]
          );
        }
      }

      await client.query("COMMIT;");
      return NextResponse.json({ message: `Purchase status updated to ${status}` });
    } catch (err) {
      await client.query("ROLLBACK;");
      throw err;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error updating credit purchase:", error);
    return NextResponse.json({ error: error.message || "Failed to update purchase" }, { status: 500 });
  }
}
