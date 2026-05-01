"use client";

import { useState } from "react";
import { X, Info, Ban, Scale, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TOPIC_COLORS,
  TOPIC_COLOR_ORDER,
  type InputMode,
  type Topic,
  type TopicColor,
  type ClassData,
} from "@/lib/grades-data";

type WeightMode = "weighted" | "no_weight";
type GradingScale =
  | "letter_plus"
  | "letter_basic"
  | "pass_fail"
  | "scale_6"
  | "scale_10"
  | "custom";

const SCALE_LABELS: Record<GradingScale, string> = {
  letter_plus: "Harf bahosi (A+ dan F gacha)",
  letter_basic: "Harf bahosi (A dan F gacha)",
  pass_fail: "Bajardi / Bajarmadi",
  scale_6: "1–6 shkala",
  scale_10: "1–10 shkala",
  custom: "Maxsus",
};

type ScaleRow = { label: string; min: number; max: number };

const DEFAULT_SCALES: Record<GradingScale, ScaleRow[]> = {
  letter_plus: [
    { label: "A+", min: 97, max: 100 },
    { label: "A", min: 93, max: 96 },
    { label: "A-", min: 90, max: 92 },
    { label: "B+", min: 87, max: 89 },
    { label: "B", min: 83, max: 86 },
    { label: "B-", min: 80, max: 82 },
    { label: "C+", min: 77, max: 79 },
    { label: "C", min: 73, max: 76 },
    { label: "C-", min: 70, max: 72 },
    { label: "D", min: 60, max: 69 },
    { label: "F", min: 0, max: 59 },
  ],
  letter_basic: [
    { label: "A", min: 90, max: 100 },
    { label: "B", min: 80, max: 89 },
    { label: "C", min: 70, max: 79 },
    { label: "D", min: 60, max: 69 },
    { label: "F", min: 0, max: 59 },
  ],
  pass_fail: [
    { label: "Bajardi", min: 60, max: 100 },
    { label: "Bajarmadi", min: 0, max: 59 },
  ],
  scale_6: [
    { label: "6", min: 90, max: 100 },
    { label: "5", min: 75, max: 89 },
    { label: "4", min: 60, max: 74 },
    { label: "3", min: 45, max: 59 },
    { label: "2", min: 30, max: 44 },
    { label: "1", min: 0, max: 29 },
  ],
  scale_10: Array.from({ length: 10 }, (_, i) => ({
    label: `${10 - i}`,
    min: 100 - (i + 1) * 10,
    max: 100 - i * 10,
  })),
  custom: [{ label: "1", min: 0, max: 100 }],
};

type Props = {
  classDataMap: Record<string, ClassData>;
  currentClassId: string;
  onClose: () => void;
  onCreate: (classId: string, topic: Topic) => void;
};

