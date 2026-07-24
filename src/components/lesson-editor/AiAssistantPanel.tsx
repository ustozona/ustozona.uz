"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, useEffect } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { Bot, X, RotateCcw, SendHorizontal, Square, Plus, Copy, Check, ChartColumn, Paperclip, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

marked.setOptions({ breaks: true, gfm: true });
/* XSS himoyasi: AI chiqishi ishonchsiz (hujjat/dars matni orqali prompt-injection
   boʻlishi mumkin) — render va darsga qoʻshishdan oldin DOMPurify bilan tozalanadi. */
const md = (text: string) => DOMPurify.sanitize(marked.parse(text) as string);

type Msg = { role: "user" | "assistant"; content: string };
type AttachedDoc = { uri: string; mimeType: string; name: string };

export default function AiAssistantPanel({
  lessonContext, classIds = [], lessonId, onClose, onInsert,
}: {
  lessonContext: { title?: string; classes?: string; unit?: string; content?: string };
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Chat tarixi: ochilganda serverdan yuklash (dars boʻyicha)
  const loadedRef = useRef(false);
  useEffect(() => {
    if (!lessonId || loadedRef.current) return;
    loadedRef.current = true;
    let on = true;
    fetch(`/api/murabbiyona-ai/chat?lessonId=${encodeURIComponent(lessonId)}`)
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
    fetch("/api/murabbiyona-ai/chat", {
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
      const res = await fetch("/api/murabbiyona-ai", {
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
      const res = await fetch("/api/murabbiyona-ai/doc", { method: "POST", body: fd });
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
  const copy = (i: number, text: string) => { navigator.clipboard.writeText(text); setCopiedIdx(i); toast.success(t("toast.copied")); setTimeout(() => setCopiedIdx(null), 1500); };
  const addToLesson = (text: string) => { onInsert(md(text)); toast.success(t("toast.added")); };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-5 h-[60px] flex items-center justify-between shrink-0 border-b border-border">
        <div className="flex items-center gap-2.5">
          <span className="size-8 rounded-lg bg-muted flex items-center justify-center"><Bot className="size-5 text-foreground" /></span>
          <span className="text-lg font-bold text-foreground">{t("title")}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={reset} title={t("clearConversation")} className="size-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <RotateCcw className="size-4" />
          </button>
          <button onClick={onClose} title={t("close")} className="size-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="size-4.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <span className="size-14 rounded-2xl bg-muted flex items-center justify-center mb-4"><Bot className="size-7 text-muted-foreground" /></span>
            <p className="text-base font-bold text-foreground">{t("emptyTitle")}</p>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-[280px] leading-relaxed">
              {t("emptyDescription")}
            </p>
            <div className="mt-5 flex flex-col gap-2 w-full max-w-[300px]">
              {[
                t("suggestion.lessonPlan"),
                t("suggestion.exercises"),
                t("suggestion.quizQuestions"),
              ].map((s) => (
                <button key={s} onClick={() => setInput(s)}
                  className="text-left text-xs text-muted-foreground border border-border rounded-lg px-3 py-2 hover:bg-muted hover:text-foreground transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
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
            </div>
          ))
        )}
      </div>

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
