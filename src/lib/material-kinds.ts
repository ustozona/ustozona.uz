import { FileText, Layers, ListChecks, Presentation, Video } from "lucide-react";
import type { ClassColor } from "./class-colors";

/* ════════════════════════════════════════════════════════════════════
   MATERIAL TURLARI — YAGONA REGISTR.

   Ikki sirt bir xil tilda gapirishi uchun: Materiallar kutubxonasi
   (roʻyxat + «Yaratish» menyusi) va topshiriq muharriridagi kontent
   tanlovi. Ilgari ikkalasi oʻz ikonkasi va oʻz nomini ishlatardi —
   oʻqituvchi bir joyda koʻrgan belgisini boshqa joyda tanimasdi.

   RANG = TUR. Xarita viktorina-uslub platformalar amaliyotidan olingan va kelgusi turlar uchun ham
   shu yerda band qilinadi, toki yangi tur qoʻshilganda rang tanlash
   bahsi qaytadan boshlanmasin. Sinf rangi bilan chalkashmaydi, chunki
   SHAKL ajratadi (dizayn tizimi, «Class swatch standard»): sinf =
   doira, tur = kvadrat plitka. Rang bazasi oʻsha OKLCH dvigatelidan
   (`class-colors.ts`) — qotirilgan Tailwind klass yoʻq, dark mode
   avtomatik.

   ⚠️ UCHTA ALOHIDA bayroq bor, chunki «bor» degani har sirtda bir xil
   maʼnoni anglatmaydi:
   - `inLibrary`   — kutubxonada obyekt sifatida yashaydimi;
   - `isContainer` — SAVOL IDISHIMI (topshiriq shakli boʻla oladimi);
   - `attachable`  — hozir amalda ulanadimi (muharriri yozilganmi).

   `isContainer` eng muhimi va u toifa chegarasi. Beshta «tur» aslida
   bitta obyektning beshta idishi: Baholash = savollar idishsiz,
   Taqdimot = savollar slayd ichida, Video = savollar video ichida,
   Matn = savollar matn ostida, Kartochkalar = savollar kartochka
   shaklida. Bizda ham shunday — `activity_sets.container_kind`.

   DARS esa savol idishi EMAS: u oʻqituvchining dars hujjati, baholanmaydi.
   Bir muddat u shakl tanlash qatorida «tez orada» boʻlib turgan edi —
   bu toifa xatosi edi. Dars kutubxonada qoladi, topshiriq shakli
   roʻyxatida esa umuman koʻrinmaydi.

   ⚠️ Savol SHAKLI (4 tanlovli, rost/yolgʻon, juftlik) va YETKAZISH
   shakli (jonli, mustaqil, qogʻoz, QR) bu registrga KIRMAYDI — ular
   boshqa oʻqlar: birinchisi `activities.shape` (har savolda alohida),
   ikkinchisi `quiz_sessions.mode` (sessiya boshlanganda). Bitta test
   4 tanlovli savollardan iborat boʻlib, slayd ichida turib, qogʻozda
   oʻtkazilishi mumkin.
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
  /** Savol idishimi — topshiriq shakli boʻla oladimi. */
  isContainer: boolean;
  attachable: boolean;
};

export const MATERIAL_KINDS: Record<MaterialKind, MaterialKindMeta> = {
  test: {
    labelKey: "test",
    hintKey: "testHint",
    shortHintKey: "testShort",
    icon: ListChecks,
    color: "green",
    isContainer: true,
    inLibrary: true,
    attachable: true,
  },
  lesson: {
    labelKey: "lesson",
    hintKey: "lessonHint",
    shortHintKey: "lessonShort",
    icon: FileText,
    color: "blue",
    isContainer: false,
    inLibrary: true,
    attachable: false,
  },
  deck: {
    labelKey: "deck",
    hintKey: "deckHint",
    shortHintKey: "deckShort",
    icon: Presentation,
    color: "orange",
    isContainer: true,
    inLibrary: false,
    attachable: false,
  },
  video: {
    labelKey: "video",
    hintKey: "videoHint",
    shortHintKey: "videoShort",
    icon: Video,
    color: "rose",
    isContainer: true,
    inLibrary: false,
    attachable: false,
  },
  flashcard: {
    labelKey: "flashcard",
    hintKey: "flashcardHint",
    shortHintKey: "flashcardShort",
    icon: Layers,
    color: "violet",
    isContainer: true,
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
