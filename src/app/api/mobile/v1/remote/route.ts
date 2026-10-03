import { myActiveRemoteAction } from "@/server/actions/doska-remote";
import { verifyRemoteTicket } from "@/server/remote/remote-ticket";
import { realtimeConfig } from "@/server/realtime/config";
import { mobileError, requireBearer } from "../_errors";

/* GET /api/mobile/v1/remote — `Authorization: Bearer`.

   Ustozona ilovasidagi «Doska pulti»: ustozning oxirgi ochilgan Doskasi
   pult havolasi (chipta bilan). Ilova uni brauzerda ochadi — brauzerda
   kirish shart emas, kimlik chiptada (docs/ustoz-pulti-spec.md §5).
   Ochiq Doska boʻlmasa `{ url: null, live: null }` — ilova «Doskada
   Telefon pult ni bosing» deydi.

   `live` — ilovaning OʻZ kamerasi (QR-kartalar, native skaner): Doska
   kanaliga brauzersiz ulanish uchun mavzu va realtime sozlamasi.
   Brauzerdagi pult sahifasi (`/pult/<chipta>`) aynan shuni oladi —
   ilova faqat chiptani tekshirgan oʻqituvchining Bearer sessiyasi bilan.
   Eski ilova versiyalari bu maydonni eʼtiborsiz qoldiradi. */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireBearer(request);
  if (denied) return denied;
  try {
    const ticket = await myActiveRemoteAction();
    const url = ticket ? `${new URL(request.url).origin}/pult/${ticket}` : null;
    const parsed = ticket ? verifyRemoteTicket(ticket) : null;
    const realtime = parsed ? realtimeConfig() : null;
    const live =
      parsed && realtime
        ? { topic: parsed.topic, realtime, expiresAt: new Date(parsed.exp * 1000).toISOString() }
        : null;
    return Response.json({ url, live }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return mobileError(err, "remote");
  }
}
