"use client";

import { useEffect } from "react";

/* Ommaviy koʻrishlar hisoblagichi. Bir sessiyada bitta post uchun bir
   marta yuboriladi (refresh qayta sanamaydi) — `sessionStorage` guard.
   `/api/blog/[id]/view` `revalidate` chaqirmaydi, shuning uchun bu
   ommaviy sahifa keshini buzmaydi. */
export function ViewBeacon({ postId }: { postId: string }) {
  useEffect(() => {
    const key = `blog-viewed-${postId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* private rejim — baribir bir marta yuboramiz */
    }
    const url = `/api/blog/${postId}/view`;
    try {
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon(url);
      } else {
        void fetch(url, { method: "POST", keepalive: true });
      }
    } catch {
      /* jimgina */
    }
  }, [postId]);

  return null;
}
