import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";
import axios from "axios";

export const dynamic = "force-dynamic";

async function callFastApi(method: "GET" | "PATCH" | "DELETE", endpoint: string, data?: any) {
  const urls = [
    // "http://127.0.0.1:8000", // "http://localhost:8000" commented for future use
    "https://tractorai.sinsignal.com",
    process.env.NEXT_PUBLIC_TRACTOR_AI_URL,
  ].filter(Boolean) as string[];

  for (const baseUrl of urls) {
    try {
      const res = await axios({
        method,
        url: `${baseUrl}${endpoint}`,
        data,
        timeout: 2500,
      });
      if (res.data) return res.data;
    } catch {
      // try next
    }
  }
  return null;
}

// ── GET: Query all jobs with anomaly heuristics and moderation metrics ─────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "all";
    const categoryFilter = searchParams.get("category") || "all";
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    // 1. Try FastAPI backend first
    const fastApiData = await callFastApi(
      "GET",
      `/api/v1/admin/jobs?status=${statusFilter}&category=${categoryFilter}&search=${encodeURIComponent(search)}`
    );
    if (fastApiData && fastApiData.jobs) {
      return NextResponse.json(fastApiData);
    }

    // 2. Direct PostgreSQL query fallback
    const result = await pool.query(`
      SELECT * FROM operator_jobs 
      ORDER BY created_at DESC
    `);

    const rows = result.rows || [];
    let activeCount = 0;
    let suspiciousCount = 0;
    let deactivatedCount = 0;
    let totalHectares = 0;

    const allJobs = rows.map((r: any) => {
      const isActive = r.is_active !== false;
      const status = r.status || (isActive ? "active" : "suspended");
      const rph = Number(r.rate_per_hour) || 0;
      const rpj = Number(r.rate_per_job) || 0;
      const hectares = Number(r.hectares) || 0;
      const desc = String(r.description || "").toLowerCase();
      const heading = String(r.heading || "");

      // Suspicious heuristics
      const heuristics: string[] = [];
      if (rph > 250) heuristics.push(`Tarifa horaria anormalmente alta ($${rph}/hr)`);
      if (rph > 0 && rph < 5) heuristics.push(`Tarifa horaria inusualmente baja ($${rph}/hr)`);
      if (hectares > 500) heuristics.push(`Superficie extensa sin verificar (${hectares} Ha)`);

      const spamTerms = ["crypto", "inversión", "prestamo", "préstamo", "telegram", "whatsapp directo", "bitcoin"];
      for (const t of spamTerms) {
        if (desc.includes(t) || heading.toLowerCase().includes(t)) {
          heuristics.push(`Detectado término de spam/riesgo: '${t}'`);
        }
      }

      const isSuspicious = Boolean(r.is_suspicious || heuristics.length > 0);
      const suspicionReason = r.suspicion_reason || (heuristics.length > 0 ? heuristics.join("; ") : null);

      if (isActive && status === "active") activeCount++;
      else deactivatedCount++;

      if (isSuspicious) suspiciousCount++;
      totalHectares += hectares;

      let tags = [];
      try {
        tags = typeof r.tags === "string" ? JSON.parse(r.tags) : (r.tags || []);
      } catch {
        tags = [];
      }

      let tags_en = [];
      try {
        tags_en = typeof r.tags_en === "string" ? JSON.parse(r.tags_en) : (r.tags_en || []);
      } catch {
        tags_en = [];
      }

      const headingEn = r.operation_en ? `${r.operation_en} - ${r.machinery}` : null;

      return {
        id: String(r.id),
        store_id: String(r.store_id || ""),
        store_name: String(r.store_name || "Tractor Store"),
        heading: heading || `${r.operation} - ${r.machinery}`,
        heading_en: headingEn,
        operation: String(r.operation || ""),
        operation_en: r.operation_en || null,
        machinery: String(r.machinery || ""),
        machinery_specs: String(r.machinery_specs || ""),
        machinery_specs_en: r.machinery_specs_en || null,
        category: String(r.category || "tillage"),
        crop: String(r.crop || ""),
        crop_en: r.crop_en || null,
        hectares,
        rate_per_hour: rph,
        rate_per_job: rpj,
        rate_per_month: Number(r.rate_per_month) || 0,
        location_name: String(r.location_name || ""),
        location_name_en: r.location_name_en || null,
        latitude: r.latitude ? Number(r.latitude) : null,
        longitude: r.longitude ? Number(r.longitude) : null,
        image: String(r.image || ""),
        description: String(r.description || ""),
        description_en: r.description_en || null,
        budget_type: String(r.budget_type || "Fijo"),
        budget_type_en: r.budget_type_en || null,
        experience_level: String(r.experience_level || "Experto"),
        experience_level_en: r.experience_level_en || null,
        urgent: Boolean(r.urgent),
        rtk: Boolean(r.rtk),
        tags,
        tags_en,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        is_active: isActive,
        status,
        is_suspicious: isSuspicious,
        suspicion_reason: suspicionReason,
        deactivation_reason: r.deactivation_reason || null,
        deactivated_at: r.deactivated_at ? new Date(r.deactivated_at).toISOString() : null,
        deactivated_by: r.deactivated_by || null,
      };
    });

    let filtered = allJobs;
    if (statusFilter === "active") {
      filtered = filtered.filter((j: any) => j.is_active && j.status === "active");
    } else if (statusFilter === "suspended" || statusFilter === "deactivated") {
      filtered = filtered.filter((j: any) => !j.is_active || j.status === "suspended");
    } else if (statusFilter === "suspicious") {
      filtered = filtered.filter((j: any) => j.is_suspicious);
    }

    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter((j: any) => j.category.toLowerCase() === categoryFilter.toLowerCase());
    }

    if (search) {
      filtered = filtered.filter((j: any) =>
        j.heading.toLowerCase().includes(search) ||
        j.store_name.toLowerCase().includes(search) ||
        j.machinery.toLowerCase().includes(search) ||
        j.crop.toLowerCase().includes(search) ||
        j.location_name.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      summary: {
        total_jobs: allJobs.length,
        active_jobs: activeCount,
        suspicious_jobs: suspiciousCount,
        deactivated_jobs: deactivatedCount,
        total_hectares: Math.round(totalHectares * 10) / 10,
      },
      jobs: filtered,
    });
  } catch (error: any) {
    console.error("[API /api/jobs GET Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── PATCH: Toggle job status (Deactivate / Reactivate) ─────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { job_id, is_active, status, reason, admin_by } = body;

    if (!job_id) {
      return NextResponse.json({ error: "job_id is required" }, { status: 400 });
    }

    // Try FastAPI first
    const fastApiRes = await callFastApi(
      "PATCH",
      `/api/v1/admin/jobs/${job_id}/status`,
      {
        is_active: Boolean(is_active),
        status: status || (is_active ? "active" : "suspended"),
        deactivation_reason: reason,
      }
    );
    if (fastApiRes) {
      return NextResponse.json(fastApiRes);
    }

    if (!is_active) {
      await pool.query(
        `
        UPDATE operator_jobs 
        SET is_active = FALSE,
            status = $1,
            deactivation_reason = $2,
            deactivated_at = NOW(),
            deactivated_by = $3
        WHERE id = $4
        `,
        [status || "suspended", reason || "Deactivated by administrator", admin_by || "admin", job_id]
      );
    } else {
      await pool.query(
        `
        UPDATE operator_jobs 
        SET is_active = TRUE,
            status = 'active',
            deactivation_reason = NULL,
            deactivated_at = NULL,
            deactivated_by = NULL
        WHERE id = $1
        `,
        [job_id]
      );
    }

    return NextResponse.json({
      success: true,
      message: `Job ${is_active ? "reactivated" : "deactivated"} successfully`,
      job_id,
      is_active: Boolean(is_active),
    });
  } catch (error: any) {
    console.error("[API /api/jobs PATCH Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── DELETE: Permanent purge ───────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("id");

    if (!jobId) {
      return NextResponse.json({ error: "id param is required" }, { status: 400 });
    }

    const fastApiRes = await callFastApi("DELETE", `/api/v1/admin/jobs/${jobId}`);
    if (fastApiRes) {
      return NextResponse.json(fastApiRes);
    }

    await pool.query(`DELETE FROM operator_jobs WHERE id = $1`, [jobId]);

    return NextResponse.json({
      success: true,
      message: `Job ${jobId} permanently purged`,
    });
  } catch (error: any) {
    console.error("[API /api/jobs DELETE Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
