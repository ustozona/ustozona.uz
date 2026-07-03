"use client";

import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from "@tiptap/react";
import { CALLOUT_META } from "./callout-extension";

/**
 * Callout NodeView — chap rangli hoshiya + ikon (oʻzgarmas) va toʻliq
 * tahrirlanadigan ichki kontent (sarlavha qatori + tana). Ikon absolyut
 * joylashtiriladi; sarlavha qatori CSS orqali ikon yoniga suriladi.
 */
export default function CalloutView({ node }: NodeViewProps) {
  const type = (node.attrs.type as string) || "note";
  const meta = CALLOUT_META[type] ?? CALLOUT_META.note;
  const Icon = meta.icon;

  return (
    <NodeViewWrapper className="callout" data-callout-type={type}>
      <span className="callout-icon" contentEditable={false}>
        <Icon aria-hidden="true" />
      </span>
      <NodeViewContent className="callout-inner" />
    </NodeViewWrapper>
  );
}
