"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Highlighter,
  Trash2,
  Quote as QuoteIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeaderBar } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { QuoteText } from "@/components/dashboard/QuoteText";
import { useQuotesStore } from "@/store/useQuotesStore";
import { quoteHtmlToPlain } from "@/lib/quote-html";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   IQTIBOSLAR BOSHQARUVI — roʻyxat + formatlanadigan qoʻshish maydoni.

   Muharrir ATAYLAB tor: bold / italic / underline / highlight. Sarlavha,
   roʻyxat, havola yoʻq — iqtibos bir-ikki qatorlik matn, hujjat emas.
   Muharrir HTML'ini saqlashdan oldin formatsiz matni ham ajratamiz
   (Quote.text) — a11y va formatlash yoʻq holatdagi fallback uchun.
   ════════════════════════════════════════════════════════════════════ */

/** Muharrirdagi format tugmasi — kichik ghost-ikonka. */
function FmtBtn({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          aria-pressed={active}
          className={cn(
            "text-muted-foreground hover:text-foreground",
            active && "bg-muted text-foreground"
          )}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function QuoteToolbar({ editor }: { editor: Editor }) {
  const t = useTranslations("Quotes");
  return (
    <div className="flex items-center gap-0.5 border-b border-border px-1.5 py-1">
      <FmtBtn
        label={t("bold")}
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-3.5" />
      </FmtBtn>
      <FmtBtn
        label={t("italic")}
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-3.5" />
      </FmtBtn>
      <FmtBtn
        label={t("underline")}
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="size-3.5" />
      </FmtBtn>
      <FmtBtn
        label={t("highlight")}
        active={editor.isActive("highlight")}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        <Highlighter className="size-3.5" />
      </FmtBtn>
    </div>
  );
}

export function QuotesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const t = useTranslations("Quotes");
  const quotes = useQuotesStore((s) => s.quotes);
  const addQuote = useQuotesStore((s) => s.addQuote);
  const removeQuote = useQuotesStore((s) => s.removeQuote);
  const [author, setAuthor] = useState("");
  // Muharrir holati React'da emas — tugmani yoqish uchun alohida kuzatiladi.
  const [hasText, setHasText] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // Iqtibosga keraksiz blok tugunlari oʻchirilgan — faqat paragraf qoladi.
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        link: false,
      }),
      Highlight,
      Placeholder.configure({ placeholder: t("addPlaceholder") }),
    ],
    editorProps: {
      attributes: {
        class: "min-h-16 px-3 py-2 text-sm leading-relaxed focus:outline-none",
      },
    },
    onUpdate: ({ editor: e }) => setHasText(!e.isEmpty),
  });

  const submit = () => {
    if (!editor || editor.isEmpty) return;
    const html = editor.getHTML();
    const plain = quoteHtmlToPlain(html);
    if (!plain) return;
    // Formatlash boʻlmasa HTML saqlanmaydi — seed bilan bir xil sodda shakl.
    const formatted = /<(b|strong|i|em|u|s|mark)\b/i.test(html) ? html : undefined;
    addQuote(plain, author, formatted);
    editor.commands.clearContent();
    setHasText(false);
    setAuthor("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-0 p-0 sm:max-w-md">
        <DialogHeaderBar
          icon={<QuoteIcon className="size-[18px]" aria-hidden />}
          title={t("title")}
          description={t("description")}
        />

        <div className="flex max-h-56 flex-col gap-1 overflow-y-auto scrollbar-thin px-3.5 pt-3 pb-1">
          {quotes.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">{t("empty")}</p>
          )}
          {quotes.map((q) => (
            <div
              key={q.id}
              className="group flex items-start gap-2 rounded-lg px-2.5 py-2 transition-colors hover:bg-muted/60"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-foreground">
                  <QuoteText quote={q} />
                </p>
                {q.author && <p className="mt-0.5 text-xs text-muted-foreground">— {q.author}</p>}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("delete")}
                className="shrink-0 text-muted-foreground/50 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                onClick={() => removeQuote(q.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-border px-6 py-4">
          <div className="rounded-md border border-input bg-transparent focus-within:ring-1 focus-within:ring-ring">
            {editor && <QuoteToolbar editor={editor} />}
            <EditorContent editor={editor} />
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder={t("authorPlaceholder")}
              className="h-9 flex-1 text-sm"
            />
            <Button size="sm" onClick={submit} disabled={!hasText}>
              {t("add")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
