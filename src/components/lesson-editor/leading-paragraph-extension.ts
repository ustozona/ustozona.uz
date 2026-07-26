"use client";

import { Extension } from "@tiptap/core";

/**
 * Hujjatning ENG BOSHIDA (birinchi blok, offset 0) Enter bosilsa — standart
 * ProseMirror xulqi joriy blok TURINI (mas. H1) takrorlab, boʻsh nusxasini
 * ustiga qoʻyadi. Natijada H1 oldiga oddiy matn yozish uchun ikkita amal
 * kerak boʻlardi: Enter, keyin qoʻlda paragrafga aylantirish.
 *
 * Bu kengaytma shu holatni ushlab, oddiy BOʻSH PARAGRAF qoʻyadi — birinchi
 * blok turi qanday boʻlishidan qatʼi nazar (H1/H2/callout/roʻyxat va h.k.).
 */
export const LeadingParagraph = Extension.create({
  name: "leadingParagraph",

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { state } = this.editor;
        const { selection, doc } = state;
        if (!selection.empty) return false;
        const { $from } = selection;
        if ($from.pos !== 1) return false; // faqat hujjatning ENG BOSHIDA
        if (doc.firstChild?.type.name === "paragraph") return false; // paragraf allaqachon bor
        return this.editor.chain().insertContentAt(0, { type: "paragraph" }).run();
      },
    };
  },
});
