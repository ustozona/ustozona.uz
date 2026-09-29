"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { bankTestQuestionsAction, listBankTestsAction } from "@/server/actions/test-bank";
import type { BankPreview, BankTest, BankTier } from "@/lib/test-bank-types";
import type { DraftQuestion } from "./builder/types";
import { newQuestion } from "./builder/types";

/** Bankdan savollar NUSXALANADI: har birida yangi key/variant id bor.
    Manba testining savollariga yoki allaqachon oʻtkazilgan natijalarga tegilmaydi. */
export default function BankQuestionPicker({ classId, onClose, onPick }: {
  classId: string;
  onClose: () => void;
  onPick: (title: string, questions: DraftQuestion[]) => void;
}) {
  const t = useTranslations("BankPicker");
  const [tier, setTier] = useState<BankTier>("tasdiqlangan");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [tests, setTests] = useState<BankTest[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(24);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BankTest | null>(null);
  const [preview, setPreview] = useState<BankPreview | null>(null);
  const [indices, setIndices] = useState<number[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => { setQuery(search.trim()); setPage(0); }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listBankTestsAction({ classId, tier, search: query, page })
      .then((result) => {
        if (!alive) return;
        setTests(result.tests);
        setTotal(result.total);
        setPageSize(result.pageSize);
      })
      .catch(() => { if (alive) toast.error(t("loadFailed")); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [classId, tier, query, page, t]);

  async function openTest(test: BankTest) {
    setSelected(test);
    setPreview(null);
    setIndices([]);
    try {
      const result = await bankTestQuestionsAction(test.id);
      setPreview(result);
      if (result.ok) setIndices(result.questions.flatMap((q, i) => usable(q) ? [i] : []));
    } catch {
      setPreview({ ok: false });
    }
  }

  function usable(q: Extract<BankPreview, { ok: true }>["questions"][number]) {
    // Muharrir toʻrtta variantni qoʻllaydi; ortigʻini kesish toʻgʻri javobni yoʻqotadi.
    return q.stem.trim().length > 0 && q.stem.length <= 2000 &&
      q.options.length >= 2 && q.options.length <= 4 &&
      q.options.every((o) => o.text.trim().length > 0 && o.text.length <= 500) &&
      q.options.some((o) => o.isCorrect);
  }

  function add() {
    if (!selected || !preview?.ok || indices.length === 0) return;
    const imported = indices.sort((a, b) => a - b).map((i) => {
      const source = preview.questions[i];
      const draft = newQuestion("mcq");
      return {
        ...draft,
        title: source.stem.slice(0, 200),
        stem: source.stem,
        // Muharrirda doim 4 katak boʻlsin: 2–3 variantli savolga ustoz
        // keyinchalik boʻsh katakka yangi variant qoʻsha oladi.
        options: draft.options.map((option, index) => source.options[index]
          ? { ...option, text: source.options[index].text, isCorrect: source.options[index].isCorrect }
          : option),
        multiSelect: source.options.filter((o) => o.isCorrect).length > 1,
      };
    });
    onPick(selected.title, imported);
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        {!selected ? (
          <>
            <div className="flex flex-wrap gap-2">
              {(["tasdiqlangan", "ommaviy", "shaxsiy"] as BankTier[]).map((value) => (
                <Button key={value} size="sm" variant={tier === value ? "default" : "outline"}
                  onClick={() => { setTier(value); setPage(0); }}>
                  {t(`tier_${value}`)}
                </Button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={t("search")} className="pl-8" />
            </div>
            <ScrollArea className="min-h-0 flex-1">
              {loading ? <div className="flex h-40 items-center justify-center"><Spinner /></div>
                : tests.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
                  : <div className="flex flex-col gap-2 pr-3">
                    {tests.map((test) => (
                      <button key={test.id} type="button" onClick={() => openTest(test)}
                        className="list-card flex w-full items-center justify-between gap-3 p-3 text-left">
                        <span className="min-w-0 truncate text-sm font-medium">{test.title}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{t("count", { count: test.questionCount })}</span>
                      </button>
                    ))}
                  </div>}
            </ScrollArea>
            {total > pageSize && <div className="flex items-center justify-center gap-3">
              <Button size="icon" variant="outline" disabled={page === 0 || loading} onClick={() => setPage(page - 1)}><ChevronLeft /></Button>
              <span className="text-sm">{page + 1} / {Math.ceil(total / pageSize)}</span>
              <Button size="icon" variant="outline" disabled={(page + 1) * pageSize >= total || loading} onClick={() => setPage(page + 1)}><ChevronRight /></Button>
            </div>}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setSelected(null); setPreview(null); }}><ChevronLeft className="size-4" />{t("back")}</Button>
              <span className="min-w-0 truncate text-sm font-medium">{selected.title}</span>
            </div>
            {!preview ? <div className="flex h-40 items-center justify-center"><Spinner /></div>
              : !preview.ok ? <p className="py-8 text-center text-sm text-destructive">{t("loadFailed")}</p>
                : <>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span>{t("chosen", { count: indices.length })}</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIndices([])}>{t("clear")}</Button>
                      <Button variant="ghost" size="sm" onClick={() => setIndices(preview.questions.flatMap((q, i) => usable(q) ? [i] : []))}>{t("all")}</Button>
                    </div>
                  </div>
                  <ScrollArea className="min-h-0 flex-1">
                    <div className="flex flex-col gap-2 pr-3">
                      {preview.questions.map((q, i) => (
                        <label key={i} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
                          <input type="checkbox" className="mt-1 size-4 accent-primary" disabled={!usable(q)}
                            checked={indices.includes(i)} onChange={(e) => setIndices((prev) => e.target.checked ? [...prev, i] : prev.filter((n) => n !== i))} />
                          <span className="min-w-0 text-sm"><strong>{i + 1}.</strong> {q.stem}
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {usable(q) ? q.options.map((o) => o.text).join(" · ") : t("unsupported")}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </ScrollArea>
                  <Button disabled={indices.length === 0} onClick={add}>{t("add", { count: indices.length })}</Button>
                </>}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
