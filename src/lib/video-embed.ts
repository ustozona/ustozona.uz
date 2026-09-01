/* ════════════════════════════════════════════════════════════════════
   VIDEO EMBED — havoladan tanib olish, fasad va iframe manzillari

   Bu modul NEYTRAL: `"use server"` ham, `server-only` ham yoʻq. Uni
   muharrir (klient), Tiptap kengaytmasi va ommaviy sahifa (server) —
   uchchalasi ham import qiladi, shuning uchun ichida faqat sof funksiya
   turadi (DOM ham, tarmoq ham yoʻq).

   ─── SAQLASH SHAKLI ───
   Bazada iframe EMAS, yengil «fasad» saqlanadi:

       <div data-video-embed data-provider="youtube" data-video-id="ID"
            data-url="…"><a href="…">…</a></div>

   Nega: `/blog/[slug]` kontentni xom HTML sifatida chiqaradi. Iframe
   yozilsa har video sahifa yuklanishida YouTube'ning ~1 MB skriptini
   tortadi — uchta videoli maqola shu bilan sekinlashadi. Fasadda esa
   avval faqat rasm koʻrinadi, iframe FAQAT ▶︎ bosilgach qoʻyiladi
   (YouTube oʻzi ham shu naqshni tavsiya qiladi). JS oʻchiq boʻlsa
   ichidagi `<a>` koʻrinadi — kontent yoʻqolmaydi.
   ════════════════════════════════════════════════════════════════════ */

export type VideoProvider = "youtube" | "instagram";

export type VideoEmbedRef = {
  provider: VideoProvider;
  /** YouTube — video id (11 belgi). Instagram — post kodi (`p`/`reel` dan keyin). */
  videoId: string;
  /** Instagram uchun yoʻl turi muhim (`p` va `reel` embed manzili farq qiladi). */
  kind?: "p" | "reel" | "tv";
  /** Odam koʻradigan kanonik havola — `<a href>` va «manbada ochish» uchun. */
  url: string;
};

/* YouTube id — 11 belgi: harf, raqam, `-`, `_`. */
const YT_ID = /^[\w-]{11}$/;
/* Instagram post kodi — bazasi 64, uzunligi 10–12 (kelajakda oʻzgarishi
   mumkin, shuning uchun oraliq keng olindi). */
const IG_CODE = /^[\w-]{5,32}$/;

/**
 * Havoladan video maʼlumotini ajratadi. Tanimasa `null` — chaqiruvchi
 * shunda «bu video havolasi emas» deb qaraydi (paste oqimi shunga tayanadi:
 * oddiy havola oddiy havola boʻlib qolishi kerak).
 */
export function parseVideoUrl(raw: string): VideoEmbedRef | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let u: URL;
  try {
    /* Protokolsiz yozilgan havola ham tanilsin (`youtu.be/…`) — odam
       koʻpincha manzil qatoridan emas, ogʻzidan koʻchiradi. */
    u = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  const host = u.hostname.replace(/^www\./, "").toLowerCase();
  /* Boʻsh boʻlaklar tashlanadi — `/reel/CODE/` dagi oxirgi `/` uchun. */
  const seg = u.pathname.split("/").filter(Boolean);

  /* ── YouTube ── */
  if (host === "youtu.be") {
    const id = seg[0];
    return id && YT_ID.test(id) ? youtube(id) : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    /* `/watch?v=ID` */
    const v = u.searchParams.get("v");
    if (v && YT_ID.test(v)) return youtube(v);
    /* `/shorts/ID`, `/embed/ID`, `/live/ID`, `/v/ID` */
    if (seg.length >= 2 && ["shorts", "embed", "live", "v"].includes(seg[0])) {
      const id = seg[1];
      if (YT_ID.test(id)) return youtube(id);
    }
    return null;
  }

  /* ── Instagram ── */
  if (host === "instagram.com" || host.endsWith(".instagram.com")) {
    /* Yoʻl `/p/CODE`, `/reel(s)/CODE`, `/tv/CODE` yoki profil bilan
       birga `/username/p/CODE` shaklida boʻlishi mumkin. */
    const i = seg.findIndex((s) => s === "p" || s === "reel" || s === "reels" || s === "tv");
    if (i === -1) return null;
    const code = seg[i + 1];
    if (!code || !IG_CODE.test(code)) return null;
    const kind = seg[i] === "tv" ? "tv" : seg[i] === "p" ? "p" : "reel";
    return {
      provider: "instagram",
      videoId: code,
      kind,
      url: `https://www.instagram.com/${kind}/${code}/`,
    };
  }

  return null;
}

function youtube(id: string): VideoEmbedRef {
  return { provider: "youtube", videoId: id, url: `https://www.youtube.com/watch?v=${id}` };
}

/** ▶︎ bosilgandan keyin qoʻyiladigan iframe manzili. */
export function embedSrc(ref: Pick<VideoEmbedRef, "provider" | "videoId" | "kind">): string {
  if (ref.provider === "youtube") {
    /* `youtube-nocookie.com` — YouTube'ning oʻzi taklif qiladigan
       «kengaytirilgan maxfiylik» domeni: koʻrilmagan videoga kuzatuv
       cookie'si yozilmaydi. `autoplay=1` — foydalanuvchi ▶︎ ni ATAYLAB
       bosgan, iframe qoʻyilgach yana bosishga majbur qilish notoʻgʻri. */
    return `https://www.youtube-nocookie.com/embed/${ref.videoId}?autoplay=1&rel=0`;
  }
  /* Instagram'ning `/embed/` yoʻli — `embed.js` skriptisiz ishlaydigan
     yagona ochiq yoʻl (skriptning oʻzi ham aynan shu manzilni iframe
     qilib qoʻyadi). Yopiq/oʻchirilgan post uchun Instagram oʻzining
     «post yoʻq» sahifasini koʻrsatadi — bizda maxsus ishlov yoʻq. */
  return `https://www.instagram.com/${ref.kind ?? "p"}/${ref.videoId}/embed/`;
}

/**
 * Fasad rasmi. YouTube har video uchun ochiq thumbnail beradi; Instagram
 * esa BERMAYDI (rasmga kirish `oembed` + access token talab qiladi, u ham
 * ilova koʻrigidan oʻtgan Meta ilovasiga). Shuning uchun Instagram fasadi
 * rasmsiz — brend kartasi koʻrsatiladi (`VideoEmbedFacade`).
 */
export function thumbnailUrl(ref: Pick<VideoEmbedRef, "provider" | "videoId">): string | null {
  if (ref.provider !== "youtube") return null;
  /* `maxresdefault` 16:9 va toʻliq sifatli, LEKIN har videoda mavjud
     emas (eski/past sifatli yuklamalarda yoʻq). Yoʻq boʻlsa YouTube 404
     qaytaradi, shuning uchun komponent `onError` da `hqdefault` ga
     tushadi — u har doim bor. */
  return `https://i.ytimg.com/vi/${ref.videoId}/maxresdefault.jpg`;
}

/** `maxresdefault` topilmaganda ishlatiladigan zaxira (har doim mavjud). */
export function thumbnailFallbackUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/** Fasad qutisining nisbati — Instagram posti tik, YouTube keng. */
export function embedAspectRatio(ref: Pick<VideoEmbedRef, "provider" | "kind">): string {
  if (ref.provider === "youtube") return "16 / 9";
  return ref.kind === "reel" ? "9 / 16" : "4 / 5";
}

export const PROVIDER_LABEL: Record<VideoProvider, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
};
