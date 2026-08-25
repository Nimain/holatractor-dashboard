import { NextRequest, NextResponse } from "next/server";
import { GET as getStore } from "@/app/api/store/[slug]/route";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: { slug: string } }
) {
  return getStore(request, context);
}
