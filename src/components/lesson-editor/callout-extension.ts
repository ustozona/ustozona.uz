"use client";

import { Node, mergeAttributes, InputRule } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import {
  Pencil, Target, Info, Lightbulb, Check, CircleHelp,
  TriangleAlert, X, ShieldAlert, House, List, type LucideIcon,
} from "lucide-react";
import CalloutView from "./CalloutView";
import { CALLOUT_KEYS, DEFAULT_CALLOUT_TYPE, normalizeCalloutType, type CalloutType } from "./callout-types";

/**
 * Callout — Obsidian uslubidagi rangli blok (lucide ikon + karta). ANDOZA:
 * sarlavha ham, kontent ham foydalanuvchi tomonidan tahrirlanadi; biz faqat
 * ikon, rang va boshlangʻich yorliqni beramiz. Iqtibos — alohida (blockquote).
 * Tuzilma: callout = calloutTitle (inline matn) + block+ (tana).
 *
 * Tur kalitlari `callout-types.ts`dan keladi — YAGONA MANBA (AI regex ham
 * shu roʻyxatdan hosil boʻladi, qoʻlda ikkinchi nusxa yoʻq).
 */
export type { CalloutType };

/* `color` — toolbar menyusi ikonlari VA blokning oʻzi (--cl) uchun bir xil
   qiymat. Ilgari bu rang globals.css'da 11 qator sifatida QAYTA yozilgan
   edi — ikki joy ajralib ketishi mumkin (haqiqatda bir marta ajralib
   ketgan ham edi). Endi rang FAQAT shu yerda, NodeView uni --cl custom
   property sifatida DOM'ga inline uzatadi.

   Rang taqsimoti — signal ierarxiyasi qoidasi: eng kuchli rang (qizil) eng
   kam uchraydigan, eng jiddiy holatga beriladi. Shuning uchun:
     · `danger` (qizil)  = xavfsizlik qoidasi — kam, lekin jiddiy
     · `failure` (qizil) = tez-tez xato — pedagogik diagnostika
     · `bug` (neytral)   = uyga vazifa — HAR darsda uchraydi, shuning uchun
        ataylab bosiq rangda: aks holda eng koʻp ishlatiladigan blok eng
        tashvishli rangda boʻlib, butun ierarxiyani yemiradi (alarm fatigue). */
export const CALLOUT_TYPES: { type: CalloutType; icon: LucideIcon; color: string }[] = [
  { type: "note", icon: Pencil, color: "var(--info)" },
  { type: "tip", icon: Lightbulb, color: "oklch(0.66 0.13 185)" },
  { type: "info", icon: Info, color: "oklch(0.65 0.13 215)" },
  { type: "abstract", icon: Target, color: "oklch(0.62 0.17 230)" },
  { type: "example", icon: List, color: "oklch(0.55 0.22 295)" },
  { type: "question", icon: CircleHelp, color: "oklch(0.68 0.16 135)" },
  { type: "success", icon: Check, color: "var(--success)" },
  { type: "warning", icon: TriangleAlert, color: "var(--warning)" },
  { type: "danger", icon: ShieldAlert, color: "oklch(0.58 0.23 13)" },
  { type: "failure", icon: X, color: "var(--destructive)" },
  { type: "bug", icon: House, color: "oklch(0.55 0.04 285)" },
];

/* CALLOUT_KEYS bilan CALLOUT_TYPES bir xil toʻplomni qamrab olishini dev
   vaqtida tekshiradi — ikkalasi ajralib ketsa (mas. yangi tur faqat bittasiga
   qoʻshilsa) konsolda darrov koʻrinadi, jimgina buzilmaydi. */
if (process.env.NODE_ENV !== "production") {
  const a = new Set(CALLOUT_KEYS);
  const b = new Set(CALLOUT_TYPES.map((c) => c.type));
  if (a.size !== b.size || [...a].some((k) => !b.has(k))) {
    console.error("[callout-extension] CALLOUT_KEYS va CALLOUT_TYPES mos emas!", { a, b });
  }
}

