"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import {
  Pencil, Target, Info, Lightbulb, Check, CircleHelp,
  TriangleAlert, X, ShieldAlert, House, List, type LucideIcon,
} from "lucide-react";
import CalloutView from "./CalloutView";

/**
 * Callout — Obsidian uslubidagi rangli blok (lucide ikon + karta). ANDOZA:
 * sarlavha ham, kontent ham foydalanuvchi tomonidan tahrirlanadi; biz faqat
 * ikon, rang va boshlangʻich yorliqni beramiz. Iqtibos — alohida (blockquote).
 * Tuzilma: callout = calloutTitle (inline matn) + block+ (tana).
 */
export type CalloutType =
  | "note" | "abstract" | "info" | "tip" | "success" | "question"
  | "warning" | "failure" | "danger" | "bug" | "example";

/* `color` — toolbar menyusi ikonlari; globals.css `--cl` bilan bir xil.
   Nomlar oʻqituvchi/dars kontekstiga moslangan (pedagogik). */
export const CALLOUT_TYPES: { type: CalloutType; label: string; icon: LucideIcon; color: string }[] = [
  { type: "note", label: "Eslatma", icon: Pencil, color: "var(--info)" },
  { type: "tip", label: "Maslahat", icon: Lightbulb, color: "oklch(0.66 0.13 185)" },
  { type: "info", label: "Esda tuting", icon: Info, color: "oklch(0.65 0.13 215)" },
  { type: "abstract", label: "Maqsad", icon: Target, color: "oklch(0.62 0.17 230)" },
  { type: "example", label: "Misol", icon: List, color: "oklch(0.55 0.22 295)" },
  { type: "question", label: "Savol", icon: CircleHelp, color: "oklch(0.68 0.16 135)" },
  { type: "success", label: "Bajarildi", icon: Check, color: "var(--success)" },
  { type: "warning", label: "Diqqat", icon: TriangleAlert, color: "var(--warning)" },
  { type: "danger", label: "Muhim", icon: ShieldAlert, color: "oklch(0.58 0.23 13)" },
  { type: "failure", label: "Tez-tez xato", icon: X, color: "var(--destructive)" },
  { type: "bug", label: "Uyga vazifa", icon: House, color: "oklch(0.6 0.24 0)" },
];

export const CALLOUT_META: Record<string, { label: string; icon: LucideIcon }> =
  Object.fromEntries(CALLOUT_TYPES.map((c) => [c.type, { label: c.label, icon: c.icon }]));

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
        default: "note",
        parseHTML: (el) => el.getAttribute("data-callout-type") || "note",
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
});
