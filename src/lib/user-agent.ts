/* User-Agent satrini oʻqiladigan koʻrinishga keltirish.

   Nega tashqi kutubxona emas: bizga kerak boʻlgani uch dona maydon —
   qurilma turi, brauzer, OS. Toʻliq UA kutubxonasi yuzlab botni va
   oʻnlab ekzotik qurilmani biladi, biz esa ularning birortasini ham
   koʻrsatmaymiz. Shuning uchun ~60 satrlik oʻz parseri.

   ⚠️ UA — TAXMIN, DALIL EMAS. iPad Safari oʻzini `Macintosh` deb
   koʻrsatadi, ayrim WebView'lar UA'ni butunlay almashtiradi. Shuning
   uchun natija «qurilma nomi» emas, «qurilma haqidagi eng yaxshi
   taxmin» sifatida ishlatiladi — hisob-kitob qarorlari (masalan
   tarif) bunga bogʻlanmaydi. */

export type DeviceKind = "mobile" | "tablet" | "desktop" | "unknown";

export type ParsedUserAgent = {
  device: DeviceKind;
  browser: string | null;
  os: string | null;
  /** Roʻyxatda koʻrsatish uchun tayyor satr — «iPhone · Safari». */
  label: string;
};

const DEVICE_LABEL: Record<DeviceKind, string> = {
  mobile: "Telefon",
  tablet: "Planshet",
  desktop: "Kompyuter",
  unknown: "Nomaʼlum",
};

export function deviceLabel(kind: DeviceKind): string {
  return DEVICE_LABEL[kind];
}

export function parseUserAgent(ua: string | null | undefined): ParsedUserAgent {
  if (!ua || !ua.trim()) {
    return {
      device: "unknown",
      browser: null,
      os: null,
      label: DEVICE_LABEL.unknown,
    };
  }

  const s = ua;

  /* ── OS ──────────────────────────────────────────────────────────
     Tartib muhim: `Android` tekshiruvi `Linux` dan OLDIN turadi,
     chunki Android UA'sida ikkalasi ham bor. Shu sabab Windows ham
     `Windows Phone` dan keyin kelmaydi — hozircha uni ajratmaymiz. */
  const os = /iPhone|iPod/.test(s)
    ? "iOS"
    : /iPad/.test(s)
      ? "iPadOS"
      : /Android/.test(s)
        ? "Android"
        : /Windows NT/.test(s)
          ? "Windows"
          : /Mac OS X/.test(s)
            ? "macOS"
            : /CrOS/.test(s)
              ? "ChromeOS"
              : /Linux/.test(s)
                ? "Linux"
                : null;

  /* ── Brauzer ─────────────────────────────────────────────────────
     Bu yerda ham tartib hal qiladi: Edge UA'sida `Chrome` ham,
     `Safari` ham bor; Chrome UA'sida `Safari` bor. Shuning uchun eng
     «xos» belgidan eng umumiysiga qarab tekshiriladi. */
  const browser = /Edg\//.test(s)
    ? "Edge"
    : /OPR\/|Opera/.test(s)
      ? "Opera"
      : /YaBrowser/.test(s)
        ? "Yandex"
        : /SamsungBrowser/.test(s)
          ? "Samsung Internet"
          : /Firefox\/|FxiOS/.test(s)
            ? "Firefox"
            : /CriOS/.test(s)
              ? "Chrome"
              : /Chrome\//.test(s)
                ? "Chrome"
                : /Safari\//.test(s)
                  ? "Safari"
                  : null;

  /* ── Qurilma turi ────────────────────────────────────────────────
     `Mobi` — mobil brauzerlar uchun rasmiy belgi. Android planshet
     UA'sida `Android` bor, lekin `Mobi` YOʻQ — ajratish shunga
     tayanadi. */
  const device: DeviceKind = /iPad|Tablet|PlayBook|Silk/.test(s)
    ? "tablet"
    : /Android/.test(s) && !/Mobi/.test(s)
      ? "tablet"
      : /Mobi|iPhone|iPod|Windows Phone/.test(s)
        ? "mobile"
        : os
          ? "desktop"
          : "unknown";

  const parts = [os, browser].filter(Boolean);
  return {
    device,
    browser,
    os,
    label: parts.length ? parts.join(" · ") : DEVICE_LABEL[device],
  };
}
