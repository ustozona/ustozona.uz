"use client";

import {
  forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState,
  type ClipboardEvent as ReactClipboardEvent, type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";
import { FEEDBACK_LINK_RE } from "@/lib/feedback-link-markup";
import { isWhitelistedInternalHref, INTERNAL_LINKS, type InternalLink } from "@/lib/internal-links";
import { FEEDBACK_LINK_CHIP_CLASS, FEEDBACK_LINK_ICON_CLASS } from "./rich-feedback-text";
import { SlashLinkDropdown } from "./slash-link-menu";

/* ════════════════════════════════════════════════════════════════════
   NOTION-USLUB HAVOLA KOMPOZERI — plain `<textarea>` oʻrniga
   `contentEditable` div. Yozilayotganda `[Nom](/yoʻl)` xom matn emas,
   darhol chip (Notion'dagi mention/link kabi) boʻlib koʻrinadi.

   MUHIM CHEKLOV (ataylab): bu toʻliq rich-text editor EMAS — faqat
   ikkita tugun turi bor: matn va chip (`[Nom](/yoʻl)`). Bold/italic/
   HTML-paste/ro'yxat yoʻq — chunki bizga faqat shu kerak, va model
   qanchalik tor boʻlsa serializatsiya (DOM ↔ markdown satr) shunchalik
   ishonchli. Qoʻlda kiritilgan HTML/rich paste PLAIN MATN sifatida
   qabul qilinadi (pastega qarang).

   Tashqi `value` — hamon markdown satr (`[Nom](/yoʻl)`), boshqa hech
   narsa oʻzgarmaydi: server/DAL/excerpt/RichFeedbackText avvalgidek
   ishlaydi, bu yerda faqat YOZISH tajribasi almashtiriladi.
   ════════════════════════════════════════════════════════════════════ */

export type LinkRichInputHandle = { focus: () => void };

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  /** Ctrl/Cmd+Enter — yuborish. */
  onSubmitShortcut?: () => void;
  /** Oddiy Escape (slash popup yopiq boʻlganda). */
  onEscape?: () => void;
  /** Skrinshot/rasm Ctrl+V qilinganda (feedback rasm biriktirish). */
  onPasteFiles?: (e: ReactClipboardEvent<HTMLDivElement>) => void;
};

/* lucide-react "FileText" bilan bir xil SVG — chip DOM qoʻlda quriladi
   (React emas), shuning uchun komponent emas, xom markup. */
const CHIP_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" ' +
  'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
  `class="${FEEDBACK_LINK_ICON_CLASS} mr-0.5" aria-hidden="true">` +
  '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path>' +
  '<path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>';

function createChipEl(label: string, href: string): HTMLSpanElement {
  const span = document.createElement("span");
  span.contentEditable = "false";
  span.dataset.chipHref = href;
  span.dataset.chipLabel = label;
  span.className = cn(FEEDBACK_LINK_CHIP_CLASS, "cursor-default");
  span.innerHTML = CHIP_ICON_SVG;
  span.appendChild(document.createTextNode(label));
  return span;
}

function serialize(root: HTMLElement): string {
  let out = "";
  root.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? "";
    } else if (node instanceof HTMLElement && node.tagName === "BR") {
      out += "\n";
    } else if (node instanceof HTMLElement && node.dataset.chipHref) {
      out += `[${node.dataset.chipLabel ?? node.textContent}](${node.dataset.chipHref})`;
    }
  });
  return out;
}

function hydrate(root: HTMLElement, markdown: string) {
  root.innerHTML = "";
  const lines = markdown.split("\n");
  lines.forEach((line, li) => {
    if (li > 0) root.appendChild(document.createElement("br"));
    let last = 0;
    const re = new RegExp(FEEDBACK_LINK_RE);
    let m: RegExpExecArray | null;
    while ((m = re.exec(line))) {
      const [full, label, href] = m;
      if (m.index > last) root.appendChild(document.createTextNode(line.slice(last, m.index)));
      if (isWhitelistedInternalHref(href)) {
        root.appendChild(createChipEl(label, href));
      } else {
        root.appendChild(document.createTextNode(full));
      }
      last = m.index + full.length;
    }
    if (last < line.length || line.length === 0) {
      root.appendChild(document.createTextNode(line.slice(last)));
    }
  });
}

