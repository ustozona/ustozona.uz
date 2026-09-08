import { getSession } from "@/server/session";
import { getAiChat, saveAiChat } from "@/server/dal/ai-usage";

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

  const messages = await getAiChat(session.user.id, lessonId);
  return Response.json({ messages });
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
  await saveAiChat(userId, lessonId.slice(0, 100), messages);
  return Response.json({ ok: true });
}
