"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, useEffect } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import katex from "katex";
import "katex/dist/katex.min.css";
import { Bot, RotateCcw, SendHorizontal, Square, Plus, Copy, Check, ChartColumn, Paperclip, Loader2, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  MessageScrollerProvider, MessageScroller, MessageScrollerViewport, MessageScrollerContent, MessageScrollerItem, MessageScrollerButton,
} from "@/components/ui/message-scroller";
import { EditorSidePanelHeader } from "@/components/ui/editor-side-panel";
import { CALLOUT_KEYS_RE_SOURCE, normalizeCalloutType } from "./callout-types";

marked.setOptions({ breaks: true, gfm: true });

/* Matematik formulalar ($..$/$$..$$) markdown ishlashidan oldin KaTeX HTML'iga
   almashtiriladi va vaqtinchalik belgi bilan yashiriladi — aks holda markdown
   pastki chiziqni (_) kursiv deb talqin qilib, LaTeX ifodalarni buzadi. */
const katexHtml = (expr: string, displayMode: boolean) => {
  try {
    return katex.renderToString(expr, { throwOnError: false, displayMode, output: "html" });
  } catch {
    return expr;
  }
};

/* XSS himoyasi: AI chiqishi ishonchsiz (hujjat/dars matni orqali prompt-injection
   boʻlishi mumkin) — render va darsga qoʻshishdan oldin DOMPurify bilan tozalanadi. */
const md = (text: string) => {
  const parts: string[] = [];
  const masked = text
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, expr: string) => `@@MATH${parts.push(katexHtml(expr, true)) - 1}@@`)
    .replace(/\$([^$\n]+?)\$/g, (_, expr: string) => `@@MATH${parts.push(katexHtml(expr, false)) - 1}@@`);
  let html = marked.parse(masked) as string;
  html = html.replace(/@@MATH(\d+)@@/g, (_, i: string) => parts[Number(i)] ?? "");
  return DOMPurify.sanitize(html);
};

/* Nusxalash uchun LaTeX oddiy Unicode matnga aylantiriladi (`x^2`→`x²`), chunki
   clipboardga formatlanmagan matn tushadi. Darsga qoʻshishda esa bu ishlatilmaydi —
   u yerda Tiptap'ning Mathematics tugunlari yaratiladi (`mdEditor`). */
const SUPERSCRIPT: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "+": "⁺", "-": "⁻", n: "ⁿ", i: "ⁱ" };
const SUBSCRIPT: Record<string, string> = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉", "+": "₊", "-": "₋" };
const toScript = (s: string, map: Record<string, string>) => [...s].map((c) => map[c] ?? c).join("");

function extractBalanced(str: string, openIdx: number): [string, number] {
  let depth = 0;
  for (let i = openIdx; i < str.length; i++) {
    if (str[i] === "{") depth++;
    else if (str[i] === "}") { depth--; if (depth === 0) return [str.slice(openIdx + 1, i), i + 1]; }
  }
  return [str.slice(openIdx + 1), str.length];
}

function replaceCommand(expr: string, cmd: string, argCount: 1 | 2, fmt: (...args: string[]) => string): string {
  let out = "";
  let i = 0;
  while (i < expr.length) {
    if (expr.startsWith(cmd, i) && expr[i + cmd.length] === "{") {
      const [a, next1] = extractBalanced(expr, i + cmd.length);
      if (argCount === 1) { out += fmt(convertLatexExpr(a)); i = next1; continue; }
      if (expr[next1] === "{") {
        const [b, next2] = extractBalanced(expr, next1);
        out += fmt(convertLatexExpr(a), convertLatexExpr(b));
        i = next2;
        continue;
      }
    }
    out += expr[i]; i++;
  }
  return out;
}

const LATEX_SYMBOLS: [RegExp, string][] = [
  [/\\pm/g, "±"], [/\\mp/g, "∓"], [/\\times/g, "×"], [/\\cdot/g, "·"], [/\\div/g, "÷"],
  [/\\leq/g, "≤"], [/\\geq/g, "≥"], [/\\neq/g, "≠"], [/\\approx/g, "≈"], [/\\infty/g, "∞"],
  [/\\alpha/g, "α"], [/\\beta/g, "β"], [/\\gamma/g, "γ"], [/\\pi/g, "π"], [/\\theta/g, "θ"],
  [/\\Delta/g, "Δ"], [/\\sum/g, "∑"], [/\\int/g, "∫"],
  [/\\Longrightarrow/g, "⟹"], [/\\implies/g, "⟹"], [/\\Rightarrow/g, "⇒"],
  [/\\Leftrightarrow/g, "⇔"], [/\\iff/g, "⇔"], [/\\rightarrow/g, "→"], [/\\leftarrow/g, "←"], [/\\to/g, "→"],
  [/\\forall/g, "∀"], [/\\exists/g, "∃"], [/\\in/g, "∈"], [/\\notin/g, "∉"],
  [/\\subseteq/g, "⊆"], [/\\subset/g, "⊂"], [/\\cup/g, "∪"], [/\\cap/g, "∩"],
  [/\\emptyset/g, "∅"], [/\\neg/g, "¬"], [/\\land/g, "∧"], [/\\lor/g, "∨"],
  [/\\sin/g, "sin"], [/\\cos/g, "cos"], [/\\tan/g, "tan"], [/\\log/g, "log"], [/\\ln/g, "ln"],
  [/\\quad/g, " "], [/\\,/g, " "], [/\\left/g, ""], [/\\right/g, ""],
  [/\\ge/g, "≥"], [/\\le/g, "≤"], [/\\ne/g, "≠"],
];

