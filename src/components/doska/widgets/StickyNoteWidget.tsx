"use client";

import type { DoskaWidget } from "@/lib/doska/types";
import { EditableText } from "./EditableText";

/**
 * YOPISHQOQ QOGʻOZ — qoida, eslatma, uy vazifasi.
 *
 * Matn vidjetining teskarisi: bu YERDA idish bor va u ataylab
 * qogʻozga oʻxshaydi. Farq maʼnoda — matn doskaga yozilgan narsa,
 * yopishqoq esa doskaga YOPISHTIRILGAN narsa. Oʻqituvchi ikkisini
 * ajratib ishlatadi: sarlavha yoziladi, qoida yopishtiriladi.
 *
 * ⚠️ Rangi bo'r rejimida oʻzgarmaydi (globals.css dagi
 * `--doska-note-*` toʻq fon override'iga KIRMAYDI) — svetofor
 * chiroqlari bilan bir qatorda, u JISMONIY obyekt. Qogʻoz yashil
 * doskada ham qogʻoz boʻlib qolaveradi; shaffof boʻlsa metafora
 * yoʻqoladi va u oddiy matnga aylanadi.
 *
 * Matn chapga tekislangan: eslatma roʻyxat boʻlib yoziladi, markazga
 * tekislangan roʻyxat esa oʻqilmaydi.
 */
export function StickyNoteWidget({ widget }: { widget: DoskaWidget }) {
  return (
    <div
      className="size-full rounded-[var(--radius)] px-[7cqw] py-[6cqw]"
      style={{
        background: "var(--doska-note-bg)",
        color: "var(--doska-note-fg)",
        boxShadow: "0 4px 0 var(--doska-note-edge)",
      }}
    >
      <EditableText
        widget={widget}
        placeholder="Eslatma…"
        className="text-left"
        style={{ fontSize: "clamp(0.9rem, 8cqw, 2.75rem)" }}
      />
    </div>
  );
}
