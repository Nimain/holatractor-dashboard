import { NextRequest } from "next/server";
import { POST as tasksPost } from "../route";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return tasksPost(request);
}
