import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { lessonlab } from "./client";

/* ════════════════════════════════════════════════════════════════════
   LESSONLAB OAUTH — oʻqituvchi OʻZ maʼlumotiga ruxsat beradi

   Bu teskari yoʻnalish uchun: oʻqituvchi LessonLab botida yillar davomida
   sinf va test yigʻgan boʻlishi mumkin. Ularni qoʻlda qayta kiritish —
   yuzlab ism yozish degani, yaʼni Ustozonaga oʻtishning eng katta
   toʻsigʻi.

   NEGA IMPORT, «jonli sinxron» EMAS
   ---------------------------------
   Ikki tomonga doimiy sinxron oqadigan maʼlumot muqarrar ravishda
   nizoga olib keladi: bir joyda oʻzgargan ism ikkinchisida qaytadan
   yoziladi, oʻchirilgan oʻquvchi qayta paydo boʻladi. Foydalanuvchi
   qoidasi aniq: «hech qachon bittasini ustiga ikkinchisi yozmasin».

   Shuning uchun bu BIR MARTALIK koʻchirish: oʻquvchi/sinf Ustozonaga
   nusxalanadi va shundan keyin EGASI Ustozona boʻladi. LessonLab
   tomonidagi nusxa oʻz holicha qolaveradi, lekin ular bir-birini
   quvmaydi.

   PKCE — nima uchun
   -----------------
   `code_verifier` faqat bizda qoladi, `code_challenge` (uning sha256'si)
   esa havolada ketadi. Kod oʻgʻirlansa ham verifier'siz tokenga
   almashtirib boʻlmaydi.
   ════════════════════════════════════════════════════════════════════ */

/** Import uchun kerakli minimal ruxsat — koʻproq soʻramaymiz. */
export const IMPORT_SCOPES = "classes:read students:read tests:read";

export type PendingAuth = { state: string; verifier: string };

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

export function createPendingAuth(): PendingAuth {
  return {
    state: b64url(randomBytes(16)),
    // RFC 7636: 43-128 belgi
    verifier: b64url(randomBytes(48)),
  };
}

export function challengeOf(verifier: string): string {
  return b64url(createHash("sha256").update(verifier).digest());
}

export function authorizeUrl(pending: PendingAuth, redirectUri: string): string | null {
  const base = (process.env.LESSONLAB_API_BASE ?? "").replace(/\/+$/, "");
  const key = process.env.LESSONLAB_PARTNER_KEY ?? "";
  if (!base || !key) return null;
  const q = new URLSearchParams({
    client_id: key,
    redirect_uri: redirectUri,
    scope: IMPORT_SCOPES,
    state: pending.state,
    code_challenge: challengeOf(pending.verifier),
    code_challenge_method: "S256",
  });
  return `${base}/api/v1/oauth/authorize?${q.toString()}`;
}

export type TokenSet = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
};

/** Kodni tokenga almashtirish. Token HECH QAYERGA saqlanmaydi —
    import bir marta bajariladi va token unutiladi. Saqlansa, u
    oʻgʻirlanishi mumkin boʻlgan yana bir sir boʻlardi. */
export async function exchangeCode(
  code: string,
  verifier: string,
  redirectUri: string
): Promise<TokenSet> {
  return lessonlab<TokenSet>({
    method: "POST",
    path: "/api/v1/oauth/token",
    body: {
      grant_type: "authorization_code",
      code,
      code_verifier: verifier,
      redirect_uri: redirectUri,
    },
  });
}
