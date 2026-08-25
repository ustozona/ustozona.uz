"use client";

import { useTranslations } from "next-intl";
import { type Editor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import {
  Undo2, Redo2, Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Code, Link2, ImageIcon,
  ListTodo, Quote, Minus, Table, ChevronDown, Check,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trash2, PanelTop,
  SubscriptIcon, SuperscriptIcon, ScissorsLineDashed, Ban, Highlighter, Baseline,
  MessageSquarePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { compressImageFile } from "@/lib/image-compress";
import { CALLOUT_TYPES } from "./callout-extension";
import { CLASS_COLORS, CLASS_COLOR_BASE } from "@/lib/class-colors";

export function Btn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "size-8 rounded-md flex items-center justify-center transition-colors shrink-0",
        "text-muted-foreground hover:text-foreground hover:bg-muted",
        active && "bg-muted text-foreground",
        disabled && "opacity-40 pointer-events-none"
      )}
    >
      {children}
    </button>
  );
}

export const Div = () => <Separator orientation="vertical" className="h-5" style={{ height: "1.25rem" }} />;

/* Matn rangi — sinf ranglari palitrasidan (CLASS_COLOR_BASE), yagona rang
   manbaiga mos boʻlishi uchun; qoʻlda takror OKLCH qiymatlar yoʻq. */
export const TEXT_COLORS = CLASS_COLORS.map((c) => CLASS_COLOR_BASE[c]);

/* Ajratish (highlight) fon ranglari — sinf ranglaridan hosil qilingan pastel
   tinlar (color-mix orqali oqqa aralashtirilgan), "A" harfsiz doira. */
export const HIGHLIGHT_COLORS = CLASS_COLORS.map(
  (c) => `color-mix(in oklch, ${CLASS_COLOR_BASE[c]} 35%, white)`
);

/* Tekislash — H1/H2/H3 va roʻyxat bilan bir xil "compact dropdown" uslubi:
   3 alohida tugma toolbar'ni siqib qoʻygani uchun (rasmda koʻrsatilgan
   muammo) bitta dropdown'ga jamlandi. `justify` (toʻliq tekislash) TextAlign
   kengaytmasida standart holda allaqachon yoqilgan edi — faqat tugma
   yetishmasdi. */
const ALIGN_TYPES = [
  { value: "left", label: "alignLeft", icon: AlignLeft },
  { value: "center", label: "alignCenter", icon: AlignCenter },
  { value: "right", label: "alignRight", icon: AlignRight },
  { value: "justify", label: "alignJustify", icon: AlignJustify },
] as const;

