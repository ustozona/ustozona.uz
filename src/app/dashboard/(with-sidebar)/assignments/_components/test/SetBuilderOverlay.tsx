"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";
import { Check, Loader2, Minus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionIcon } from "@/components/ui/section-icon";
import { FileCheck2 } from "lucide-react";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { getSetDraftAction, saveSetDraftAction, type SetDraft } from "@/server/actions/assess";
import type { ActivitySetRow } from "@/server/db/schema";
import QuestionCanvas from "./builder/QuestionCanvas";
import PropertiesPanel from "./builder/PropertiesPanel";
import QuestionStrip from "./builder/QuestionStrip";
import BuilderRail, { type BuilderPanel } from "./builder/BuilderRail";
import ThemesPanel from "./builder/ThemesPanel";
import { newQuestion, type DraftQuestion } from "./builder/types";

/**
 * Toʻplam builder — viktorina-uslub uch ustunli muharrir: chapda
 * savollar tasmasi, markazda kanvas, oʻngda xossalar paneli.
 *
 * Toʻplam bu yerda HUJJAT: savollar uning ichida yashaydi. Butun
 * qoralama mahalliy holatda turadi va "Saqlash" bosilganda bitta
 * `saveSetDraftAction` amali bilan yoziladi — bekor qilinganda bazada
 * yarim yaratilgan savol qolmaydi.
 */
