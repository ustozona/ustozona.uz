"use client";

import * as React from "react";
import {
  getLessonLabLinkStatusAction, unlinkLessonLabAction,
  type LinkState, type UnlinkImpactRow,
} from "@/server/actions/account-link";

/* LessonLab bog'lanishi — bitta joyda mantiq, ikki joyda ko'rinish.

   Bu holat/amallar ikkita yerda kerak: Sozlamalar > LessonLab
   (to'liq karta) va Profil (ixcham maydon). Ikkalasi ham BIR XIL
   holatga qarashi va BIR XIL amalni bajarishi kerak — mantiqni ikki
   joyda alohida yozish ular ajralib ketishiga olib kelardi (aynan
   shu turdagi ajralish 2026-08-08 da bir necha marta topilgan:
   norm_name, create_tg_link_code, getOrCreateLink). */

export type LessonLabLinkStatus =
  (LinkState & { required: boolean }) | null | "checking";

export function useLessonLabLink() {
  const [status, setStatus] = React.useState<LessonLabLinkStatus>("checking");
  const [busy, setBusy] = React.useState(false);
  const [impact, setImpact] = React.useState<UnlinkImpactRow[] | null>(null);

  const refresh = React.useCallback(async () => {
    setBusy(true);
    try {
      setStatus(await getLessonLabLinkStatusAction());
    } catch (err) {
      // Fail-open: xato holatda "null" — chaqiruvchi buni "bilib
      // bo'lmadi" deb ko'rsatadi, hech kimni bloklamaydi.
      //
      // ⚠️ Lekin xatoni JIM YUTMAYMIZ. 2026-08-08 da aynan shu
      // «Holatni tekshirib bo'lmadi» xabari sababni ko'rsatmagani
      // uchun nosozlik bir soat auth va bazada izlandi — aslida
      // Server Action CSRF origin mosligi edi (next.config.ts).
      // Konsolga chiqarish keyingi safar sababni darhol beradi.
      console.error("[LessonLab] bog'lanish holatini olib bo'lmadi:", err);
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const preserveRequired = (next: LinkState) => ({
    ...next,
    required: status && status !== "checking" ? status.required : true,
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
