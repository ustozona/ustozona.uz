"use client";

import { Node, mergeAttributes } from "@tiptap/core";

/**
 * Sahifa chegarasi — oddiy atom-blok. Muharrirda kesik chiziq sifatida
 * koʻrinadi (globals.css: [data-page-break]); chop etishda (@media print)
 * `break-after: page` orqali yangi A4 varaqni majburlaydi. Tiptap'ning
 * pullik "Pages" kengaytmasi oʻrniga — bepul, ProseMirror node sifatida.
 */
export const PageBreak = Node.create({
  name: "pageBreak",
  group: "block",
  atom: true,
  selectable: true,

  parseHTML() {
    return [{ tag: "div[data-page-break]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-page-break": "" })];
  },
});