function convertLatexExpr(expr: string): string {
  let out = expr;
  out = replaceCommand(out, "\\dfrac", 2, (a, b) => `(${a})/(${b})`);
  out = replaceCommand(out, "\\frac", 2, (a, b) => `(${a})/(${b})`);
  out = replaceCommand(out, "\\sqrt", 1, (a) => `√(${a})`);
  for (const [re, rep] of LATEX_SYMBOLS) out = out.replace(re, rep);
  out = out.replace(/\^\{([^{}]+)\}/g, (_, g: string) => (/^[0-9+\-ni]+$/.test(g) ? toScript(g, SUPERSCRIPT) : `^(${g})`));
  out = out.replace(/\^([0-9A-Za-z])/g, (_, g: string) => SUPERSCRIPT[g] ?? `^${g}`);
  out = out.replace(/_\{([^{}]+)\}/g, (_, g: string) => (/^[0-9,+-]+$/.test(g) ? toScript(g, SUBSCRIPT) : `_(${g})`));
  out = out.replace(/_([0-9A-Za-z])/g, (_, g: string) => SUBSCRIPT[g] ?? `_${g}`);
  out = out.replace(/[{}]/g, "");
  out = out.replace(/\\([a-zA-Z]+)/g, "$1");
  return out.replace(/\s+/g, " ").trim();
}

const latexToPlain = (text: string) => text
  .replace(/\$\$([\s\S]+?)\$\$/g, (_, expr: string) => convertLatexExpr(expr))
  .replace(/\$([^$\n]+?)\$/g, (_, expr: string) => convertLatexExpr(expr));

const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/* AI javobidagi Obsidian uslubidagi callout ("> [!tip] Sarlavha\n> matn") —
   callout-types.ts dagi YAGONA MANBAdan hosil qilinadi. Ilgari bu regex
   qoʻlda takrorlangan matn edi — yangi tur qoʻshilib bu yerda unutilsa,
   AI shu turni yozar edi-yu, u jimgina oddiy matn boʻlib qolardi (xato
   chiqmasdan). Callout tagidan keyingi "> " bilan boshlangan qatorlar
   tanaga kiradi (blok tugaguncha).

   "> [!free:EMOJI] Sarlavha" — Emojili blok (notionCallout) uchun ALOHIDA
   sintaksis: qatʼiy tur yoʻq, faqat erkin emoji. Route.ts SYSTEM promptida
   tushuntirilgan. */
const CALLOUT_TYPES_RE = new RegExp(`^(${CALLOUT_KEYS_RE_SOURCE})$`);
const FREE_CALLOUT_RE = /^>\s*\[!free:(\S+)\]\s*(.*)$/;

function extractCallouts(text: string, mask: (html: string) => string): string {
  const lines = text.split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const freeMatch = FREE_CALLOUT_RE.exec(lines[i]);
    const m = freeMatch ? null : /^>\s*\[!(\w+)\]\s*(.*)$/.exec(lines[i]);
    const type = m?.[1].toLowerCase();
    if (freeMatch || (m && type && CALLOUT_TYPES_RE.test(type))) {
      const title = (freeMatch ? freeMatch[2] : m![2]).trim();
      const bodyLines: string[] = [];
      i++;
      while (i < lines.length && /^>/.test(lines[i])) {
        bodyLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      const bodyHtml = bodyLines.join("\n").trim() ? (marked.parse(bodyLines.join("\n")) as string) : "<p></p>";
      // Sarlavha `<strong>` bilan — qalinlik endi CSS orqali majburiy emas,
      // faqat haqiqiy Bold markasi orqali (EditorToolbar.tsx'dagi
      // insertCallout/insertNotionCallout bilan bir xil andoza).
      const html = freeMatch
        ? `<div data-notion-callout data-emoji="${escapeAttr(freeMatch[1])}" data-color="gray"><div data-notion-callout-title><strong>${escapeAttr(title)}</strong></div>${bodyHtml}</div>`
        : `<div data-callout-type="${normalizeCalloutType(type)}"><div data-callout-title><strong>${escapeAttr(title)}</strong></div>${bodyHtml}</div>`;
      out.push(mask(html));
      continue;
    }
    out.push(lines[i]);
    i++;
  }
  return out.join("\n");
}

