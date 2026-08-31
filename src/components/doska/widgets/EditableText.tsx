"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useDoskaStore } from "@/lib/doska/store";
import type { DoskaWidget } from "@/lib/doska/types";

/* ════════════════════════════════════════════════════════════════════
   TAHRIRLANADIGAN MATN — «Matn» va «Yopishqoq» vidjetlarining ichi.

   ⚠️ Nega `contentEditable` emas, `<textarea>`: contentEditable HTML
   qaytaradi — oʻqituvchi boshqa joydan matn koʻchirsa ichkariga
   begona teg va inline uslub tushadi, ekran esa buziladi. Textarea
   har doim sof satr beradi, ustiga mobil klaviatura, IME (kirill/
   lotin almashuvi) va bekor qilish (Ctrl+Z) uni bepul biladi.

   Narxi: textarea BOY matnni bilmaydi (qalin, kursiv, rang). Bu
   ataylab — sinf ekranidagi matn 5 metrdan oʻqilishi kerak, uning
   yagona muhim xossasi OʻLCHAM, va u konteynerdan (`cqw`) keladi.
   Formatlash kerak boʻlsa u `text.v2` boʻladi va eski ekranlar
   buzilmaydi (R131).
   ════════════════════════════════════════════════════════════════════ */
export function EditableText({
  widget,
  placeholder,
  className,
  style,
}: {
  widget: DoskaWidget;
  placeholder: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const editing = useDoskaStore((s) => s.editingId === widget.id);
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const ref = React.useRef<HTMLTextAreaElement>(null);

  const text = String(widget.state.text ?? "");

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!editing) {
      // Escape bosilgan yoki boshqa joy tanlangan: fokusni qoʻyib
      // yuboramiz. Aks holda maydon koʻrinmas holda fokusda qolar va
      // klaviatura yozuvi hech qayerga tushmasdi.
      if (document.activeElement === el) el.blur();
      return;
    }

    el.focus();
    // Kursor matn OXIRIGA. `focus()` oʻzi boshiga qoʻyadi, brauzer esa
    // baʼzan hammasini belgilab qoʻyadi — ikkinchi holatda oʻqituvchi
    // yozgan birinchi harf butun eslatmani oʻchirib yuborardi.
    el.setSelectionRange(el.value.length, el.value.length);
  }, [editing]);

  return (
    <textarea
      ref={ref}
      // Dispatcher shu atributni koʻrib sudrashni boshlamaydi (R135).
      data-doska-no-drag=""
      value={text}
      readOnly={!editing}
      onChange={(e) => patch(widget.id, { text: e.target.value })}
      placeholder={placeholder}
      spellCheck={false}
      // Brauzer avtomatik tarjimasi sinf ekranidagi matnni buzmasin —
      // oʻqituvchi yozgan topshiriq inglizchaga oʻgirilib ketmasin (R143).
      translate="no"
      className={cn(
        "size-full resize-none border-0 bg-transparent text-center leading-tight outline-none",
        "placeholder:opacity-35",
        // Ramkada `select-none` bor (sudralganda matn belgilanib
        // ketmasligi uchun) va u pastga meros boʻladi — maydon ichida
        // uni QAYTARIB yoqamiz, aks holda yozgan matnini belgilay
        // olmaydi.
        "select-text",
        // Tahrirda EMAS — hodisalar ramkaga oʻtadi, yaʼni vidjetni
        // matnning ustidan ham sudrab boʻladi. Aks holda matn qutini
        // toʻldirgach vidjetni koʻchirish uchun joy qolmasdi.
        !editing && "pointer-events-none",
        className,
      )}
      style={{
        // Matnni vertikal markazga qoʻyadi. Textarea flex konteyner
        // emas, shuning uchun bu faqat yangi brauzerlarda ishlaydi —
        // eskisida matn tepada qoladi, bu ham toʻgʻri koʻrinadi.
        // Shu sababli fallback yozilmagan: buzilish yoʻq, farq bor.
        alignContent: "center",
        ...style,
      }}
    />
  );
}
