"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionIcon } from "@/components/ui/section-icon";
import { FileCheck2 } from "lucide-react";
import { getSetDraftAction, saveSetDraftAction } from "@/server/actions/assess";
import type { ActivitySetRow } from "@/server/db/schema";
import QuestionCanvas from "./builder/QuestionCanvas";
import PropertiesPanel from "./builder/PropertiesPanel";
import QuestionStrip from "./builder/QuestionStrip";
import BuilderRail, { type BuilderPanel } from "./builder/BuilderRail";
import ThemesPanel from "./builder/ThemesPanel";
import { newQuestion, type DraftQuestion } from "./builder/types";

/**
 * Toʻplam builder — Kahoot uslubidagi uch ustunli muharrir: chapda
 * savollar tasmasi, markazda kanvas, oʻngda xossalar paneli.
 *
 * Toʻplam bu yerda HUJJAT: savollar uning ichida yashaydi. Butun
 * qoralama mahalliy holatda turadi va "Saqlash" bosilganda bitta
 * `saveSetDraftAction` amali bilan yoziladi — bekor qilinganda bazada
 * yarim yaratilgan savol qolmaydi.
 */
export default function SetBuilderOverlay({
  classId,
  className,
  setId,
  initialTitle,
  onClose,
  onSaved,
}: {
  classId: string;
  className: string;
  /** Boʻsh — yangi toʻplam yaratiladi. */
  setId?: string;
  /** Yangi toʻplam uchun boshlangʻich nom — topshiriq nomi bilan bir
      xil boʻlishi kerak (foydalanuvchi ikki marta yozmasin). */
  initialTitle?: string;
  onClose: () => void;
  onSaved: (set: ActivitySetRow) => void;
}) {
  const [loading, setLoading] = useState(Boolean(setId));
  const [currentSetId, setCurrentSetId] = useState(setId);
  const [title, setTitle] = useState(() => (setId ? "" : initialTitle ?? ""));
  const [stageTheme, setStageTheme] = useState("violet");
  const [questions, setQuestions] = useState<DraftQuestion[]>(() =>
    setId ? [] : [newQuestion("mcq")]
  );
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [panel, setPanel] = useState<BuilderPanel>("properties");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!setId) {
      setActiveKey((prev) => prev ?? null);
      return;
    }
    let cancelled = false;
    getSetDraftAction(setId).then((draft) => {
      if (cancelled) return;
      if (!draft) {
        setError("Toʻplam topilmadi");
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

  async function handleSave() {
    setError(null);
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("Toʻplam nomini kiriting");
      return;
    }
    // Boʻsh variant/juftliklar saqlashdan oldin tushirib qoldiriladi —
    // server validatsiyasi shu tozalangan roʻyxat ustida ishlaydi.
    const payload = questions.map((q, index) => ({
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

    setSaving(true);
    try {
      const draft = await saveSetDraftAction({
        setId: currentSetId,
        classId,
        title: cleanTitle,
        purpose: "summative",
        stageTheme,
        questions: payload,
      });
      setCurrentSetId(draft.set.id);
      setQuestions((prev) =>
        prev.map((q, index) => ({ ...q, activityId: draft.questions[index]?.activityId }))
      );
      onSaved(draft.set);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Saqlashda xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[48] flex flex-col bg-card animate-in fade-in-0 duration-fast">
      <header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-border px-4">
        <SectionIcon className="shrink-0">
          <FileCheck2 />
        </SectionIcon>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Test nomini kiriting…"
          maxLength={200}
          className="h-9 max-w-xs border-0 bg-transparent px-0 text-base font-semibold shadow-none focus-visible:ring-0"
        />

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {error && <span className="max-w-xs truncate text-sm text-destructive">{error}</span>}
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Chiqish
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {saving ? "Saqlanmoqda…" : "Saqlash"}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Yopish" onClick={onClose} disabled={saving}>
            <X className="size-4" />
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Yuklanmoqda…
        </div>
      ) : (
        <div
          className="grid min-h-0 flex-1"
          style={{
            // Oxirgi ustun — doimiy reyl (Kahoot'dagi vertikal panel):
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
              Savol tanlang
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
    </div>,
    document.body
  );
}
