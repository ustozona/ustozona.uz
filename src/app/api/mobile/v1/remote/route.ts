import { myActiveRemoteAction } from "@/server/actions/doska-remote";
import { mobileError, requireBearer } from "../_errors";

/* GET /api/mobile/v1/remote — `Authorization: Bearer`.

   Ustozona ilovasidagi «Doska pulti»: ustozning oxirgi ochilgan Doskasi
   pult havolasi (chipta bilan). Ilova uni brauzerda ochadi — brauzerda
   kirish shart emas, kimlik chiptada (docs/ustoz-pulti-spec.md §5).
   Ochiq Doska boʻlmasa `{ url: null }` — ilova «Doskada Telefon pult ni
   bosing» deydi. */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireBearer(request);
  if (denied) return denied;
  try {
    const ticket = await myActiveRemoteAction();
    const url = ticket ? `${new URL(request.url).origin}/pult/${ticket}` : null;
    return Response.json({ url }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return mobileError(err, "remote");
  }
}
