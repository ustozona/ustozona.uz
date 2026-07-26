import { and, eq } from "drizzle-orm";
import { getSession } from "@/server/session";
import { db } from "@/server/db/client";
import { aiChats } from "@/server/db/schema";

/**
 * Ustozona AI — chat tarixi (har foydalanuvchi+dars uchun bitta suhbat).
 * GET  ?lessonId=...  → { messages }
 * POST { lessonId, messages } → saqlaydi (boʻsh massiv = tozalash).
 * Tarix faqat oʻqituvchining oʻz hisobiga bogʻlanadi.
 */

export const runtime = "nodejs";

type Msg = { role: "user" | "assistant"; content: string };

const MAX_MESSAGES = 40;
const MAX_CONTENT = 20_000;

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return new Response("Kirish talab qilinadi", { status: 401 });
  const lessonId = new URL(req.url).searchParams.get("lessonId");
  if (!lessonId) return new Response("lessonId kerak", { status: 400 });

  const [row] = await db
    .select({ messages: aiChats.messages })
    .from(aiChats)
    .where(and(eq(aiChats.userId, session.user.id), eq(aiChats.lessonId, lessonId)));
  return Response.json({ messages: row?.messages ?? [] });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return new Response("Kirish talab qilinadi", { status: 401 });

  let body: { lessonId?: string; messages?: Msg[] };
  try {
    body = await req.json();
  } catch {
    return new Response("Notoʻgʻri soʻrov", { status: 400 });
  }
  const lessonId = body.lessonId;
  if (!lessonId || typeof lessonId !== "string") {
    return new Response("lessonId kerak", { status: 400 });
  }

  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter(
      (m): m is Msg =>
        (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string"
    )
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CONTENT) }));

  const userId = session.user.id;
  const id = `${userId}:${lessonId.slice(0, 100)}`;
  await db
    .insert(aiChats)
    .values({ id, userId, lessonId: lessonId.slice(0, 100), messages })
    .onConflictDoUpdate({
      target: aiChats.id,
      set: { messages, updatedAt: new Date() },
    });
  return Response.json({ ok: true });
}