export default function EditorToolbar({ editor }: { editor: Editor | null }) {
  const t = useTranslations("LessonEditorToolbar");
  const fileRef = useRef<HTMLInputElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  // Tiptap v3 useEditor har tranzaksiyada qayta render qilmaydi — toolbar
  // active/disabled holatlari va jadval menyusi yangilanishi uchun obuna.
  const [, force] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const update = () => force((n) => n + 1);
    editor.on("transaction", update);
    return () => { editor.off("transaction", update); };
  }, [editor]);
  if (!editor) return null;

  const activeAlign = ALIGN_TYPES.find((a) => editor.isActive({ textAlign: a.value })) ?? ALIGN_TYPES[0];
  const AlignTrigger = activeAlign.icon;

  /** Callout qoʻshish — sarlavha turga mos nom bilan (haqiqiy, tahrirlanadigan
   *  matn sifatida) boshlanadi, foydalanuvchi keyin oʻzi almashtiradi. Kursor
   *  callout YOKI notionCallout ICHIDA boʻlsa, ichma-ich emas, undan keyin
   *  qoʻshiladi — ikkala tur bir-birining ichiga ham kirmasligi kerak
   *  (faqat oʻz-oʻziga nesting oldini olish yetarli emas edi: Obsidian
   *  callout Emojili blok ichiga, yoki aksincha, kirib qolishi mumkin edi).
   *  Qoʻshgandan keyin butun sarlavha matni TANLANGAN holatda qoladi — yozishni
   *  boshlasangiz darrov almashadi, aks holda ("Eslatma" kabi) turgan qolaveradi.
   *  (Sarlavha boʻsh + placeholder yondashuvi RAD ETILDI: foydalanuvchi buni
   *  haqiqiy yozilgan matn koʻrishni afzal koʻrdi.)
   *  Qalinlik CSS'da MAJBURIY EMAS — matn haqiqiy Bold (`bold`) markasi
   *  bilan qoʻyiladi, shuning uchun toolbar'dagi B tugmasi bilan yoqib/
   *  oʻchirish mumkin (ilgari `.callout-title { font-weight: 700 }` CSS
   *  ustidan majburlar edi, B tugmasi hech narsani oʻzgartirmasdi). */
  const insertCallout = (type: string) => {
    const { $to } = editor.state.selection;
    let insertPos = $to.pos;
    for (let d = $to.depth; d > 0; d--) {
      const nodeName = $to.node(d).type.name;
      if (nodeName === "callout" || nodeName === "notionCallout") {
        insertPos = $to.after(d);
        break;
      }
    }
    const label = t(`calloutTypes.${type}`);
    const content = {
      type: "callout",
      attrs: { type },
      content: [
        { type: "calloutTitle", content: [{ type: "text", text: label, marks: [{ type: "bold" }] }] },
        { type: "paragraph" },
      ],
    };
    editor.chain().focus().insertContentAt(insertPos, content).run();
    // calloutTitle matni insertPos+2 dan boshlanadi (+1 callout ichiga,
    // +1 calloutTitle ichiga); butun matnni tanlab qoʻyamiz.
    editor.chain().setTextSelection({ from: insertPos + 2, to: insertPos + 2 + label.length }).run();
  };

  /** Notion uslubidagi erkin callout — qatʼiy tur yoʻq, standart emoji+rang
   *  bilan qoʻshiladi, foydalanuvchi keyin oʻzi almashtiradi (NotionCalloutView).
   *  Sarlavha Callout'dagi kabi haqiqiy matn bilan boshlanadi (placeholder
   *  emas — foydalanuvchi buni afzal koʻrdi). Kursor allaqachon notionCallout
   *  YOKI callout ICHIDA boʻlsa, ICHMA-ICH qoʻshilmaydi — undan KEYIN
   *  qoʻshiladi (ikkala tur bir-birining ichiga ham kirmasligi kerak). */
  const insertNotionCallout = () => {
    const { $to } = editor.state.selection;
    let insertPos = $to.pos;
    for (let d = $to.depth; d > 0; d--) {
      const nodeName = $to.node(d).type.name;
      if (nodeName === "notionCallout" || nodeName === "callout") {
        insertPos = $to.after(d);
        break;
      }
    }
    const label = t("notionCalloutTitlePlaceholder");
    const content = {
      type: "notionCallout",
      attrs: { emoji: "💡", color: "gray" },
      content: [
        { type: "notionCalloutTitle", content: [{ type: "text", text: label, marks: [{ type: "bold" }] }] },
        { type: "paragraph" },
      ],
    };
    editor.chain().focus().insertContentAt(insertPos, content).run();
    // notionCalloutTitle matni insertPos+2 dan boshlanadi; butun matnni tanlab qoʻyamiz.
    editor.chain().setTextSelection({ from: insertPos + 2, to: insertPos + 2 + label.length }).run();
  };

  const openLinkPopover = () => {
    setLinkValue((editor.getAttributes("link").href as string | undefined) ?? "");
    setLinkOpen(true);
  };
  const applyLink = () => {
    const url = linkValue.trim();
    if (!url) { editor.chain().focus().extendMarkRange("link").unsetLink().run(); }
    else { editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run(); }
    setLinkOpen(false);
  };

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const src = await compressImageFile(file);
    editor.chain().focus().setImage({ src }).run();
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Tarix */}
      <div className="flex items-center gap-0.5">
        <Btn title={t("undo")} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo2 className="size-4" /></Btn>
        <Btn title={t("redo")} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo2 className="size-4" /></Btn>
      </div>
      <Div />

      {/* Struktura: sarlavha */}
      <div className="flex items-center gap-0.5">
      <Btn title={t("heading1")} active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="size-4" /></Btn>
      <Btn title={t("heading2")} active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="size-4" /></Btn>
      <Btn title={t("heading3")} active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="size-4" /></Btn>
      </div>
      <Div />

      {/* Struktura: roʻyxat */}
      <div className="flex items-center gap-0.5">
      <Btn title={t("bulletList")} active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="size-4" /></Btn>
      <Btn title={t("orderedList")} active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-4" /></Btn>
      <Btn title={t("taskList")} active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}><ListTodo className="size-4" /></Btn>
      </div>
      <Div />

      {/* Formatlash: matn belgilari */}
      <div className="flex items-center gap-0.5">
      <Btn title={t("bold")} active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="size-4" /></Btn>
      <Btn title={t("italic")} active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="size-4" /></Btn>
      <Btn title={t("underline")} active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="size-4" /></Btn>
      <Btn title={t("strikethrough")} active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="size-4" /></Btn>
      </div>
      <Div />

      {/* Formatlash: ustki/ostki indeks */}
      <div className="flex items-center gap-0.5">
      <Btn title={t("superscript")} active={editor.isActive("superscript")} onClick={() => editor.chain().focus().toggleSuperscript().run()}><SuperscriptIcon className="size-4" /></Btn>
      <Btn title={t("subscript")} active={editor.isActive("subscript")} onClick={() => editor.chain().focus().toggleSubscript().run()}><SubscriptIcon className="size-4" /></Btn>
      </div>
      <Div />

      {/* Formatlash: rang */}
      <div className="flex items-center gap-0.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" title={t("textColor")}
            className="h-8 px-1.5 rounded-md flex items-center gap-0.5 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors data-[state=open]:bg-muted data-[state=open]:text-foreground">
            <Baseline className="size-4"
              style={editor.getAttributes("textStyle").color ? { color: editor.getAttributes("textStyle").color } : undefined} />
            <ChevronDown className="size-3 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 p-3">
          <p className="text-overline text-muted-foreground mb-1.5">{t("textColor")}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button type="button" title={t("clearColor")} onClick={() => editor.chain().focus().unsetColor().run()}
              className={cn(
                "size-7 rounded-full border flex items-center justify-center shrink-0 transition-shadow",
                !editor.getAttributes("textStyle").color ? "border-foreground ring-1 ring-foreground" : "border-border hover:border-foreground/40"
              )}>
              <Ban className="size-3.5 text-muted-foreground" />
            </button>
            {TEXT_COLORS.map((c) => (
              <button key={c} type="button" title={c} onClick={() => editor.chain().focus().setColor(c).run()}
                className="size-7 rounded-full shrink-0 ring-offset-2 ring-offset-popover transition-shadow"
                style={{ backgroundColor: c, boxShadow: editor.getAttributes("textStyle").color === c ? `0 0 0 2px ${c}` : undefined }}
              />
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" title={t("highlightColor")}
            className={cn(
              "h-8 px-1.5 rounded-md flex items-center gap-0.5 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors data-[state=open]:bg-muted data-[state=open]:text-foreground",
              editor.isActive("highlight") && "text-foreground"
            )}>
            <Highlighter className="size-4" style={editor.isActive("highlight") ? { color: editor.getAttributes("highlight").color } : undefined} />
            <ChevronDown className="size-3 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 p-3">
          <p className="text-overline text-muted-foreground mb-1.5">{t("highlightColor")}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button type="button" title={t("clearColor")} onClick={() => editor.chain().focus().unsetHighlight().run()}
              className={cn(
                "size-7 rounded-full border flex items-center justify-center shrink-0 transition-shadow",
                !editor.isActive("highlight") ? "border-foreground ring-1 ring-foreground" : "border-border hover:border-foreground/40"
              )}>
              <Ban className="size-3.5 text-muted-foreground" />
            </button>
            {HIGHLIGHT_COLORS.map((c) => (
              <button key={c} type="button" title={c} onClick={() => editor.chain().focus().toggleHighlight({ color: c }).run()}
                className="size-7 rounded-full shrink-0 ring-offset-2 ring-offset-popover transition-shadow"
                style={{ backgroundColor: c, boxShadow: editor.isActive("highlight", { color: c }) ? `0 0 0 2px ${c}` : undefined }}
              />
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
      <Div />

      {/* Tekislash — compact dropdown (3 alohida tugma toolbar'ni siqib
          qoʻygani uchun bitta menyuga jamlandi, H1/H2/H3 uslubi bilan bir xil). */}
      <div className="flex items-center gap-0.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" title={t(activeAlign.label)}
            className="h-8 px-1.5 rounded-md flex items-center gap-0.5 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors data-[state=open]:bg-muted data-[state=open]:text-foreground">
            <AlignTrigger className="size-4" />
            <ChevronDown className="size-3 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          {ALIGN_TYPES.map(({ value, label, icon: Icon }) => (
            <DropdownMenuItem key={value} onSelect={() => editor.chain().focus().setTextAlign(value).run()} className="gap-2.5">
              <Icon className="size-4 text-muted-foreground" />
              <span className="flex-1">{t(label)}</span>
              {editor.isActive({ textAlign: value }) && <Check className="size-4 shrink-0" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
      <Div />

      {/* Qoʻshish: blok elementlar, jadval, havola, rasm, callout */}
      <div className="flex items-center gap-0.5">
      <Btn title={t("blockquote")} active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="size-4" /></Btn>
      <Btn title={t("codeBlock")} active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code className="size-4" /></Btn>
      <Btn title={t("horizontalRule")} onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="size-4" /></Btn>
      <Btn title={t("pageBreak")} onClick={() => editor.chain().focus().insertContent({ type: "pageBreak" }).run()}><ScissorsLineDashed className="size-4" /></Btn>
      {editor.isActive("table") ? (
        /* Jadval ichida — amallar menyusi (qator/ustun qoʻshish/oʻchirish) */
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" title={t("tableActions")} className="h-8 px-1.5 rounded-md flex items-center gap-0.5 transition-colors shrink-0 bg-muted text-foreground hover:bg-muted/70">
              <Table className="size-4" /><ChevronDown className="size-3 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem onSelect={() => editor.chain().focus().addRowBefore().run()} className="gap-2.5"><ArrowUp className="size-4 text-muted-foreground" /> {t("table.rowAbove")}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => editor.chain().focus().addRowAfter().run()} className="gap-2.5"><ArrowDown className="size-4 text-muted-foreground" /> {t("table.rowBelow")}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => editor.chain().focus().addColumnBefore().run()} className="gap-2.5"><ArrowLeft className="size-4 text-muted-foreground" /> {t("table.columnLeft")}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => editor.chain().focus().addColumnAfter().run()} className="gap-2.5"><ArrowRight className="size-4 text-muted-foreground" /> {t("table.columnRight")}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => editor.chain().focus().toggleHeaderRow().run()} className="gap-2.5"><PanelTop className="size-4 text-muted-foreground" /> {t("table.headerRow")}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => editor.chain().focus().deleteRow().run()} className="gap-2.5"><Trash2 className="size-4 text-muted-foreground" /> {t("table.deleteRow")}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => editor.chain().focus().deleteColumn().run()} className="gap-2.5"><Trash2 className="size-4 text-muted-foreground" /> {t("table.deleteColumn")}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => editor.chain().focus().deleteTable().run()} className="gap-2.5 text-destructive focus:text-destructive"><Trash2 className="size-4" /> {t("table.deleteTable")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Btn title={t("insertTable")} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table className="size-4" /></Btn>
      )}
      <Popover open={linkOpen} onOpenChange={setLinkOpen}>
        <PopoverTrigger asChild>
          <span><Btn title={t("link")} active={editor.isActive("link")} onClick={openLinkPopover}><Link2 className="size-4" /></Btn></span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-3">
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyLink(); } }}
              placeholder="https://"
              className="h-8"
            />
            <Button size="sm" onClick={applyLink}>{t("linkApply")}</Button>
          </div>
        </PopoverContent>
      </Popover>
      <Btn title={t("insertImage")} onClick={() => fileRef.current?.click()}><ImageIcon className="size-4" /></Btn>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
      {/* Callout qoʻshish menyusi (Obsidian uslubi, lucide ikonlar) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title={t("insertCallout")}
            className="size-8 rounded-md flex items-center justify-center transition-colors shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <MessageSquarePlus className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52 max-h-[320px] scrollbar-hover overflow-y-auto">
          {/* Emojili blok — eng koʻp ishlatiladigan, erkin variant. Ataylab
              BIRINCHI va chiziqcha bilan ajratilgan: quyidagilar qatʼiy
              pedagogik turlar, bu esa boshqa toifadagi blok. */}
          <DropdownMenuItem onSelect={insertNotionCallout} className="gap-2.5">
            <span className="size-4 shrink-0 flex items-center justify-center text-sm leading-none">💡</span>
            {t("insertNotionCallout")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {CALLOUT_TYPES.map(({ type, icon: Icon, color }) => (
            <DropdownMenuItem
              key={type}
              onSelect={() => insertCallout(type)}
              className="gap-2.5"
            >
              <Icon className="size-4 shrink-0" style={{ color }} />
              {t(`calloutTypes.${type}`)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </div>
  );
}
