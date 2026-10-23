import { NextRequest } from "next/server";
import { GET as tasksGet } from "../route";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return tasksGet(request);
}
