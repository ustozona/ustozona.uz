"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Notion uslubidagi (Accent-Color) illyustratsiya — `public/illustrations/`dan
 * bitta SVG. Fayllar oldindan `black → currentColor`ga oʻzgartirilgan, shuning
 * uchun chiziqlar joriy matn rangiga (`text-foreground`) moslashadi — light/dark
 * ikkalasida ham koʻrinadi; koʻk accent (#2563EB) oʻzgarmaydi.
 *
 * SVG inline qilinadi (dangerouslySetInnerHTML) — bu `currentColor` ishlashi
 * uchun zarur (`<img>` ichki rangni CSS bilan boshqara olmaydi). Natija modul
 * darajasida keshlanadi.
 */
const cache = new Map<string, string>();

export function Illustration({
  name,
  label,
  className,
  style,
}: {
  /** Fayl nomi (kengaytmasiz), mas. "oc-taking-note". */
  name: string;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [svg, setSvg] = useState<string | null>(() => cache.get(name) ?? null);

  useEffect(() => {
    if (cache.has(name)) {
      setSvg(cache.get(name)!);
      return;
    }
    let alive = true;
    fetch(`/illustrations/${name}.svg`)
      .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      .then((text) => {
        // Hamma fayl bir xil `.cls-N` klasslarni ishlatadi, inline SVG <style>
        // esa hujjat boʻylab global — bitta sahifada qoidalari har xil ikki fayl
        // tursa (mas. 22: fill vs 30: 0.5px stroke), keyingisi oldingisini bosib
        // ketadi. Shuning uchun klasslarni fayl nomi bilan izolyatsiya qilamiz.
        const scoped = text.replaceAll(
          "cls-",
          `cls-${name.replace(/[^a-zA-Z0-9-]/g, "")}-`
        );
        cache.set(name, scoped);
        if (alive) setSvg(scoped);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [name]);

  return (
    <span
      role={label ? "img" : "presentation"}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        // Balandlik boshqaradi (h-*), eni nisbatdan avtomatik — oilalar aspekti
        // har xil (scribbles 1:1, oc ~1.37:1, duotone 1:1), balandlik esa
        // Empty ichida vertikal ritmni belgilaydi. Standart: panel=h-32, hero=h-40.
        "inline-block text-foreground [&_svg]:h-full [&_svg]:w-auto",
        className
      )}
      style={style}
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}