/** Tur → ikon (NodeView uchun). Yorliq bu yerda YOʻQ — u tarjimadan keladi. */
export const CALLOUT_META: Record<CalloutType, { icon: LucideIcon; color: string }> =
  Object.fromEntries(CALLOUT_TYPES.map((c) => [c.type, { icon: c.icon, color: c.color }])) as Record<
    CalloutType,
    { icon: LucideIcon; color: string }
  >;

/** Callout sarlavhasi — bitta qator, foydalanuvchi tahrirlaydi. */
export const CalloutTitle = Node.create({
  name: "calloutTitle",
  content: "inline*",
  defining: true,
  parseHTML() {
    return [{ tag: "div[data-callout-title]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-callout-title": "", class: "callout-title" }), 0];
  },
});

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "calloutTitle block+",
  defining: true,

  addAttributes() {
    return {
      type: {
        default: DEFAULT_CALLOUT_TYPE,
        // Nomaʼlum/eskirgan tur kodi (mas. oʻchirilgan tur) kelsa jimgina
        // "note"ga tushadi — yarim buzilgan holat (notoʻgʻri ikon + eski
        // atribut) hosil boʻlmaydi.
        parseHTML: (el) => normalizeCalloutType(el.getAttribute("data-callout-type")),
        renderHTML: (attrs) => ({ "data-callout-type": attrs.type }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-callout-type]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { class: "callout" }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },

  addKeyboardShortcuts() {
    /* Callout ichida Backspace/Enter uchun ANIQ qoida yoʻq edi. ProseMirror
       standart Backspace/Enter komandalari faqat "paragraf → paragraf"
       kabi oddiy holatlar uchun moʻljallangan; bizning `calloutTitle
       block+` tuzilmasi (majburiy birinchi child + standart bo'lmagan
       parent) uchun ular NOTOʻGʻRI transaksiya topadi va natijada
       callout oʻzi-oʻziga ichma-ich boʻlib qoladi (bir marta koʻrilgan
       bug). Yechim — @tiptap/extension-blockquote'ning oʻzi ishlatgan
       naqsh: chegara holatlarni ANIQ ushlab, qolganini standart
       xatti-harakatga (`return false`) qoldirish. */
    const findCalloutDepth = ($pos: import("@tiptap/pm/model").ResolvedPos): number | null => {
      for (let d = $pos.depth; d > 0; d--) {
        if ($pos.node(d).type.name === "callout") return d;
      }
      return null;
    };

    return {
      Backspace: () => {
        const { state } = this.editor;
        const { selection } = state;
        if (!selection.empty) return false;
        const { $from } = selection;
        if ($from.parentOffset !== 0) return false; // faqat qator BOSHIDA
        const depth = findCalloutDepth($from);
        if (depth === null) return false;
        const callout = $from.node(depth);
        // Butun callout BOʻSH: sarlavha boʻsh + yagona tana blogi ham boʻsh.
        // Bunday holatda Backspace butun blokni BIR ZARBADA olib tashlaydi
        // — aks holda default xulq uni yarim-buzilgan holda qoldirar edi
        // (aynan skrinshotdagi "ichma-ich" holat shundan kelib chiqqan).
        const titleEmpty = (callout.firstChild?.content.size ?? 0) === 0;
        const onlyOneBodyBlock = callout.childCount === 2;
        const bodyEmpty = onlyOneBodyBlock && callout.child(1).content.size === 0;
        if (titleEmpty && bodyEmpty) {
          const from = $from.before(depth);
          const to = $from.after(depth);
          return this.editor.chain().deleteRange({ from, to }).run();
        }
        return false;
      },
      Delete: () => {
        // Callout boʻsh boʻlib, kursor sarlavha ICHIDA joylashgan holat —
        // Delete tugmasi ham xuddi Backspace kabi butun blokni oʻchirsin
        // (foydalanuvchi nuqtai nazaridan ikkalasi ham "buni olib tashla").
        const { state } = this.editor;
        const { selection } = state;
        if (!selection.empty) return false;
        const { $from } = selection;
        if ($from.parent.type.name !== "calloutTitle") return false;
        if ($from.parentOffset !== $from.parent.content.size) return false; // faqat sarlavha OXIRIDA
        const depth = findCalloutDepth($from);
        if (depth === null) return false;
        const callout = $from.node(depth);
        const titleEmpty = (callout.firstChild?.content.size ?? 0) === 0;
        const onlyOneBodyBlock = callout.childCount === 2;
        const bodyEmpty = onlyOneBodyBlock && callout.child(1).content.size === 0;
        if (titleEmpty && bodyEmpty) {
          const from = $from.before(depth);
          const to = $from.after(depth);
          return this.editor.chain().deleteRange({ from, to }).run();
        }
        return false;
      },
      Enter: () => {
        const { state } = this.editor;
        const { selection } = state;
        if (!selection.empty) return false;
        const { $from } = selection;
        if ($from.parent.type.name !== "paragraph" || $from.parent.content.size !== 0) return false;
        const depth = findCalloutDepth($from);
        if (depth === null) return false;
        const callout = $from.node(depth);
        const isLastChild = $from.index(depth) === callout.childCount - 1;
        const hasMoreThanOneBodyBlock = callout.childCount > 2; // title + 2+ blok
        if (!isLastChild || !hasMoreThanOneBodyBlock) return false;
        /* Boʻsh OXIRGI paragrafda Enter — Notion/Obsidian'dagidek callout'dan
           CHIQISH (paragraf tashqariga koʻtariladi). `lift` sxema-xavfsiz:
           agar bu yagona tana blogi boʻlsa (content model buzilib qoladigan
           holat), ProseMirror avtomatik rad etadi — yuqoridagi
           `hasMoreThanOneBodyBlock` tekshiruvi buni oldindan aniq qiladi. */
        return this.editor.commands.lift("paragraph");
      },
    };
  },

  addInputRules() {
    /* Obsidian sintaksisi qoʻlda ham ishlasin: "> [!tip] Sarlavha " deb yozib,
       oxiriga probel qoʻyilganda blok avtomatik yaratiladi. Ilgari bu
       sintaksis FAQAT AI javobida ishlar edi (AiAssistantPanel.tsx
       markdown parser) — oʻqituvchi qoʻlda yozsa oddiy iqtibos boʻlib
       qolardi. `wrappingInputRule`/`nodeInputRule` bu yerga mos kelmaydi:
       ular oddiy "matnni bir tugun bilan oʻrash" uchun moʻljallangan, bizda
       esa alohida `calloutTitle` child node kerak — shuning uchun xom
       `InputRule` bilan qoʻlda quriladi. */
    return [
      new InputRule({
        find: new RegExp(`^>\\s*\\[!(${CALLOUT_KEYS.join("|")})\\]\\s(.*)\\s$`),
        handler: ({ chain, range, match }) => {
          const type = normalizeCalloutType(match[1]);
          const title = (match[2] ?? "").trim();
          const content = {
            type: "callout",
            attrs: { type },
            content: [
              { type: "calloutTitle", content: title ? [{ type: "text", text: title }] : [] },
              { type: "paragraph" },
            ],
          };
          // Sarlavha yozilgan boʻlsa — kursor TANAGA (davom yozish uchun);
          // boʻsh boʻlsa — kursor SARLAVHAGA (placeholder koʻrinadi).
          // Pozitsiya arifmetikasi: +1 callout ichiga, calloutTitle
          // (2 + matn uzunligi) oʻtiladi, +1 paragraf ichiga.
          const cursorPos = title
            ? range.from + 1 + (2 + title.length) + 1
            : range.from + 2;
          chain().insertContentAt(range, content).setTextSelection(cursorPos).run();
        },
      }),
    ];
  },
});
