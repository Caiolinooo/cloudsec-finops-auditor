import { GET as healthGet } from "../../health/route";

export const runtime = "nodejs";

export function GET() {
  return healthGet();
}
