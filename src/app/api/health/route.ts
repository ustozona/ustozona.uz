import { count } from "drizzle-orm";
import { db } from "@/server/db/client";
import { teachers } from "@/server/db/schema";

/* GET /api/health — baza ulanishini tekshiruvchi texnik endpoint. */

export async function GET() {
  try {
    const [row] = await db.select({ teachers: count() }).from(teachers);
    return Response.json({ ok: true, db: "connected", teachers: row?.teachers ?? 0 });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        db: "error",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