function insertLineBreak(sel: Selection) {
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const br = document.createElement("br");
  range.insertNode(br);
  range.setStartAfter(br);
  range.collapse(true);
  const after = document.createTextNode("");
  range.insertNode(after);
  range.setStart(after, 0);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

export const LinkRichInput = forwardRef<LinkRichInputHandle, Props>(function LinkRichInput(
  { value, onChange, placeholder, rows = 2, disabled, autoFocus, className, onSubmitShortcut, onEscape, onPasteFiles },
  ref
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lastSerializedRef = useRef<string>("");
  const [isEmpty, setIsEmpty] = useState(value.length === 0);

  const [query, setQuery] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerAnchorRef = useRef<{ node: Text; startOffset: number } | null>(null);

  const items: InternalLink[] = useMemo(() => {
    if (query === null) return [];
    const q = query.trim().toLowerCase();
    if (!q) return INTERNAL_LINKS.slice(0, 8);
    return INTERNAL_LINKS.filter(
      (l) => l.label.toLowerCase().includes(q) || l.keywords?.some((k) => k.includes(q))
    ).slice(0, 8);
  }, [query]);

  useImperativeHandle(ref, () => ({
    focus: () => rootRef.current?.focus(),
  }));

  // Faqat TASHQI oʻzgarish (masalan draft "" ga tozalanganda) DOM'ni
  // qayta quradi — oʻz emitChange'idan kelgan qiymatga tenglashsa
  // qayta qurmaymiz (aks holda kursor har harfda sakraydi).
  useEffect(() => {
    if (value === lastSerializedRef.current) return;
    const root = rootRef.current;
    if (!root) return;
    hydrate(root, value);
    lastSerializedRef.current = value;
    setIsEmpty(value.length === 0);
  }, [value]);

  useEffect(() => {
    if (autoFocus) rootRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function emitChange() {
    const root = rootRef.current;
    if (!root) return;
    const next = serialize(root);
    lastSerializedRef.current = next;
    setIsEmpty(next.length === 0);
    onChange(next);
  }

  function syncSlashTrigger() {
    const sel = window.getSelection();
    const node = sel?.anchorNode;
    if (!sel || !node || node.nodeType !== Node.TEXT_NODE || !rootRef.current?.contains(node)) {
      setQuery(null);
      triggerAnchorRef.current = null;
      return;
    }
    const text = node.textContent ?? "";
    const uptoCaret = text.slice(0, sel.anchorOffset);
    const m = uptoCaret.match(/(?:^|\s)\/([^\s/]*)$/);
    if (!m) {
      setQuery(null);
      triggerAnchorRef.current = null;
      return;
    }
    triggerAnchorRef.current = { node: node as Text, startOffset: sel.anchorOffset - m[1].length - 1 };
    setQuery(m[1]);
    setActiveIndex(0);
  }

  function handleInput() {
    emitChange();
    syncSlashTrigger();
  }

  function selectLink(item: InternalLink) {
    const anchor = triggerAnchorRef.current;
    const sel = window.getSelection();
    if (!anchor || !sel) return;
    const { node, startOffset } = anchor;
    const parent = node.parentNode;
    if (!parent) return;
    const caretOffset = sel.anchorNode === node ? sel.anchorOffset : (node.textContent ?? "").length;
    const text = node.textContent ?? "";
    const before = text.slice(0, startOffset);
    const after = text.slice(caretOffset);
    const chip = createChipEl(item.label, item.href);
    // Probel MAJBURAN qoʻshilmaydi — foydalanuvchi oʻzi bosadi (Notion ham
    // shunday). Aks holda koʻrinmas ikkinchi probel (chip+oʻzi bosgan probel)
    // qoʻshilib, matn ichida ikki probelli boʻshliq qolib ketardi.
    const afterNode = document.createTextNode(after);
    const nextSibling = node.nextSibling;
    node.textContent = before;
    parent.insertBefore(chip, nextSibling);
    parent.insertBefore(afterNode, nextSibling);

    const range = document.createRange();
    range.setStart(afterNode, 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    setQuery(null);
    triggerAnchorRef.current = null;
    rootRef.current?.focus();
    emitChange();
  }

  function handleKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (query !== null && items.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % items.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + items.length) % items.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectLink(items[activeIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setQuery(null);
        triggerAnchorRef.current = null;
        return;
      }
    }

    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSubmitShortcut?.();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        insertLineBreak(sel);
        emitChange();
      }
      return;
    }
    if (e.key === "Escape") {
      onEscape?.();
    }
  }

  function handlePaste(e: ReactClipboardEvent<HTMLDivElement>) {
    onPasteFiles?.(e);
    if (e.isDefaultPrevented()) return; // rasm sifatida qabul qilindi
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const node = document.createTextNode(text);
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    emitChange();
  }

  return (
    <div className="relative">
      <div
        ref={rootRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={() => {
          setQuery(null);
          triggerAnchorRef.current = null;
        }}
        data-placeholder={placeholder}
        style={{ minHeight: `${rows * 1.6}em` }}
        className={cn(
          "whitespace-pre-wrap break-words text-sm leading-relaxed outline-none",
          isEmpty &&
            "before:pointer-events-none before:float-left before:h-0 before:text-muted-foreground/50 before:content-[attr(data-placeholder)]",
          disabled && "cursor-not-allowed opacity-60",
          className
        )}
      />
      {query !== null && items.length > 0 && (
        <SlashLinkDropdown
          items={items}
          activeIndex={activeIndex}
          onHover={setActiveIndex}
          onSelect={selectLink}
        />
      )}
    </div>
  );
});
