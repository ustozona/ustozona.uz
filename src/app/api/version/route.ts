import { NextResponse } from "next/server";

/* Deploy vaqtida Vercel avtomatik SHA beradi; lokalda modul yuklangan
   vaqt fallback boʻladi (server qayta ishga tushmaguncha oʻzgarmaydi). */
const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA ?? String(Date.now());

export async function GET() {
  return NextResponse.json(
    { buildId: BUILD_ID },
    { headers: { "Cache-Control": "no-store" } },
  );
}
