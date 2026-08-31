"use client";

import type { DoskaWidget } from "@/lib/doska/types";
import { EditableText } from "./EditableText";

/**
 * MATN — sarlavha, topshiriq, eʼlon.
 *
 * ⚠️ IDISHSIZ vidjet (docs/doska-dizayn-tizimi.md §3). Fon ham,
 * chegara ham, ofset soya ham yoʻq — faqat siyoh. Sabab: oʻqituvchi
 * doskaga yozganda qogʻoz olib kelmaydi, yozadi. Rangli kartochka
 * matnni «stiker» qilib qoʻyadi va yonidagi haqiqiy vidjetlar bilan
 * raqobatlashadi.
 *
 * Shuning uchun uning rangi ham bitta: `--doska-ink`. Toʻq fonda u
 * bo'r rangiga oʻtadi (globals.css), yaʼni yashil doskada matn
 * bo'r bilan yozilgandek koʻrinadi.
 *
 * Boʻsh vidjet koʻrinmay qolmaydi: tanlanganida chegara `SelectionOverlay`
 * dan keladi, boʻshligida esa placeholder turadi.
 */
export function TextWidget({ widget }: { widget: DoskaWidget }) {
  return (
    <div className="size-full px-[3cqw] py-[2cqw]">
      <EditableText
        widget={widget}
        placeholder="Matn yozing…"
        className="font-medium"
        style={{ color: "var(--doska-ink)" }}
        // Yuqori chegara — qisqa sarlavha butun kenglikni egallasin.
        // Uzun jumla yozilsa `useFitText` uni oʻzi pasaytiradi.
        widthRatio={0.11}
        minFont={14}
        maxFont={80}
      />
    </div>
  );
}
