/* Mobil ilova ↔ server kontrakti (`/api/mobile/v1`).

   ⛔ Neytral modul: `"use server"` ham, `server-only` ham YOʻQ. */

export type MobileTgStart =
  | {
      ok: true;
      requestId: string;
      /** Faqat qurilmada saqlanadi; serverda — xeshi. */
      secret: string;
      /** Ilova ekranida koʻrsatiladi — botda shu raqam tanlanadi. */
      code: string;
      deepLink: string;
      expiresInSeconds: number;
    }
  | { ok: false; reason: "disabled" | "failed" };

export type MobileTgPoll =
  | { status: "waiting" | "awaiting_phone" | "expired" | "rejected" | "has_account" | "banned" | "invalid" }
  | {
      status: "signed_in";
      token: string;
      expiresAt: string;
      user: { id: string; name: string; image: string | null };
    };

export type MobileMe = {
  user: { id: string; name: string; email: string | null; image: string | null };
};
