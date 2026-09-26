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
/* ── Statik SVG glif — SAQLANGAN HTML (`renderHTML`) uchun ────────────────
   NodeView (CalloutView) lucide-react komponentini chizadi. Lekin
   `editor.getHTML()` serializatsiyasi React'siz ishlaydi — blogda (yoki
   boshqa muharrirdan tashqari joyda) callout shu qatorlardan chiziladi.
   Har element `[teg, atributlar]` — lucide `IconNode` formati.

   Manba: `lucide-react` (`renderToStaticMarkup` bilan bir marta koʻchirilgan;
   ikonlar CALLOUT_TYPES'dagi bilan bir xil). Pastdagi dev-guard kalitlar
   CALLOUT_KEYS bilan mos ekanini tekshiradi. */
export type CalloutSvgChild = [tag: string, attrs: Record<string, string>];
export const CALLOUT_ICON_NODE: Record<CalloutType, CalloutSvgChild[]> = {
  note: [["path", { d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" }], ["path", { d: "m15 5 4 4" }]],
  abstract: [["circle", { cx: "12", cy: "12", r: "10" }], ["circle", { cx: "12", cy: "12", r: "6" }], ["circle", { cx: "12", cy: "12", r: "2" }]],
  info: [["circle", { cx: "12", cy: "12", r: "10" }], ["path", { d: "M12 16v-4" }], ["path", { d: "M12 8h.01" }]],
  tip: [["path", { d: "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" }], ["path", { d: "M9 18h6" }], ["path", { d: "M10 22h4" }]],
  success: [["path", { d: "M20 6 9 17l-5-5" }]],
  question: [["circle", { cx: "12", cy: "12", r: "10" }], ["path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }], ["path", { d: "M12 17h.01" }]],
  warning: [["path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" }], ["path", { d: "M12 9v4" }], ["path", { d: "M12 17h.01" }]],
  failure: [["path", { d: "M18 6 6 18" }], ["path", { d: "m6 6 12 12" }]],
  danger: [["path", { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" }], ["path", { d: "M12 8v4" }], ["path", { d: "M12 16h.01" }]],
  bug: [["path", { d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" }], ["path", { d: "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }]],
  example: [["path", { d: "M3 5h.01" }], ["path", { d: "M3 12h.01" }], ["path", { d: "M3 19h.01" }], ["path", { d: "M8 5h13" }], ["path", { d: "M8 12h13" }], ["path", { d: "M8 19h13" }]],
};

const SVG_NS = "http://www.w3.org/2000/svg";
/** Callout ikoni — Tiptap DOMOutputSpec. ProseMirror `"NS teg"` sintaksisi
 *  bilan SVG namespace'i beriladi; bola elementlar NS'ni meros oladi. */
export function calloutIconSpec(type: CalloutType) {
  return [
    `${SVG_NS} svg`,
    {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    ...CALLOUT_ICON_NODE[type].map(([tag, attrs]) => [tag, attrs]),
  ];
}

if (process.env.NODE_ENV !== "production") {
  const a = new Set<string>(CALLOUT_KEYS);
  const b = new Set<string>(CALLOUT_TYPES.map((c) => c.type));
  const c = new Set<string>(Object.keys(CALLOUT_ICON_NODE));
  const same = (x: Set<string>, y: Set<string>) => x.size === y.size && [...x].every((k) => y.has(k));
  if (!same(a, b) || !same(a, c)) {
    console.error("[callout-extension] CALLOUT_KEYS / CALLOUT_TYPES / CALLOUT_ICON_NODE mos emas!", { a, b, c });
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

  /* SAQLANGAN HTML — NodeView (CalloutView) DOM'iga strukturaviy MOS:
       .callout[style=--cl] > .callout-icon(svg) + .callout-inner(sarlavha+tana)
     Shu bois globals.css'dagi grid qoidasi muharrirdan tashqarida (blog) ham
     ishlaydi. Ilgari bu yerda faqat `<div class="callout">0` bor edi: rang
     (`--cl`) ham, ikon ham, `.callout-inner` oʻrami ham FAQAT NodeView'da
     boʻlgani uchun blogda callout rangi koʻk fallback'ga tushib, sarlavha
     1.5rem'lik ikon ustuniga siqilib qolardi. */
  renderHTML({ node, HTMLAttributes }) {
    const type = normalizeCalloutType(node.attrs.type as string);
    return [
      "div",
      mergeAttributes(HTMLAttributes, { class: "callout", style: `--cl: ${CALLOUT_META[type].color}` }),
      ["span", { class: "callout-icon", "aria-hidden": "true", contenteditable: "false" }, calloutIconSpec(type)],
      ["div", { class: "callout-inner" }, 0],
    ];
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