/* Darsga qoʻshish uchun: formulalar Tiptap Mathematics tugunlariga, callout'lar
   esa Tiptap Callout tugunlariga aylantiriladi — shunda muharrirda haqiqiy
   interaktiv elementlar (KaTeX, rangli ikonli karta) sifatida qoʻshiladi. */
const mdEditor = (text: string) => {
  const parts: string[] = [];
  const mask = (html: string) => `@@TOK${parts.push(html) - 1}@@`;
  let masked = text
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, expr: string) =>
      mask(`<div data-type="block-math" data-latex="${escapeAttr(expr.trim())}"></div>`))
    .replace(/\$([^$\n]+?)\$/g, (_, expr: string) =>
      mask(`<span data-type="inline-math" data-latex="${escapeAttr(expr.trim())}"></span>`));
  masked = extractCallouts(masked, mask);
  let html = marked.parse(masked) as string;
  html = html.replace(/@@TOK(\d+)@@/g, (_, i: string) => parts[Number(i)] ?? "");
  return DOMPurify.sanitize(html);
};

type Msg = { role: "user" | "assistant"; content: string };
type AttachedDoc = { uri: string; mimeType: string; name: string };

export default function AiAssistantPanel({
  lessonContext, classIds = [], lessonId, onClose, onInsert,
}: {
  lessonContext: { title?: string; classes?: string; unit?: string; content?: string; standards?: { id: string; desc: string }[]; durationMin?: number };
  /** Dars biriktirilgan sinf id'lari — anonim sinf-statistika konteksti uchun. */
  classIds?: string[];
  /** Chat tarixini serverda saqlash uchun (yoʻq boʻlsa tarix saqlanmaydi). */
  lessonId?: string;
  onClose: () => void;
  onInsert: (html: string) => void;
}) {
  const t = useTranslations("LessonAiAssistantPanel");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [useClassData, setUseClassData] = useState(false);
  const [doc, setDoc] = useState<AttachedDoc | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Chat tarixi: ochilganda serverdan yuklash (dars boʻyicha)
  const loadedRef = useRef(false);
  useEffect(() => {
    if (!lessonId || loadedRef.current) return;
    loadedRef.current = true;
    let on = true;
    fetch(`/api/ustozona-ai/chat?lessonId=${encodeURIComponent(lessonId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { messages?: Msg[] } | null) => {
        if (on && d?.messages?.length) {
          setMessages((cur) => (cur.length ? cur : d.messages!));
        }
      })
      .catch(() => {});
    return () => { on = false; };
  }, [lessonId]);

  const persist = (msgs: Msg[]) => {
    if (!lessonId) return;
    fetch("/api/ustozona-ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, messages: msgs }),
    }).catch(() => {});
  };

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    const next: Msg[] = [...messages, { role: "user", content: text }, { role: "assistant", content: "" }];
    setMessages(next);
    setInput("");
    setStreaming(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/ustozona-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.filter((m) => m.content.trim()).map((m) => ({ role: m.role, content: m.content })),
          lesson: lessonContext,
          useClassData: useClassData && classIds.length > 0,
          classIds,
          doc: doc ?? undefined,
        }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => t("aiError"));
        setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: `_${errText}_` }; return c; });
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: acc }; return c; });
      }
      if (acc.trim()) {
        persist([...next.slice(0, -1), { role: "assistant", content: acc }]);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: `_${t("connectionError")}_` }; return c; });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const uploadDoc = async (file: File) => {
    setUploadingDoc(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/ustozona-ai/doc", { method: "POST", body: fd });
      if (!res.ok) {
        toast.error(await res.text().catch(() => t("docError")));
        return;
      }
      const info = (await res.json()) as AttachedDoc;
      setDoc({ ...info, name: file.name });
      toast.success(t("toast.docAttached"));
    } catch {
      toast.error(t("docError"));
    } finally {
      setUploadingDoc(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const stop = () => abortRef.current?.abort();
  const reset = () => { stop(); setMessages([]); persist([]); };
  const copy = (i: number, text: string) => { navigator.clipboard.writeText(latexToPlain(text)); setCopiedIdx(i); toast.success(t("toast.copied")); setTimeout(() => setCopiedIdx(null), 1500); };
  const addToLesson = (text: string) => { onInsert(mdEditor(text)); toast.success(t("toast.added")); };

  return (
    <div className="h-full flex flex-col">
      <EditorSidePanelHeader
        icon={<Bot className="size-[18px]" />}
        title={t("title")}
        onClose={onClose}
        closeLabel={t("close")}
        actions={
          <Button variant="ghost" size="icon-sm" onClick={reset} aria-label={t("clearConversation")}>
            <RotateCcw className="size-4" />
          </Button>
        }
      />

      {/* Messages */}
      <MessageScrollerProvider defaultScrollPosition="end">
      <MessageScroller className="flex-1 min-h-0">
        <MessageScrollerViewport className="px-5 py-5">
          <MessageScrollerContent className="gap-5">
            {messages.length === 0 ? (
              <MessageScrollerItem className="h-full flex flex-col items-center justify-center text-center px-4">
                <span className="size-14 rounded-2xl bg-muted flex items-center justify-center mb-4"><Bot className="size-7 text-muted-foreground" /></span>
                <p className="text-base font-bold text-foreground">{t("emptyTitle")}</p>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-[280px] leading-relaxed">
                  {t("emptyDescription")}
                </p>
                <div className="mt-5 flex flex-col gap-2 w-full max-w-[300px]">
                  {[
                    t("suggestion.backwardDesign"),
                    t("suggestion.fiveE"),
                    t("suggestion.smart"),
                  ].map((s) => (
                    <button key={s} onClick={() => setInput(s)}
                      className="text-left text-xs text-muted-foreground border border-border rounded-lg px-3 py-2 hover:bg-muted hover:text-foreground transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </MessageScrollerItem>
            ) : (
              messages.map((m, i) => (
                <MessageScrollerItem
                  key={i}
                  scrollAnchor={m.role === "user" && i === messages.length - 2}
                  className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  {m.role === "assistant" && (
                    <span className="size-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5"><Bot className="size-4 text-foreground" /></span>
                  )}
                  <div className={cn("min-w-0 max-w-[85%]", m.role === "user" && "order-1")}>
                    {m.role === "user" ? (
                      <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-3.5 py-2 text-sm whitespace-pre-wrap break-words">{m.content}</div>
                    ) : (
                      <>
                        {m.content ? (
                          <div className="ai-prose text-sm text-foreground" dangerouslySetInnerHTML={{ __html: md(m.content) }} />
                        ) : (
                          <div className="flex items-center gap-1 py-2">
                            {[0, 1, 2].map((d) => <span key={d} className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />)}
                          </div>
                        )}
                        {m.content && !(streaming && i === messages.length - 1) && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <button onClick={() => addToLesson(m.content)} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-md px-2 py-1 transition-colors">
                              <Plus className="size-3.5" /> {t("addToLesson")}
                            </button>
                            <button onClick={() => copy(i, m.content)} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-md px-2 py-1 transition-colors">
                              {copiedIdx === i ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />} {t("copy")}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </MessageScrollerItem>
              ))
            )}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
      </MessageScrollerProvider>

      {/* Composer — input kontent bilan oʻsadi; tugma ichida (pastki-oʻngda) */}
      <div className="shrink-0 border-t border-border p-3">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {classIds.length > 0 && (
            <button
              onClick={() => setUseClassData((v) => !v)}
              title={t("classDataHint")}
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium border rounded-full px-2.5 py-1 transition-colors",
                useClassData
                  ? "border-ring bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <ChartColumn className="size-3.5" />
              {t("classDataToggle")}
              {useClassData && <Check className="size-3.5" />}
            </button>
          )}
          {doc ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium border border-ring bg-primary/10 text-foreground rounded-full px-2.5 py-1 max-w-[220px]">
              <FileText className="size-3.5 shrink-0" />
              <span className="truncate">{doc.name}</span>
              <button onClick={() => setDoc(null)} title={t("removeDocument")} className="shrink-0 text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            </span>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingDoc}
              title={t("docHint")}
              className="inline-flex items-center gap-1.5 text-xs font-medium border border-border rounded-full px-2.5 py-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {uploadingDoc ? <Loader2 className="size-3.5 animate-spin" /> : <Paperclip className="size-3.5" />}
              {uploadingDoc ? t("uploadingDoc") : t("attachDocument")}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDoc(f); }}
          />
        </div>
        <div className="relative rounded-2xl border border-border bg-card transition-shadow focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/40">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={t("composerPlaceholder")}
            rows={2}
            className="block w-full resize-none field-sizing-content max-h-[40vh] min-h-[3.5rem] bg-transparent px-3.5 pt-2.5 pb-12 text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
          />
          <div className="absolute right-2.5 bottom-2.5">
            {streaming ? (
              <button onClick={stop} title={t("stop")} className="size-9 rounded-xl bg-muted text-foreground flex items-center justify-center hover:bg-muted/70 transition-colors">
                <Square className="size-4 fill-current" />
              </button>
            ) : (
              <button onClick={send} disabled={!input.trim()} title={t("send")}
                className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity">
                <SendHorizontal className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
