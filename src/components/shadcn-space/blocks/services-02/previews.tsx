"use client";

/**
 * Akkordeon yonidagi mini-koʻrinishlar — SKRINSHOT EMAS.
 *
 * Nega kod: rasm eskiradi (UI oʻzgarsa qayta olish kerak), dark mode'da
 * ishlamaydi va yuklanadi. Bu bloklar dizayn-tizimi tokenlaridan yasalgan,
 * shuning uchun tema bilan birga oʻzi moslashadi va hajmi nol.
 * Konsepsiyani koʻrsatadi — piksel-aniq nusxa emas.
 */

import { CLASS_COLOR_BASE } from "@/lib/class-colors";
import { Check, Clock, FileText, Minus, Plus, X } from "lucide-react";

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col gap-4">
    {children}
  </div>
);

const Row = ({ name, children }: { name: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-sm font-medium text-foreground truncate">{name}</span>
    <div className="flex items-center gap-2 shrink-0">{children}</div>
  </div>
);

/** Baho katagi — past qizil, oʻrta sariq, yuqori yashil (shartli ranglash). */
const Cell = ({ v }: { v: number }) => {
  const tone =
    v >= 4
      ? { bg: "var(--success)", fg: "var(--success-foreground)" }
      : v === 3
        ? { bg: "var(--warning)", fg: "var(--warning-foreground)" }
        : { bg: "var(--destructive)", fg: "var(--destructive-foreground)" };
  return (
    <span
      className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-semibold tabular-nums"
      style={{ backgroundColor: tone.bg, color: tone.fg }}
    >
      {v}
    </span>
  );
};

const JurnalPreview = () => (
  <Frame>
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-foreground">9-A · Algebra</span>
      <span className="text-xs text-muted-foreground">Oʻrtacha 4.1</span>
    </div>
    <Row name="Laylo Karimova">
      <Cell v={5} />
      <Cell v={4} />
      <Cell v={5} />
    </Row>
    <Row name="Bekzod Rasulov">
      <Cell v={3} />
      <Cell v={4} />
      <Cell v={4} />
    </Row>
    <Row name="Jasur Toʻrayev">
      <Cell v={2} />
      <Cell v={3} />
      <Cell v={3} />
    </Row>
  </Frame>
);

const DavomatPreview = () => (
  <Frame>
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-foreground">14-oktabr</span>
      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
        Hammasi keldi
      </span>
    </div>
    {[
      { name: "Laylo Karimova", icon: Check, bg: "var(--success)", fg: "var(--success-foreground)" },
      { name: "Bekzod Rasulov", icon: Clock, bg: "var(--warning)", fg: "var(--warning-foreground)" },
      { name: "Jasur Toʻrayev", icon: Check, bg: "var(--success)", fg: "var(--success-foreground)" },
      { name: "Dilnoza Aliyeva", icon: X, bg: "var(--destructive)", fg: "var(--destructive-foreground)" },
    ].map((s) => (
      <Row key={s.name} name={s.name}>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: s.bg, color: s.fg }}
        >
          <s.icon className="h-4 w-4" strokeWidth={3} />
        </span>
      </Row>
    ))}
  </Frame>
);

const XulqPreview = () => (
  <Frame>
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-foreground">Xulq bali</span>
      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
        avtomatik
      </span>
    </div>
    {[
      { name: "Laylo Karimova", delta: +6, why: "davomat toʻliq" },
      { name: "Bekzod Rasulov", delta: -2, why: "2 marta kechikdi" },
      { name: "Jasur Toʻrayev", delta: -4, why: "vazifa topshirilmadi" },
    ].map((s) => {
      const up = s.delta > 0;
      return (
        <div key={s.name} className="flex items-center justify-between gap-3">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-foreground truncate">{s.name}</span>
            <span className="text-xs text-muted-foreground truncate">{s.why}</span>
          </div>
          <span
            className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold tabular-nums shrink-0"
            style={{
              backgroundColor: up
                ? "color-mix(in oklch, var(--success) 15%, var(--card))"
                : "color-mix(in oklch, var(--destructive) 15%, var(--card))",
              color: up ? "var(--success)" : "var(--destructive)",
            }}
          >
            {up ? <Plus className="h-3.5 w-3.5" strokeWidth={3} /> : <Minus className="h-3.5 w-3.5" strokeWidth={3} />}
            {Math.abs(s.delta)}
          </span>
        </div>
      );
    })}
  </Frame>
);

const JadvalPreview = () => {
  const slots: ({ label: string; color: keyof typeof CLASS_COLOR_BASE } | null)[] = [
    { label: "9-A", color: "blue" },
    { label: "10-B", color: "teal" },
    null,
    { label: "11-V", color: "violet" },
    null,
    { label: "8-G", color: "orange" },
    { label: "9-A", color: "blue" },
    null,
    { label: "10-B", color: "teal" },
  ];
  return (
    <Frame>
      <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground">
        <span>Dush</span>
        <span>Sesh</span>
        <span>Chor</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot, i) =>
          slot ? (
            <span
              key={i}
              className="flex h-12 items-center justify-center rounded-md text-sm font-semibold"
              style={{
                backgroundColor: `color-mix(in oklch, ${CLASS_COLOR_BASE[slot.color]} 16%, var(--card))`,
                color: CLASS_COLOR_BASE[slot.color],
              }}
            >
              {slot.label}
            </span>
          ) : (
            <span key={i} className="h-12 rounded-md border border-dashed border-border" />
          ),
        )}
      </div>
    </Frame>
  );
};

const MuharrirPreview = () => (
  <Frame>
    <div className="h-3.5 w-2/3 rounded bg-foreground/80" />
    <div className="flex flex-col gap-2">
      <div className="h-2 w-full rounded bg-muted-foreground/25" />
      <div className="h-2 w-full rounded bg-muted-foreground/25" />
      <div className="h-2 w-4/5 rounded bg-muted-foreground/25" />
      <div className="h-2 w-full rounded bg-muted-foreground/25" />
      <div className="h-2 w-3/5 rounded bg-muted-foreground/25" />
    </div>
    <span className="mt-1 flex w-fit items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-1.5">
      <FileText className="size-4 text-destructive" aria-hidden />
      <span className="text-sm font-medium text-destructive">A4 PDF</span>
    </span>
  </Frame>
);

export const SERVICE_PREVIEWS: Record<string, React.ComponentType> = {
  jurnal: JurnalPreview,
  davomat: DavomatPreview,
  xulq: XulqPreview,
  jadval: JadvalPreview,
  muharrir: MuharrirPreview,
};
