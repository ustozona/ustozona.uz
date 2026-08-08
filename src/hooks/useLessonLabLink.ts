"use client";

import * as React from "react";
import {
  getLessonLabLinkStatusAction, unlinkLessonLabAction,
  type LinkState, type UnlinkImpactRow, type FailureReason,
} from "@/server/actions/account-link";

/* LessonLab bog'lanishi — bitta joyda mantiq, ikki joyda ko'rinish.

   Bu holat/amallar ikkita yerda kerak: Sozlamalar > LessonLab
   (to'liq karta) va Profil (ixcham maydon). Ikkalasi ham BIR XIL
   holatga qarashi va BIR XIL amalni bajarishi kerak — mantiqni ikki
   joyda alohida yozish ular ajralib ketishiga olib kelardi (aynan
   shu turdagi ajralish 2026-08-08 da bir necha marta topilgan:
   norm_name, create_tg_link_code, getOrCreateLink). */

export type LessonLabLinkStatus =
  | "checking"
  | (LinkState & { required: boolean })
  | { failed: FailureReason; detail?: string };

/** Holat muvaffaqiyatlimi — `status.linked` ga murojaat qilishdan oldin. */
export function isLinkState(
  s: LessonLabLinkStatus
): s is LinkState & { required: boolean } {
  return s !== "checking" && !("failed" in s);
}

export function useLessonLabLink() {
  const [status, setStatus] = React.useState<LessonLabLinkStatus>("checking");
  const [busy, setBusy] = React.useState(false);
  const [impact, setImpact] = React.useState<UnlinkImpactRow[] | null>(null);

  const refresh = React.useCallback(async () => {
    setBusy(true);
    try {
      setStatus(await getLessonLabLinkStatusAction());
    } catch (err) {
      // Bu yerga faqat TARMOQ darajasidagi nosozlik tushadi: amalning
      // o'z xatosi endi `{ failed }` bo'lib QAYTADI, otilmaydi
      // (`actions/account-link.ts` izohiga qarang).
      //
      // ⚠️ Xatoni jim yutmaymiz. 2026-08-08 da «Holatni tekshirib
      // bo'lmadi» xabari sababni ko'rsatmagani uchun nosozlik soatlab
      // noto'g'ri qatlamlarda izlandi.
      console.error("[LessonLab] amal umuman yetib bormadi:", err);
      setStatus({ failed: "server" });
    } finally {
      setBusy(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const preserveRequired = (next: LinkState) => ({
    ...next,
    required: isLinkState(status) ? status.required : true,
  });

  /** Uzishga urinish. Oqibat bo'lsa `impact` to'ldiriladi va `true`
      qaytadi — chaqiruvchi tasdiq dialogini ochsin. */
  const requestUnlink = React.useCallback(async (): Promise<boolean> => {
    setBusy(true);
    try {
      const result = await unlinkLessonLabAction(false);
      if ("blocked" in result) {
        setImpact(result.impact);
        return true;
      }
      setStatus(preserveRequired(result));
      return false;
    } finally {
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const confirmUnlink = React.useCallback(async () => {
    setBusy(true);
    try {
      const result = await unlinkLessonLabAction(true);
      if (!("blocked" in result)) setStatus(preserveRequired(result));
    } finally {
      setBusy(false);
      setImpact(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const cancelUnlink = React.useCallback(() => setImpact(null), []);

  return { status, busy, impact, refresh, requestUnlink, confirmUnlink, cancelUnlink };
}
