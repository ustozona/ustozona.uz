"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CLASS_COLOR_BASE, makeColorTints, type ClassColor } from "@/lib/class-colors";
import { EMOJI_CDN, emojiToUnified } from "@/components/ui/apple-emoji";
import NotionCalloutView from "./NotionCalloutView";

/* Notion uslubidagi callout uchun fon-rang tanlovi — CLASS_COLOR_BASE'ning
   TOʻLIQ palitrasi (18 rang), spektr tartibida: `gray` birinchi (neytral
   standart), keyin qizildan pushtigacha aylana. Yangi rang taʼrifi kerak
   emas — yagona manba class-colors.ts. */
export const NOTION_CALLOUT_COLORS = [
  "gray",
  "red", "orange", "amber", "yellow", "lime",
  "green", "emerald", "teal", "cyan", "sky",
  "blue", "indigo", "violet", "purple", "fuchsia",
  "pink", "rose",
] as const;
export type NotionCalloutColor = (typeof NOTION_CALLOUT_COLORS)[number];

function normalizeNotionColor(value: string | null | undefined): NotionCalloutColor {
  return (NOTION_CALLOUT_COLORS as readonly string[]).includes(value ?? "")
    ? (value as NotionCalloutColor)
    : "gray";
}

/** Notion callout sarlavhasi — qalin, bitta qator (Callout'dagi calloutTitle
 *  bilan bir xil naqsh, mustaqil turi bor). */
export const NotionCalloutTitle = Node.create({
  name: "notionCalloutTitle",
  content: "inline*",
  defining: true,
  parseHTML() {
    return [{ tag: "div[data-notion-callout-title]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-notion-callout-title": "", class: "notion-callout-title" }), 0];
  },
});

/**
 * Notion uslubidagi callout — Obsidian callout'dan (callout-extension.ts)
 * farqli oʻlaroq qatʼiy pedagogik turlar YOʻQ: oʻqituvchi istalgan emoji
 * (Apple sprite) va fon rangini erkin tanlaydi. Tuzilma: notionCalloutTitle
 * (qalin sarlavha) + block+ (tana) — Callout bilan bir xil ikki qismli
 * andoza, faqat qatʼiy tur yoʻq.
 */
