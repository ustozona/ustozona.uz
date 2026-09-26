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
 * ⚠️ Hamma uslubda QOGʻOZ va toʻq fonda ham oʻzgarmaydi
 * (src/styles/doska.css, `--doska-note-*`) — svetofor chiroqlari
 * bilan bir qatorda, u JISMONIY obyekt. Qogʻoz yashil
 * doskada ham qogʻoz boʻlib qolaveradi; shaffof boʻlsa metafora
 * yoʻqoladi va u oddiy matnga aylanadi.
 *
 * Matn chapga tekislangan: eslatma roʻyxat boʻlib yoziladi, markazga
 * tekislangan roʻyxat esa oʻqilmaydi.
 */
export function StickyNoteWidget({ widget }: { widget: DoskaWidget }) {
  return (
    <div
      className="doska-card size-full px-[7cqw] py-[6cqw]"
      data-card="note"
    >
      <EditableText
        widget={widget}
        placeholder="Eslatma…"
        className="text-left"
        // Matndan pastroq chegara: eslatma bir necha qatordan iborat
        // boʻladi, sarlavha kabi bitta yirik satr emas.
        widthRatio={0.08}
        minFont={12}
        maxFont={44}
      />
    </div>
  );
}
