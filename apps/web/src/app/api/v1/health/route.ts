import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { logger } from "@el-bannawy/lib";

const START_TIME = Date.now();

export async function GET(): Promise<NextResponse> {
  const checks: Record<string, string> = {};
  let healthy = true;

  try {
    const db = getAdminDb();
    await db.collection("healthCheck").doc("ping").get();
    checks.firestore = "ok";
  } catch (error) {
    checks.firestore = `error: ${error instanceof Error ? error.message : "unknown"}`;
    healthy = false;
    logger.error("Health check failed: firestore", error, { module: "health" });
  }

  const uptime = Math.floor((Date.now() - START_TIME) / 1000);
  const mem = process.memoryUsage();

  return NextResponse.json({
    success: healthy,
    timestamp: new Date().toISOString(),
    data: {
      status: healthy ? "healthy" : "degraded",
      uptimeSeconds: uptime,
      memory: {
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        rss: Math.round(mem.rss / 1024 / 1024),
      },
      checks,
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? "3.0.0",
    },
  }, { status: healthy ? 200 : 503 });
}