export const NotionCallout = Node.create({
  name: "notionCallout",
  group: "block",
  content: "notionCalloutTitle block+",
  defining: true,

  addAttributes() {
    return {
      emoji: {
        default: "💡",
        parseHTML: (el) => el.getAttribute("data-emoji") || "💡",
        renderHTML: (attrs) => ({ "data-emoji": attrs.emoji }),
      },
      color: {
        default: "gray",
        parseHTML: (el) => el.getAttribute("data-color") || "gray",
        renderHTML: (attrs) => ({ "data-color": attrs.color }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-notion-callout]" }];
  },

  /* SAQLANGAN HTML — NodeView (NotionCalloutView) DOM'iga strukturaviy MOS:
       .notion-callout[style: fon/chegara] > .notion-callout-emoji(img)
                                           + .notion-callout-content(sarlavha+tana)
     Fon/chegara `makeColorTints` dan (class-colors YAGONA MANBA) inline
     beriladi — NodeView ham aynan shu retseptni ishlatadi. Emoji Apple
     sprite CDN'idan (`AppleEmojiSprite` bilan bir xil manzil); fe0f qayta
     urinishi — muharrirdagi runtime fallback — bu yerda yoʻq. */
  renderHTML({ node, HTMLAttributes }) {
    const color = normalizeNotionColor(node.attrs.color as string);
    const emoji = (node.attrs.emoji as string) || "💡";
    const tint = makeColorTints(CLASS_COLOR_BASE[color as ClassColor]);
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-notion-callout": "",
        class: "notion-callout",
        style: `background-color: ${tint.tint.backgroundColor}; border-color: ${tint.softBorder.borderColor}`,
      }),
      [
        "span",
        { class: "notion-callout-emoji", "aria-hidden": "true", contenteditable: "false" },
        ["img", {
          class: "apple-emoji-img",
          src: `${EMOJI_CDN}${emojiToUnified(emoji)}.png`,
          alt: emoji,
          draggable: "false",
          loading: "lazy",
        }],
      ],
      ["div", { class: "notion-callout-content" }, 0],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(NotionCalloutView);
  },

  addKeyboardShortcuts() {
    /* Callout (callout-extension.ts) da topilgan ayni bug bu yerda ham bor
       edi: Backspace/Delete/Enter uchun ANIQ qoida boʻlmagani sababli
       ProseMirror standart komandalari bu tuzilma uchun notoʻgʻri
       transaksiya topib, blok oʻzining ICHIGA joylashib qolardi. Naqsh
       Callout'dagi bilan AYNAN bir xil — endi bu yerda ham sarlavha
       (notionCalloutTitle) bor, shuning uchun "birinchi/oxirgi child"
       hisob-kitobi Callout'dagi kabi 2-childCount asosida yuritiladi. */
    const findNotionCalloutDepth = ($pos: import("@tiptap/pm/model").ResolvedPos): number | null => {
      for (let d = $pos.depth; d > 0; d--) {
        if ($pos.node(d).type.name === "notionCallout") return d;
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
        const depth = findNotionCalloutDepth($from);
        if (depth === null) return false;
        const isTitle = $from.parent.type.name === "notionCalloutTitle";
        const isFirstBodyBlock = !isTitle && $from.index(depth) === 1;
        if (!isTitle && !isFirstBodyBlock) return false;
        const notionCallout = $from.node(depth);
        // Blok BOʻSH: sarlavha boʻsh + yagona tana blogi ham boʻsh — bir
        // zarbada oʻchadi (aks holda default xulq uni yarim-buzilgan,
        // ichma-ich holatda qoldirardi — bir necha marta koʻrilgan bug).
        const titleEmpty = (notionCallout.firstChild?.content.size ?? 0) === 0;
        const onlyOneBodyBlock = notionCallout.childCount === 2;
        const bodyEmpty = onlyOneBodyBlock && notionCallout.child(1).content.size === 0;
        if (titleEmpty && bodyEmpty) {
          const from = $from.before(depth);
          const to = $from.after(depth);
          return this.editor.chain().deleteRange({ from, to }).run();
        }
        // Sarlavha boshida, boʻsh boʻlmasa — "quti"ni yoyib tashlash
        // (matn/tana saqlanadi, faqat callout formatlash yoʻqoladi).
        if (isTitle) return this.editor.commands.lift("notionCallout");
        return false;
      },
      Delete: () => {
        const { state } = this.editor;
        const { selection } = state;
        if (!selection.empty) return false;
        const { $from } = selection;
        const depth = findNotionCalloutDepth($from);
        if (depth === null) return false;
        const notionCallout = $from.node(depth);
        const isAtVeryEnd = $from.parentOffset === $from.parent.content.size
          && $from.index(depth) === notionCallout.childCount - 1;
        if (!isAtVeryEnd) return false;
        const titleEmpty = (notionCallout.firstChild?.content.size ?? 0) === 0;
        const onlyOneBodyBlock = notionCallout.childCount === 2;
        const bodyEmpty = onlyOneBodyBlock && notionCallout.child(1).content.size === 0;
        if (!titleEmpty || !bodyEmpty) return false;
        const from = $from.before(depth);
        const to = $from.after(depth);
        return this.editor.chain().deleteRange({ from, to }).run();
      },
      Enter: () => {
        const { state } = this.editor;
        const { selection } = state;
        if (!selection.empty) return false;
        const { $from } = selection;
        if ($from.parent.type.name !== "paragraph" || $from.parent.content.size !== 0) return false;
        const depth = findNotionCalloutDepth($from);
        if (depth === null) return false;
        const notionCallout = $from.node(depth);
        const isLastChild = $from.index(depth) === notionCallout.childCount - 1;
        const hasMoreThanOneBodyBlock = notionCallout.childCount > 2; // title + 2+ blok
        if (!isLastChild || !hasMoreThanOneBodyBlock) return false;
        /* Boʻsh OXIRGI paragrafda Enter — blokdan CHIQISH. `lift` sxema-
           xavfsiz: yagona tana blogi boʻlsa (content model buzilib
           qoladigan holat) ProseMirror avtomatik rad etadi — yuqoridagi
           `hasMoreThanOneBodyBlock` tekshiruvi buni oldindan aniq qiladi. */
        return this.editor.commands.lift("paragraph");
      },
    };
  },
});
