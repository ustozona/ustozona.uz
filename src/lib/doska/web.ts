/* ════════════════════════════════════════════════════════════════════
   VIDEO · HAVOLA · SAYT vidjetlari uchun manzil yordamchilari
   (docs/doska-referens-koriklari.md R418).

   Faqat http(s): `javascript:` yoki `data:` manzil iframe/havolaga
   tushmasin. Serverga hech narsa yuborilmaydi — hammasi brauzerda.
   ════════════════════════════════════════════════════════════════════ */

/** Oʻqituvchi yozgan manzil → toʻliq `https://…` yoki `null` (yaroqsiz). */
export function normalizeUrl(raw: string): URL | null {
  const text = raw.trim();
  if (!text) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname.includes(".")) return null;
    return url;
  } catch {
    return null;
  }
}

/** Qisqa koʻrinish: `www.` siz domen. */
export function displayHost(url: URL): string {
  return url.hostname.replace(/^www\./, "");
}

/** Boshlanish vaqti: `90`, `90s` yoki `1m30s` / `1h2m3s` → soniya. */
function parseStart(raw: string): number {
  if (/^\d+s?$/.test(raw)) return Number.parseInt(raw, 10);
  const m = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

export type VideoSource =
  | { type: "iframe"; src: string }
  | { type: "file"; src: string };

/**
 * Video manzili → oʻynatgich. Videoxostinglar (`youtube`, `vimeo`)
 * rasmiy joylash manzili orqali — kuzatuvsiz domen bilan; `.mp4/.webm`
 * fayl — oddiy `<video>`. Boshqasi — `null` (vidjet tushuntiradi).
 */
export function videoSource(raw: string): VideoSource | null {
  const url = normalizeUrl(raw);
  if (!url) return null;
  const host = displayHost(url);

  let yt: string | null = null;
  if (host === "youtu.be") yt = url.pathname.slice(1).split("/")[0] || null;
  else if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
    yt = url.searchParams.get("v") ?? url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] ?? null;
  }
  if (yt && /^[\w-]{6,20}$/.test(yt)) {
    const start = parseStart(url.searchParams.get("t") ?? url.searchParams.get("start") ?? "");
    const params = new URLSearchParams({ rel: "0", modestbranding: "1" });
    if (start > 0) params.set("start", String(start));
    return { type: "iframe", src: `https://www.youtube-nocookie.com/embed/${yt}?${params}` };
  }

  if (host.endsWith("vimeo.com")) {
    const id = url.pathname.match(/\/(\d{5,})/)?.[1];
    if (id) return { type: "iframe", src: `https://player.vimeo.com/video/${id}?dnt=1` };
  }

  if (/\.(mp4|webm|ogv|ogg|mov)$/i.test(url.pathname)) return { type: "file", src: url.href };
  return null;
}
