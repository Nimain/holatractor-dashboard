import { NextRequest, NextResponse } from "next/server";
import { GET as getLogs, DELETE as deleteLog } from "@/app/api/admin/logs/route";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return getLogs(request);
}

export async function DELETE(request: NextRequest) {
  return deleteLog(request);
}
