"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useDoskaStore } from "@/lib/doska/store";
import type { DoskaWidget } from "@/lib/doska/types";
import { useFitText } from "./useFitText";

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
  widthRatio,
  minFont,
  maxFont,
}: {
  widget: DoskaWidget;
  placeholder: string;
  className?: string;
  style?: React.CSSProperties;
  /**
   * Shriftning yuqori chegarasi — maydon kengligiga nisbatan.
   * Matn sigʻmasa `useFitText` uni oʻzi pasaytiradi, shuning uchun bu
   * «eng katta» oʻlcham, «doimiy» emas.
   */
  widthRatio: number;
  minFont: number;
  maxFont: number;
}) {
  const editing = useDoskaStore((s) => s.editingId === widget.id);
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const ref = React.useRef<HTMLTextAreaElement>(null);

  const text = String(widget.state.text ?? "");

  // ⚠️ Shrift oʻlchami shu hook tomonidan IMPERATIV qoʻyiladi
  // (`style.fontSize`), shuning uchun uni quyidagi `style` propida
  // qaytadan bermang — ikkisi bir-biri bilan urishadi.
  useFitText(ref, { text, widthRatio, min: minFont, max: maxFont });

  // `useLayoutEffect` — `useEffect` EMAS: fokus DOM oʻzgarishi bilan
  // bir sinxron qadamda qoʻyilishi kerak, aks holda iOS Safari uni
  // «foydalanuvchi jestidan tashqarida» deb hisoblab klaviaturani
  // ochmaydi. (Dispatcher ham `endDrag` ичida sinxron `.focus()`
  // qiladi; bu yer qoʻshimcha, ikkalasi bir-biriga xalaqit bermaydi.)
  React.useLayoutEffect(() => {
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
        // ⚠️ `overflow-hidden` — `auto` EMAS. Ikki sabab:
        //   1. Sinf ekranida aylantirish paneli maʼnosiz — oʻquvchi
        //      doskani skroll qila olmaydi, u faqat qaraydi.
        //   2. Panel paydo boʻlganda maydon torayadi va matn boshqacha
        //      sinadi — yaʼni `useFitText` oʻzi oʻlchayotgan narsani
        //      oʻzgartirib yuboradi va natija beqaror boʻladi.
        // Matn `useFitText` tufayli baribir sigʻadi.
        "overflow-hidden",
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
        // Matnni vertikal markazga qoʻyadi.
        //
        // ⚠️ `safe` SHART. Oddiy `center` da matn qutiga sigʻmay
        // qolganda uning BOSHI yuqoriga chiqib ketadi va u yerga
        // aylantirib borib boʻlmaydi — yaʼni oʻqituvchi yozgan
        // birinchi qatorlar koʻrinmas boʻlib qoladi. `safe` toshgan
        // holatda tekislashni tepaga qaytaradi.
        //
        // Textarea flex konteyner emas, shuning uchun bu faqat yangi
        // brauzerlarda ishlaydi — eskisida matn tepada qoladi, bu ham
        // toʻgʻri koʻrinadi. Shu sababli fallback yozilmagan.
        alignContent: "safe center",
        ...style,
      }}
    />
  );
}
