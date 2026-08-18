import { FileText, Layers, ListChecks, Presentation, Video } from "lucide-react";
import type { ClassColor } from "./class-colors";

/* ════════════════════════════════════════════════════════════════════
   MATERIAL TURLARI — YAGONA REGISTR.

   Ikki sirt bir xil tilda gapirishi uchun: Materiallar kutubxonasi
   (roʻyxat + «Yaratish» menyusi) va topshiriq muharriridagi kontent
   tanlovi. Ilgari ikkalasi oʻz ikonkasi va oʻz nomini ishlatardi —
   oʻqituvchi bir joyda koʻrgan belgisini boshqa joyda tanimasdi.

   RANG = TUR. Xarita Wayground'dan olingan va kelgusi turlar uchun ham
   shu yerda band qilinadi, toki yangi tur qoʻshilganda rang tanlash
   bahsi qaytadan boshlanmasin. Sinf rangi bilan chalkashmaydi, chunki
   SHAKL ajratadi (dizayn tizimi, «Class swatch standard»): sinf =
   doira, tur = kvadrat plitka. Rang bazasi oʻsha OKLCH dvigatelidan
   (`class-colors.ts`) — qotirilgan Tailwind klass yoʻq, dark mode
   avtomatik.

   ⚠️ Ikkita ALOHIDA tayyorlik bayrogʻi bor, chunki «bor» degani har
   ikkala sirtda bir xil maʼnoni anglatmaydi:
   - `inLibrary` — kutubxonada obyekt sifatida yashaydimi (saqlanadimi);
   - `attachable` — topshiriqqa kontent sifatida ulanadimi.
   Dars kutubxonada BOR, lekin topshiriq ustuniga ulanmaydi — bunday
   yoʻl hali yoʻq. Bitta bayroq bilan boshqarilsa, muharrirda ishlamaydigan
   tugma paydo boʻlardi.
   ════════════════════════════════════════════════════════════════════ */

export type MaterialKind = "test" | "lesson" | "deck" | "video" | "flashcard";

export type MaterialKindMeta = {
  /** `messages/*.json` → `MaterialKinds` nomspeysidagi kalit. */
  labelKey: string;
  /** Toʻliq izoh — keng joyda (menyu qatori). */
  hintKey: string;
  /** Qisqa izoh — tor kartada (shakl tanlovi). */
  shortHintKey: string;
  icon: typeof FileText;
  color: ClassColor;
  inLibrary: boolean;
  attachable: boolean;
};

export const MATERIAL_KINDS: Record<MaterialKind, MaterialKindMeta> = {
  test: {
    labelKey: "test",
    hintKey: "testHint",
    shortHintKey: "testShort",
    icon: ListChecks,
    color: "green",
    inLibrary: true,
    attachable: true,
  },
  lesson: {
    labelKey: "lesson",
    hintKey: "lessonHint",
    shortHintKey: "lessonShort",
    icon: FileText,
    color: "blue",
    inLibrary: true,
    attachable: false,
  },
  deck: {
    labelKey: "deck",
    hintKey: "deckHint",
    shortHintKey: "deckShort",
    icon: Presentation,
    color: "orange",
    inLibrary: false,
    attachable: false,
  },
  video: {
    labelKey: "video",
    hintKey: "videoHint",
    shortHintKey: "videoShort",
    icon: Video,
    color: "rose",
    inLibrary: false,
    attachable: false,
  },
  flashcard: {
    labelKey: "flashcard",
    hintKey: "flashcardHint",
    shortHintKey: "flashcardShort",
    icon: Layers,
    color: "violet",
    inLibrary: false,
    attachable: false,
  },
};

/** Koʻrsatish tartibi — ikkala sirtda AYNAN bir xil boʻlishi uchun. */
export const MATERIAL_KIND_ORDER: MaterialKind[] = [
  "test",
  "lesson",
  "deck",
  "video",
  "flashcard",
];