export default function SetBuilderOverlay({
  classId,
  setId,
  initialTitle,
  onClose,
  onSaved,
}: {
  classId: string;
  /** Boʻsh — yangi toʻplam yaratiladi. */
  setId?: string;
  /** Yangi toʻplam uchun boshlangʻich nom — topshiriq nomi bilan bir
      xil boʻlishi kerak (foydalanuvchi ikki marta yozmasin). */
  initialTitle?: string;
  onClose: () => void;
  onSaved: (set: ActivitySetRow) => void;
}) {
  const t = useTranslations("SetBuilder");
  const [loading, setLoading] = useState(Boolean(setId));
  /* ⚠️ Toʻplam id'si REF'da (holatda emas). `persist` ketma-ket ikki marta
     chaqirilishi mumkin — avtosaqlash ustiga "Saqlash" bosilsa yoki sekin
     tarmoqda birinchi yozuv 2 soniyadan uzoq ketsa. React holati oʻsha
     paytda hali yangilanmagan boʻladi va ikkala chaqiruv ham
     `setId: undefined` yuborib IKKITA bir xil toʻplam yaratardi (roʻyxatda
     bir xil nomli ikki qator — kuzatilgan alomat). */
  const setIdRef = useRef(setId);
  const [title, setTitle] = useState(() => (setId ? "" : initialTitle ?? ""));
  const [stageTheme, setStageTheme] = useState("violet");
  const [questions, setQuestions] = useState<DraftQuestion[]>(() =>
    setId ? [] : [newQuestion("mcq")]
  );
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [panel, setPanel] = useState<BuilderPanel>("properties");
  const [saving, setSaving] = useState(false);
  const [autosaving, setAutosaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  /* Kichraytirilganda komponent UNMOUNT QILINMAYDI — faqat yashiriladi.
     Shu sabab savollar, tanlangan savol, mavzu — hammasi joyida qoladi va
     tiklanganda oʻsha holatda ochiladi (avtosaqlash ham ishlab turaveradi). */
  const [minimized, setMinimized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /* Oxirgi SAQLANGAN holat imzosi — avtosaqlash shu bilan solishtirib,
     hech narsa oʻzgarmagan boʻlsa server soʻrovini takrorlamaydi. */
  const savedSnapshotRef = useRef<string | null>(null);
  /* Ketayotgan yozuv — ikkinchisi navbatda kutadi (yuqoridagi izoh). */
  const persistLock = useRef<Promise<SetDraft> | null>(null);

  useEffect(() => {
    if (!setId) {
      setActiveKey((prev) => prev ?? null);
      return;
    }
    let cancelled = false;
    getSetDraftAction(setId).then((draft) => {
      if (cancelled) return;
      if (!draft) {
        setError(t("errNotFound"));
        setLoading(false);
        return;
      }
      const loaded: DraftQuestion[] = draft.questions.map((q) => ({ ...q, key: crypto.randomUUID() }));
      const config = draft.set.config as { stageTheme?: string };
      setTitle(draft.set.title);
      setStageTheme(config.stageTheme ?? "violet");
      setQuestions(loaded.length > 0 ? loaded : [newQuestion("mcq")]);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // `t` ataylab bogʻliqliklarda yoʻq: u faqat xato matni uchun ishlatiladi,
    // roʻyxatga qoʻshilsa esa til obyekti yangilanganda toʻplam qaytadan
    // yuklanib, oʻqituvchining tahrirlanmagan qoralamasi ustiga yozilardi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setId]);

  // Faol savol har doim mavjud boʻlishi kerak — yuklangandan yoki
  // oʻchirishdan keyin roʻyxatning birinchisiga tushadi.
  useEffect(() => {
    if (questions.length === 0) return;
    if (questions.some((q) => q.key === activeKey)) return;
    setActiveKey(questions[0].key);
  }, [questions, activeKey]);

  const activeIndex = questions.findIndex((q) => q.key === activeKey);
  const active = activeIndex >= 0 ? questions[activeIndex] : null;
  // Xossalar faqat savol tanlanganda mazmunli; mavzu esa har doim.
  const sidePanelOpen = panel === "themes" || (panel === "properties" && Boolean(active));

  function patchActive(patch: Partial<DraftQuestion>) {
    setQuestions((prev) => prev.map((q) => (q.key === activeKey ? { ...q, ...patch } : q)));
  }

  function addQuestion(shape: DraftQuestion["shape"]) {
    const created = newQuestion(shape);
    setQuestions((prev) => [...prev, created]);
    setActiveKey(created.key);
  }

  function duplicateQuestion(key: string) {
    setQuestions((prev) => {
      const index = prev.findIndex((q) => q.key === key);
      if (index < 0) return prev;
      const source = prev[index];
      // Nusxa YANGI savol — `activityId` koʻchirilmaydi, aks holda
      // saqlashda asl savol ustiga yozilardi.
      const copy: DraftQuestion = {
        ...source,
        key: crypto.randomUUID(),
        activityId: undefined,
        options: source.options.map((o) => ({ ...o, id: crypto.randomUUID() })),
        pairs: source.pairs.map((p) => ({ ...p, id: crypto.randomUUID() })),
      };
      return [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)];
    });
  }

  function removeQuestion(key: string) {
    setQuestions((prev) => (prev.length <= 1 ? prev : prev.filter((q) => q.key !== key)));
  }

  // Boʻsh variant/juftliklar saqlashdan oldin tushirib qoldiriladi —
  // server validatsiyasi shu tozalangan roʻyxat ustida ishlaydi.
  function buildPayload() {
    return questions.map((q, index) => ({
      activityId: q.activityId,
      shape: q.shape,
      title: (q.title.trim() || q.stem.trim() || `${index + 1}-savol`).slice(0, 200),
      stem: q.stem.trim(),
      options: q.options.filter((o) => o.text.trim()).map((o) => ({ ...o, text: o.text.trim() })),
      pairs: q.pairs
        .filter((p) => p.left.trim() && p.right.trim())
        .map((p) => ({ ...p, left: p.left.trim(), right: p.right.trim() })),
      timeLimitSec: q.timeLimitSec,
      pointsMode: q.pointsMode,
      multiSelect: q.multiSelect,
      answerLayout: q.answerLayout,
    }));
  }

  /** Haqiqiy yozish — qoʻlda "Saqlash" ham, jim avtosaqlash ham shundan
      foydalanadi. Bir vaqtda BITTA yozuv ketadi: ikkinchi chaqiruv
      birinchisini kutadi va shundan keyingina `setIdRef` ni oʻqiydi. */
  async function persist(cleanTitle: string): Promise<SetDraft> {
    const previous = persistLock.current;
    if (previous) await previous.catch(() => {});

    const run = (async () => {
      const draft = await saveSetDraftAction({
        setId: setIdRef.current,
        classId,
        title: cleanTitle,
        purpose: "summative",
        stageTheme,
        questions: buildPayload(),
      });
      setIdRef.current = draft.set.id;
      setQuestions((prev) =>
        prev.map((q, index) => ({ ...q, activityId: draft.questions[index]?.activityId }))
      );
      return draft;
    })();

    persistLock.current = run;
    try {
      return await run;
    } finally {
      if (persistLock.current === run) persistLock.current = null;
    }
  }

  async function handleSave() {
    setError(null);
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError(t("errTitleRequired"));
      return;
    }
    setSaving(true);
    try {
      const draft = await persist(cleanTitle);
      savedSnapshotRef.current = JSON.stringify({ title: cleanTitle, questions: buildPayload(), stageTheme });
      onSaved(draft.set);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errSaveFailed"));
    } finally {
      setSaving(false);
    }
  }

  /* Jim avtosaqlash — 30 daqiqalik savol mehnati bitta "X" bosishda
     yoʻqolib ketmasin (SetBuilderOverlay ilgari hech qayerga yozmasdi).
     Nom kiritilmagan boʻlsa saqlanmaydi (server talabi) — bu holat
     `requestClose`da alohida ogohlantiriladi. */
  useEffect(() => {
    if (loading) return;
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    const sig = JSON.stringify({ title: cleanTitle, questions: buildPayload(), stageTheme });
    if (sig === savedSnapshotRef.current) return;
    const timer = setTimeout(async () => {
      setAutosaving(true);
      try {
        const draft = await persist(cleanTitle);
        savedSnapshotRef.current = sig;
        // Avtosaqlashdan keyin ham xabar beramiz: toʻplam bazada
        // paydo boʻlgani zahoti topshiriq bilan halqasi bogʻlansin.
        // Ilgari faqat "Saqlash" bosilganda edi — oʻqituvchi ✕ bilan
        // chiqsa test yaratilgan, lekin biriktirilmagan boʻlib qolardi.
        onSaved(draft.set);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
      } catch {
        // Jim — keyingi oʻzgarishda yana urinadi, foydalanuvchini bezovta qilmaydi.
      } finally {
        setAutosaving(false);
      }
    }, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, questions, stageTheme, loading]);

  /* Yopishni soʻraydi: nom hali kiritilmagan boʻlsa avtosaqlash ishlamagan
     boʻladi — shu bitta holatda "chindan ham tashlaymizmi?" soʻraladi. */
  function requestClose() {
    const hasContent = questions.some(
      (q) => q.stem.trim() || q.title.trim() || q.options.some((o) => o.text.trim())
    );
    if (!title.trim() && hasContent) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  }

  return createPortal(
    <>
    <div
      className={cn(
        "fixed inset-0 z-[48] flex flex-col bg-card animate-in fade-in-0 duration-fast",
        minimized && "hidden"
      )}
    >
      <header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-border px-4">
        <SectionIcon className="shrink-0">
          <FileCheck2 />
        </SectionIcon>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("titlePlaceholder")}
          maxLength={200}
          className="h-9 max-w-xs border-0 bg-transparent px-0 text-base font-semibold shadow-none focus-visible:ring-0"
        />

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {error && <span className="max-w-xs truncate text-sm text-destructive">{error}</span>}
          {!error && autosaving && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> {t("saving")}
            </span>
          )}
          {!error && !autosaving && justSaved && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="size-3.5" /> {t("saved")}
            </span>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {saving ? t("saving") : t("save")}
          </Button>
          {/* Oyna boshqaruvi — AssignmentEditorOverlay sarlavhasidagi bilan
              bir xil juftlik. Ilgari yonida "Chiqish" matnli tugmasi ham bor
              edi: uchta chiqish yoʻli, ikkitasi aynan bir xil amal. */}
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("minimize")}
            onClick={() => setMinimized(true)}
            disabled={saving}
          >
            <Minus className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label={t("close")} onClick={requestClose} disabled={saving}>
            <X className="size-4" />
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> {t("loading")}
        </div>
      ) : (
        <div
          className="grid min-h-0 flex-1"
          style={{
            // Oxirgi ustun — doimiy reyl (viktorina-uslub vertikal panel):
            // xossalar yopilganda ham rejim tanlash koʻrinib turadi.
            gridTemplateColumns: sidePanelOpen
              ? "13.75rem 1fr 18rem 4rem"
              : "13.75rem 1fr 4rem",
          }}
        >
          <QuestionStrip
            questions={questions}
            activeKey={activeKey}
            onSelect={setActiveKey}
            onAdd={addQuestion}
            onDuplicate={duplicateQuestion}
            onRemove={removeQuestion}
          />

          {active ? (
            <QuestionCanvas
              question={active}
              stageTheme={stageTheme}
              onChange={patchActive}
            />
          ) : (
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              {t("pickQuestion")}
            </div>
          )}

          {panel === "themes" && (
            <ThemesPanel
              value={stageTheme}
              onChange={setStageTheme}
              onClose={() => setPanel(null)}
            />
          )}

          {panel === "properties" && active && (
            <PropertiesPanel
              question={active}
              questionNumber={activeIndex + 1}
              canDelete={questions.length > 1}
              onChange={patchActive}
              onApplyTimeToAll={() =>
                setQuestions((prev) => prev.map((q) => ({ ...q, timeLimitSec: active.timeLimitSec })))
              }
              onDuplicate={() => duplicateQuestion(active.key)}
              onRemove={() => removeQuestion(active.key)}
            />
          )}

          <BuilderRail panel={panel} onSelect={setPanel} />
        </div>
      )}
    </div>

    {/* Kichraytirilgan yorliq — bosilsa quruvchi oʻsha holatida qaytadi.
        z-[49]: quruvchining oʻzidan (48) baland, shuning uchun ostidagi
        test roʻyxati koʻrinib turganda ham ustida qalqib turadi. */}
    {minimized && (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 left-4 z-[49] flex max-w-xs items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 shadow-lg transition-colors hover:bg-muted/50"
      >
        <SectionIcon className="size-8 shrink-0">
          <FileCheck2 />
        </SectionIcon>
        <span className="min-w-0 flex-1 text-left">
          <span className="block truncate text-sm font-medium text-foreground">
            {title.trim() || t("untitled")}
          </span>
          <span className="block text-xs text-muted-foreground">
            {autosaving ? t("saving") : t("questionCount", { count: questions.length })}
          </span>
        </span>
      </button>
    )}

    <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("discardTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("discardDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("discardCancel")}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={() => {
              setConfirmDiscard(false);
              onClose();
            }}
          >
            {t("discardConfirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>,
    document.body
  );
}
