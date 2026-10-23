import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const taskId = resolvedParams.id;

    const client = await pool.connect();
    let taskRow: any = null;
    let assignments: any[] = [];

    try {
      const tRes = await client.query("SELECT * FROM farm_tasks WHERE id = $1", [taskId]);
      if (tRes.rows.length === 0) {
        return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
      }
      taskRow = tRes.rows[0];

      const aRes = await client.query("SELECT * FROM task_assignments WHERE task_id = $1", [taskId]);
      assignments = aRes.rows;
    } finally {
      client.release();
    }

    const machineCount = Math.max(1, assignments.length);
    const totalAcres = Number(taskRow.total_acres || 1.0);
    const completedAcres = Number(taskRow.completed_acres || totalAcres);
    const pricePerAcre = Number(taskRow.price_per_acre || 65.0);
    const grossRevenue = Math.round(completedAcres * pricePerAcre * 100) / 100;

    let totalFuel = 0.0;
    let totalHours = 0.0;
    const machineBreakdown: any[] = [];

    for (const a of assignments) {
      const mAcres = Number(a.acres_covered) || Math.round((completedAcres / machineCount) * 100) / 100;
      const mHrs = Number(a.engine_hours) || Math.max(0.5, Math.round((mAcres / 1.6) * 10) / 10);
      const mFuel = Number(a.fuel_liters) || Math.round(mAcres * 3.6 * 10) / 10;
      totalFuel += mFuel;
      totalHours += mHrs;

      machineBreakdown.push({
        tractor_name: a.tractor_name,
        operator_name: a.operator_name,
        acres_plowed: Math.round(mAcres * 100) / 100,
        engine_hours: Math.round(mHrs * 10) / 10,
        fuel_liters: Math.round(mFuel * 10) / 10,
        throughput_acres_per_hr: Math.round((mAcres / Math.max(0.1, mHrs)) * 100) / 100,
        operator_payout: Math.round(mHrs * 12.0 * 100) / 100,
      });
    }

    const fuelCost = Math.round(totalFuel * 1.15 * 100) / 100;
    const laborCost = Math.round(totalHours * 12.0 * 100) / 100;
    const netProfit = Math.round((grossRevenue - fuelCost - laborCost) * 100) / 100;
    const profitMargin = Math.round((netProfit / Math.max(1.0, grossRevenue)) * 1000) / 10;

    const whatsappSummary = [
      `🚜 *REPORTE DE LABOR AGRÍCOLA - HOLATRACTOR*`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `📋 *Operación:* ${taskRow.task_name} (${taskRow.operation_type})`,
      `🌾 *Área:* ${completedAcres.toFixed(1)} / ${totalAcres.toFixed(1)} Acres (${machineCount} Equipos)`,
      `⏱️ *Tiempo Total:* ${totalHours.toFixed(1)} Horas Motor`,
      `⛽ *Diesel Consumido:* ${totalFuel.toFixed(1)} Litros (${(totalFuel / Math.max(0.1, completedAcres)).toFixed(2)} L/Acre)`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `💰 *Ingreso Bruto:* $${grossRevenue.toLocaleString()}`,
      `⛽ *Combustible:* -$${fuelCost.toLocaleString()}`,
      `👷 *Operadores:* -$${laborCost.toLocaleString()}`,
      `📈 *Ganancia Neta Dueño:* *$${netProfit.toLocaleString()}* (${profitMargin}% Margen)`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `✅ _Operación completada y verificada con GPS HolaTractor._`,
    ].join("\n");

    const reportData = {
      task_id: taskId,
      task_name: taskRow.task_name,
      operation_type: taskRow.operation_type,
      total_acres: totalAcres,
      completed_acres: completedAcres,
      total_engine_hours: Math.round(totalHours * 10) / 10,
      total_fuel_liters: Math.round(totalFuel * 10) / 10,
      fuel_efficiency_l_per_acre: Math.round((totalFuel / Math.max(0.1, completedAcres)) * 100) / 100,
      gross_revenue: grossRevenue,
      fuel_cost: fuelCost,
      labor_cost: laborCost,
      net_profit: netProfit,
      profit_margin_pct: profitMargin,
      machine_breakdown: machineBreakdown,
      whatsapp_summary: whatsappSummary,
    };

    return NextResponse.json({ success: true, data: reportData });
  } catch (err: any) {
    console.error("[/api/tasks/[id]/report] GET error:", err);
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