export default function NewTopicModal({
  classDataMap,
  currentClassId,
  onClose,
  onCreate,
}: Props) {
  const [classId, setClassId] = useState(currentClassId);
  const [name, setName] = useState("");
  const [color, setColor] = useState<TopicColor>("orange");
  const [inputMode, setInputMode] = useState<InputMode>("score");
  const [weightMode, setWeightMode] = useState<WeightMode>("weighted");
  const [weightPercent, setWeightPercent] = useState(20);
  const [scaleKind, setScaleKind] = useState<GradingScale>("letter_plus");
  const [rows, setRows] = useState<ScaleRow[]>(DEFAULT_SCALES.letter_plus);

  function chooseScale(kind: GradingScale) {
    setScaleKind(kind);
    setRows([...DEFAULT_SCALES[kind]]);
  }

  function updateRow(i: number, patch: Partial<ScaleRow>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function removeRow(i: number) {
    setRows((rs) => rs.filter((_, idx) => idx !== i));
  }

  function addRow() {
    setRows((rs) => [...rs, { label: "Yangi", min: 0, max: 0 }]);
  }

  function submit() {
    if (!name.trim()) return;
    const topic: Topic = {
      id: `topic-${Date.now()}`,
      name: name.trim(),
      color,
      weightPercent: weightMode === "weighted" ? weightPercent : 0,
      inputMode,
      passLabel: "Bajardi",
      failLabel: "Bajarmadi",
    };
    onCreate(classId, topic);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex max-h-[90vh]">
        {/* Chap yo'riqnoma */}
        <aside className="w-[260px] shrink-0 bg-muted/30 border-r border-border p-5 overflow-y-auto scrollbar-thin">
          <button
            onClick={onClose}
            className="size-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors cursor-pointer mb-3"
            aria-label="Yopish"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
          <h2 className="text-xl font-extrabold text-foreground mb-2">
            Mavzular
          </h2>
          <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
            Topshiriqlarni guruhlarga ajrating va har birining baholash usulini
            tanlang.
          </p>

          <Section title="KIRITISH USULI">
            <Hint
              title="Ball"
              tag="23/25"
              text="Raqamli ball kiriting — tizim avtomatik harf bahosini chiqaradi. Yakuniy bahoga qo'shiladigan ishlar uchun yaxshi."
            />
            <Hint
              title="Tanlash"
              tag="O'TDI / O'TMADI"
              tagClass="text-green-700 bg-green-100"
              text="Shkaladan yorliqni tanlang. Sifat baholar uchun (faollik, ishtirok va h.k.) qulay."
            />
          </Section>

          <Section title="VAZN">
            <Hint
              icon={<Scale className="size-3.5 text-blue-500" />}
              title="Vaznli"
              tag="20%"
              text="Yakuniy bahoga aniq foiz qo'shadi. Asosiy testlar, esselar, loyihalar uchun."
            />
            <Hint
              icon={<Ban className="size-3.5 text-muted-foreground" />}
              title="Vaznsiz"
              text="Jurnalga yoziladi, lekin yakuniy bahoga ta'sir qilmaydi. Mashq, formativ tekshiruv yoki qo'shimcha ishlar uchun."
            />
          </Section>
        </aside>

        {/* O'ng forma */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="px-6 py-5 border-b border-border">
            <h3 className="text-lg font-bold text-foreground">Yangi mavzu</h3>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 flex flex-col gap-5">
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="h-10 px-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-foreground/30 cursor-pointer"
            >
              {Object.entries(classDataMap).map(([id, cd]) => (
                <option key={id} value={id}>
                  {cd.info.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="masalan: Testlar, Uy vazifasi, Loyihalar"
                className="flex-1 h-10 px-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-foreground/30"
              />
              <ColorPicker selected={color} onSelect={setColor} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="KIRITISH USULI" hint>
                <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg">
                  <ToggleBtn
                    selected={inputMode === "select"}
                    onClick={() => setInputMode("select")}
                  >
                    Tanlash
                  </ToggleBtn>
                  <ToggleBtn
                    selected={inputMode === "score"}
                    onClick={() => setInputMode("score")}
                  >
                    Ball
                  </ToggleBtn>
                </div>
              </Field>

              <Field label="BAHOLASH SHKALASI">
                <select
                  value={scaleKind}
                  onChange={(e) => chooseScale(e.target.value as GradingScale)}
                  className="h-10 px-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-foreground/30 cursor-pointer"
                >
                  {Object.entries(SCALE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <Field label="VAZN">
                <select
                  value={weightMode}
                  onChange={(e) =>
                    setWeightMode(e.target.value as WeightMode)
                  }
                  className="h-10 px-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-foreground/30 cursor-pointer"
                >
                  <option value="weighted">Vaznli</option>
                  <option value="no_weight">Vaznsiz</option>
                </select>
              </Field>
              {weightMode === "weighted" && (
                <Field label="FOIZ">
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={weightPercent}
                      onChange={(e) =>
                        setWeightPercent(Number(e.target.value) || 0)
                      }
                      className="w-full h-10 pl-3 pr-8 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-foreground/30"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </Field>
              )}
            </div>

            {/* Shkala jadvali */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 px-3 py-2 bg-muted text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Yorliq</span>
                <span className="w-16 text-center">Min</span>
                <span className="w-4 text-center">—</span>
                <span className="w-16 text-center">Max</span>
                <span className="w-7" />
              </div>
              <div className="max-h-[180px] overflow-y-auto scrollbar-thin">
                {rows.map((r, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 px-3 py-1.5 items-center border-t border-border first:border-t-0"
                  >
                    <input
                      value={r.label}
                      onChange={(e) => updateRow(i, { label: e.target.value })}
                      className="h-8 px-2 rounded border border-border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-foreground/30"
                    />
                    <input
                      type="number"
                      value={r.min}
                      onChange={(e) =>
                        updateRow(i, { min: Number(e.target.value) || 0 })
                      }
                      className="w-16 h-8 px-2 rounded border border-border bg-card text-sm text-center focus:outline-none focus:ring-1 focus:ring-foreground/30"
                    />
                    <span className="w-4 text-center text-muted-foreground">—</span>
                    <input
                      type="number"
                      value={r.max}
                      onChange={(e) =>
                        updateRow(i, { max: Number(e.target.value) || 0 })
                      }
                      className="w-16 h-8 px-2 rounded border border-border bg-card text-sm text-center focus:outline-none focus:ring-1 focus:ring-foreground/30"
                    />
                    <button
                      onClick={() => removeRow(i)}
                      className="size-7 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center cursor-pointer"
                      aria-label="O'chirish"
                    >
                      <Trash2 className="size-3.5 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addRow}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer border-t border-border"
              >
                <Plus className="size-3.5" />
                Qator qo&apos;shish
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20">
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 h-9 text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              onClick={submit}
              disabled={!name.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-4 h-9 text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Yaratish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
        {title}
      </h4>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Hint({
  icon,
  title,
  tag,
  tagClass,
  text,
}: {
  icon?: React.ReactNode;
  title: string;
  tag?: string;
  tagClass?: string;
  text: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-xs font-semibold text-foreground">{title}</span>
        </div>
        {tag && (
          <span
            className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded",
              tagClass ?? "text-amber-700 bg-amber-100"
            )}
          >
            {tag}
          </span>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        {label}
        {hint && <Info className="size-3" />}
      </label>
      {children}
    </div>
  );
}

function ToggleBtn({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-8 rounded-md text-sm font-semibold transition-all cursor-pointer",
        selected
          ? "bg-foreground text-background shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function ColorPicker({
  selected,
  onSelect,
}: {
  selected: TopicColor;
  onSelect: (c: TopicColor) => void;
}) {
  const [open, setOpen] = useState(false);
  const tc = TOPIC_COLORS[selected];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn("size-10 rounded-lg cursor-pointer", tc.dot)}
        aria-label="Rang tanlash"
      />
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 bg-card border border-border rounded-xl shadow-lg p-2 grid grid-cols-4 gap-1.5">
            {TOPIC_COLOR_ORDER.map((c) => (
              <button
                key={c}
                onClick={() => {
                  onSelect(c);
                  setOpen(false);
                }}
                className={cn(
                  "size-7 rounded-md cursor-pointer transition-transform hover:scale-110",
                  TOPIC_COLORS[c].dot,
                  c === selected && "ring-2 ring-foreground ring-offset-2 ring-offset-card"
                )}
                aria-label={c}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
