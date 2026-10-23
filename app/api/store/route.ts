import { NextRequest, NextResponse } from "next/server";
import { GET as adminGet, POST as adminPost, DELETE as adminDelete } from "../admin/stores/route";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return adminGet(request);
}

export async function POST(request: NextRequest) {
  return adminPost(request);
}

export async function DELETE(request: NextRequest) {
  return adminDelete(request);
}
