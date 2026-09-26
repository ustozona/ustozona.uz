"use client";

import { useEffect, useRef, useState } from "react";
import { stageFontOf, type StageFontId } from "@/lib/stage-fonts";
import { stageStyleOf, type StageStyleId } from "@/lib/stage-styles";
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
import { toast } from "sonner";
import { uploadEditorImageAction } from "@/server/actions/uploads";
import { MAX_PDF_PAGES, pdfToImages } from "@/lib/pdf-to-images";
import { MAX_PPTX_SLIDES, pptxToSlides } from "@/lib/pptx-to-slides";

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
  firstShape = "mcq",
  onClose,
  onSaved,
}: {
  classId: string;
  /** Boʻsh — yangi toʻplam yaratiladi. */
  setId?: string;
  /** Yangi toʻplam uchun boshlangʻich nom — topshiriq nomi bilan bir
      xil boʻlishi kerak (foydalanuvchi ikki marta yozmasin). */
  initialTitle?: string;
  /** Yangi toʻplamning birinchi elementi: test savoli yoki slayd (taqdimot). */
  firstShape?: DraftQuestion["shape"];
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
  const [stageFont, setStageFont] = useState<StageFontId>(stageFontOf(null).id);
  const [stageStyle, setStageStyle] = useState<StageStyleId>(stageStyleOf(null).id);
  const [questions, setQuestions] = useState<DraftQuestion[]>(() =>
    // Taqdimot sarlavha slaydidan boshlanadi — birinchi ekran mavzu nomi.
    setId ? [] : [firstShape === "slide" ? { ...newQuestion("slide"), slideLayout: "title" } : newQuestion(firstShape)]
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
      const config = draft.set.config as { stageTheme?: string; stageFont?: string; stageStyle?: string };
      setTitle(draft.set.title);
      setStageTheme(config.stageTheme ?? "violet");
      setStageFont(stageFontOf(config.stageFont).id);
      setStageStyle(stageStyleOf(config.stageStyle).id);
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

  /* ── TAQDIMOT IMPORTI (docs/taqdimot-spec.md, 2-qavat) ──
     Bitta tugma, ikki yoʻl — fayl turiga qarab:
       • PDF  → har sahifa rasm, «Katta media» slaydi (koʻrinish aniq,
                matn tahrirlanmaydi);
       • PPTX → sarlavha, matn va asosiy rasm ajratilib maketga
                joylanadi (matn tahrirlanadi, jadval/diagramma koʻchmaydi).
     Slaydlar joriy elementdan KEYIN qoʻyiladi: oʻqituvchi sarlavha
     slaydini tuzib, keyin tayyor taqdimotini ulaydi. Import qilingan
     slaydlar orasiga savol qoʻshish — bizning asosiy afzalligimiz. */
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importProgress, setImportProgress] = useState<{ done: number; total: number } | null>(null);

  /** Tayyor slaydlarni joriy elementdan keyin qoʻyadi. */
  function insertSlides(slides: DraftQuestion[]) {
    setQuestions((prev) => {
      // Yangi toʻplamdagi boʻsh boshlangʻich element saqlanib qolmasin.
      const blank = (q: DraftQuestion) =>
        !q.title.trim() && !q.stem.trim() && !q.imageUrl &&
        !q.options.some((o) => o.text.trim()) && !q.pairs.some((p) => p.left.trim());
      const base = prev.length === 1 && blank(prev[0]) ? [] : prev;
      const at = base.findIndex((q) => q.key === activeKey);
      const insertAt = at < 0 ? base.length : at + 1;
      return [...base.slice(0, insertAt), ...slides, ...base.slice(insertAt)];
    });
    if (slides[0]) setActiveKey(slides[0].key);
  }

  /** Rasmlarni bir vaqtda koʻpi bilan `limit` tadan yuklaydi — ketma-ket
      60 ta server soʻrovi maktab internetida bir daqiqadan oshardi, hammasini
      birdan yuborish esa sust tarmoqni boʻgʻib qoʻyadi. Tartib saqlanadi. */
  async function uploadAll(
    dataUrls: (string | undefined)[],
    upload: (dataUrl: string) => Promise<string>,
    onDone: () => void,
    limit = 4,
  ): Promise<{ urls: (string | undefined)[]; failed: number }> {
    const out: (string | undefined)[] = new Array(dataUrls.length);
    let next = 0;
    let failed = 0;
    const worker = async () => {
      while (next < dataUrls.length) {
        const i = next++;
        const src = dataUrls[i];
        // Bitta rasm xatosi (masalan, 2 MB dan katta) butun importni
        // bekor qilmasin — slayd rasmsiz qoladi, qolganlari saqlanadi.
        try {
          out[i] = src ? await upload(src) : undefined;
        } catch {
          out[i] = undefined;
          if (src) failed++;
        }
        onDone();
      }
    };
    await Promise.all(Array.from({ length: Math.min(limit, dataUrls.length) }, worker));
    return { urls: out, failed };
  }

  async function importPresentation(file: File) {
    const isPptx = /\.pptx$/i.test(file.name);
    const isPdf = /\.pdf$/i.test(file.name) || file.type === "application/pdf";
    if (!isPptx && !isPdf) {
      toast.error("Bu fayl turi qoʻllab-quvvatlanmaydi", {
        description: "PDF yoki PPTX yuklang. Eski .ppt faylni PowerPointda PPTX yoki PDF qilib saqlang.",
      });
      return;
    }

    setImportProgress({ done: 0, total: 0 });
    let failedImages = 0;
    let notStored = false;
    const upload = async (dataUrl: string) => {
      const { url, stored } = await uploadEditorImageAction(dataUrl);
      if (!stored) notStored = true;
      return url;
    };

    try {
      // Tahlil — ishning yarmi, rasmlarni yuklash — ikkinchi yarmi.
      const half = (done: number, total: number) => setImportProgress({ done, total: total * 2 });
      const slides: DraftQuestion[] = [];
      let notes: string[] = [];

      if (isPdf) {
        const { images, totalPages } = await pdfToImages(file, half);
        let uploaded = 0;
        const { urls, failed } = await uploadAll(images, upload, () =>
          setImportProgress({ done: images.length + ++uploaded, total: images.length * 2 }),
        );
        failedImages = failed;
        for (const url of urls) {
          slides.push({ ...newQuestion("slide"), slideLayout: "media", imageUrl: url });
        }
        if (totalPages > MAX_PDF_PAGES) {
          notes = [`PDF da ${totalPages} sahifa bor — birinchi ${MAX_PDF_PAGES} tasi olindi.`];
        }
      } else {
        const { slides: parsed, lossy, totalSlides } = await pptxToSlides(file, half);
        let uploaded = 0;
        const { urls, failed } = await uploadAll(
          parsed.map((p) => p.imageDataUrl),
          upload,
          () => setImportProgress({ done: parsed.length + ++uploaded, total: parsed.length * 2 }),
        );
        failedImages = failed;
        parsed.forEach((p, i) => {
          slides.push({
            ...newQuestion("slide"),
            slideLayout: p.layout,
            title: p.title,
            stem: p.body,
            imageUrl: urls[i],
          });
        });
        if (totalSlides > MAX_PPTX_SLIDES) {
          notes.push(`Faylda ${totalSlides} slayd bor — birinchi ${MAX_PPTX_SLIDES} tasi olindi.`);
        }
        if (lossy) {
          notes.push("Jadval, diagramma va qoʻshimcha rasmlar koʻchmadi — aynan koʻrinish kerak boʻlsa, PDF qilib import qiling.");
        }
      }

      if (failedImages > 0) {
        notes.push(`${failedImages} ta rasm juda katta boʻlgani uchun yuklanmadi — ularni slaydga qoʻlda qoʻshing.`);
      }
      insertSlides(slides);
      toast.success(`${slides.length} ta slayd qoʻshildi`, {
        description: notes.length ? notes.join(" ") : "Endi slaydlar orasiga savol qoʻshishingiz mumkin.",
      });
      if (notStored) {
        toast.warning("Rasmlar saqlagichga yuklanmadi", {
          description: "Koʻp sahifali taqdimot saqlanmasligi mumkin — administratorga xabar bering.",
        });
      }
    } catch {
      toast.error("Faylni oʻqib boʻlmadi", {
        description: "Fayl buzilmaganini va parol bilan himoyalanmaganini tekshiring.",
      });
    } finally {
      setImportProgress(null);
    }
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
      title: (q.title.trim() || q.stem.trim() || `${index + 1}-${q.shape === "slide" ? "slayd" : "savol"}`).slice(0, 200),
      stem: q.stem.trim(),
      options: q.options.filter((o) => o.text.trim()).map((o) => ({ ...o, text: o.text.trim() })),
      pairs: q.pairs
        .filter((p) => p.left.trim() && p.right.trim())
        .map((p) => ({ ...p, left: p.left.trim(), right: p.right.trim() })),
      timeLimitSec: q.timeLimitSec,
      pointsMode: q.pointsMode,
      multiSelect: q.multiSelect,
      answerLayout: q.answerLayout,
      ...(q.shape === "text" ? { sampleAnswer: q.sampleAnswer } : {}),
      ...(q.shape === "slide"
        ? {
            slideLayout: q.slideLayout,
            slideHeading: q.title.trim(),
            slideBg: q.slideBg,
            imageUrl: q.imageUrl,
            videoUrl: q.videoUrl?.trim() || undefined,
          }
        : {}),
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
        stageFont,
        stageStyle,
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
      savedSnapshotRef.current = JSON.stringify({ title: cleanTitle, questions: buildPayload(), stageTheme, stageFont, stageStyle });
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
    const sig = JSON.stringify({ title: cleanTitle, questions: buildPayload(), stageTheme, stageFont, stageStyle });
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
  }, [title, questions, stageTheme, stageFont, stageStyle, loading]);

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
          {importProgress && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Import: {importProgress.total ? Math.round((importProgress.done / importProgress.total) * 100) : 0}%
            </span>
          )}
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
            onImport={() => importInputRef.current?.click()}
            onDuplicate={duplicateQuestion}
            onRemove={removeQuestion}
          />

          {active ? (
            <QuestionCanvas
              question={active}
              stageTheme={stageTheme}
              stageFont={stageFont}
              stageStyle={stageStyle}
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
              font={stageFont}
              onFontChange={setStageFont}
              stageStyle={stageStyle}
              onStageStyleChange={setStageStyle}
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

    <input
      ref={importInputRef}
      type="file"
      accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (file && !importProgress) void importPresentation(file);
      }}
    />

    {/* Kichraytirilgan yorliq — bosilsa quruvchi oʻsha holatida qaytadi.
        z-[49]: quruvchining oʻzidan (48) baland, shuning uchun ostidagi
        test roʻyxati koʻrinib turganda ham ustida qalqib turadi. */}
    {minimized && (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 left-4 z-[49] flex max-w-xs items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg transition-colors hover:bg-muted/50"
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
