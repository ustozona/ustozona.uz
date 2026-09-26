"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { noteNavigation, notePendingPop } from "@/lib/app-history";

/** Marshrut har oʻzgarganda tarix chuqurligini yangilaydi — [[app-history]]
    izohiga qarang. Hech nima render qilmaydi; ildiz layout'da turadi, chunki
    `/dashboard` va `/lessons` daraxtlarini birdek qamrashi kerak. */
export function AppHistoryTracker() {
  const pathname = usePathname();

  // `popstate` marshrut oʻzgarishidan OLDIN keladi — shuning uchun quyidagi
  // effekt ishlaganda navigatsiya turi allaqachon «pop» deb belgilangan
  // boʻladi. Tinglovchi bir marta, birinchi mount'da oʻrnatiladi.
  useEffect(() => {
    window.addEventListener("popstate", notePendingPop);
    return () => window.removeEventListener("popstate", notePendingPop);
  }, []);

  useEffect(() => { noteNavigation(); }, [pathname]);
  return null;
}
