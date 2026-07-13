"use client";

import * as React from "react";
import { MoveRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { BehaviorAutoSettings } from "@/lib/behavior-data";
import { SettingsList } from "@/app/dashboard/settings/_components/SettingsShared";

/* Xulq avto-ballari muharriri — controlled (value/onChange), draft'ni host
   boshqaradi (Sozlamalar > Xulq kartasi yoki xulq sahifasidagi modal).

   Struktura: har manba (Davomat / Jurnal) master-qator + faqat ON boʻlganda
   koʻrinadigan indent bola-qatorlar (progressive disclosure). Seriya qoidasi
   gap shaklida ("5 dars ketma-ket → +2 bonus") — ikkita nomsiz select
   chalgʻitmasin. Vazn falsafasi: avto ballar past (±1..±2), qoʻlda pedagogik
   ballar yuqori. Toggle OFF tarixni oʻchirmaydi. */

/** Ball rangi — musbat yashil, manfiy qizil (davomat IMPACT_SIGN_CLS patterni). */
const pointCls = (v: number) => (v > 0 ? "text-success" : "text-destructive");

/** Ball qiymati tanlagichi — musbatga "+" qoʻshiladi, rang belgi boʻyicha. */
function PointsSelect({
  value,
  options,
  onChange,
  disabled,
  ariaLabel,
}: {
  value: number;
  options: number[];
  onChange: (v: number) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger
        className={cn("w-20 font-medium tabular-nums", !disabled && pointCls(value))}
        size="sm"
        disabled={disabled}
        aria-label={ariaLabel}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={String(o)} className={cn("tabular-nums", pointCls(o))}>
            {o > 0 ? `+${o}` : String(o)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Dars soni tanlagichi — neytral, "+"siz, "N dars" koʻrinishida. */
function LessonCountSelect({
  value,
  options,
  onChange,
  disabled,
  ariaLabel,
}: {
  value: number;
  options: number[];
  onChange: (v: number) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="w-24 tabular-nums" size="sm" disabled={disabled} aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={String(o)} className="tabular-nums">
            {o} dars
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Deterministik namuna-hafta — faol qoidalardan jonli hisob. */
function weekExample(v: BehaviorAutoSettings): { parts: string[]; total: number } | null {
  const parts: string[] = [];
  let total = 0;
  if (v.attendanceEnabled) {
    if (v.presentEnabled) {
      parts.push(`2 kelgan dars (+${v.presentPoints * 2})`);
      total += v.presentPoints * 2;
    }
    parts.push(`1 kechikish (${v.latePoints})`);
    total += v.latePoints;
  }
  if (v.journalEnabled) {
    parts.push(`1 baholangan topshiriq (+${v.gradedPoints})`);
    total += v.gradedPoints;
  }
  if (parts.length === 0) return null;
  return { parts, total };
}

export default function AutoPointsEditor({
  value,
  onChange,
}: {
  value: BehaviorAutoSettings;
  onChange: (next: BehaviorAutoSettings) => void;
}) {
  const patch = (partial: Partial<BehaviorAutoSettings>) =>
    onChange({ ...value, ...partial });

  const att = value.attendanceEnabled;
  const jrn = value.journalEnabled;
  const example = weekExample(value);

  return (
    <>
      {/* ── Davomat manbasi ─────────────────────────────────────── */}
      <SettingsList
        items={[
          {
            key: "att-master",
            title: "Davomatdan avto-ballar",
            description: "Kechikish va sababsiz kelmaslik xulq balliga avtomatik taʼsir qiladi",
            multiline: true,
            trailing: (
              <Switch
                checked={att}
                onCheckedChange={(on) => patch({ attendanceEnabled: on })}
                aria-label="Davomatdan avto-ballarni yoqish"
              />
            ),
          },
          ...(!att
            ? []
            : [
                {
                  key: "late",
                  title: "Kechikdi",
                  indent: true,
                  trailing: (
                    <PointsSelect
                      value={value.latePoints}
                      options={[-1, -2, -3, -4, -5]}
                      onChange={(v) => patch({ latePoints: v })}
                      ariaLabel="Kechikish balli"
                    />
                  ),
                },
                {
                  key: "absent",
                  title: "Sababsiz kelmadi",
                  description: "Sababli kelmaslik ballga taʼsir qilmaydi",
                  indent: true,
                  multiline: true,
                  trailing: (
                    <PointsSelect
                      value={value.absentPoints}
                      options={[-1, -2, -3, -4, -5]}
                      onChange={(v) => patch({ absentPoints: v })}
                      ariaLabel="Sababsiz kelmaslik balli"
                    />
                  ),
                },
                {
                  key: "present",
                  title: "Har kelgan dars uchun",
                  description:
                    "Odatda oʻchiq (ball qadrsizlanadi) — davomati juda past sinflar uchun vaqtincha yoqish mumkin",
                  indent: true,
                  multiline: true,
                  dimmed: !value.presentEnabled,
                  trailing: (
                    <>
                      <PointsSelect
                        value={value.presentPoints}
                        options={[1, 2, 3]}
                        onChange={(v) => patch({ presentPoints: v })}
                        disabled={!value.presentEnabled}
                        ariaLabel="Kelgan dars balli"
                      />
                      <Switch
                        checked={value.presentEnabled}
                        onCheckedChange={(on) => patch({ presentEnabled: on })}
                        aria-label="Har kelgan dars uchun ballni yoqish"
                      />
                    </>
                  ),
                },
                {
                  key: "streak",
                  title: "Davomat seriyasi bonusi",
                  indent: true,
                  multiline: true,
                  dimmed: !value.streakEnabled,
                  description: (
                    <span className="flex flex-col gap-2">
                      <span>
                        Sababli kelmaslik seriyani buzmaydi (pauza). Boshlangʻich yoki kam
                        soatli fanga 3, yuqori sinfga 5 dars tavsiya etiladi.
                      </span>
                      {value.streakEnabled && (
                        <span className="flex flex-wrap items-center gap-2 text-sm text-foreground">
                          <LessonCountSelect
                            value={value.streakN}
                            options={[2, 3, 4, 5, 6, 7, 8, 10]}
                            onChange={(v) => patch({ streakN: v })}
                            ariaLabel="Seriya uzunligi (dars soni)"
                          />
                          <span className="text-muted-foreground">
                            ketma-ket toza davomat
                          </span>
                          <MoveRight className="size-3.5 text-muted-foreground" />
                          <PointsSelect
                            value={value.streakBonus}
                            options={[1, 2, 3, 4, 5]}
                            onChange={(v) => patch({ streakBonus: v })}
                            ariaLabel="Seriya bonusi"
                          />
                          <span className="text-muted-foreground">bonus</span>
                        </span>
                      )}
                    </span>
                  ),
                  trailing: (
                    <Switch
                      checked={value.streakEnabled}
                      onCheckedChange={(on) => patch({ streakEnabled: on })}
                      aria-label="Davomat seriyasi bonusini yoqish"
                    />
                  ),
                },
              ]),
        ]}
      />

      {/* ── Jurnal manbasi ──────────────────────────────────────── */}
      <SettingsList
        items={[
          {
            key: "jrn-master",
            title: "Jurnaldan avto-ballar",
            description:
              "Topshiriq baholanganda plus; topshirish muddati oʻtib katak boʻsh qolsa minus",
            multiline: true,
            trailing: (
              <Switch
                checked={jrn}
                onCheckedChange={(on) => patch({ journalEnabled: on })}
                aria-label="Jurnaldan avto-ballarni yoqish"
              />
            ),
          },
          ...(!jrn
            ? []
            : [
                {
                  key: "graded",
                  title: "Topshiriq baholandi",
                  description: "Baho qiymatidan qatʼi nazar — bajarganlik jarayon-signali",
                  indent: true,
                  multiline: true,
                  trailing: (
                    <PointsSelect
                      value={value.gradedPoints}
                      options={[1, 2, 3]}
                      onChange={(v) => patch({ gradedPoints: v })}
                      ariaLabel="Baholangan topshiriq balli"
                    />
                  ),
                },
                {
                  key: "due",
                  title: "Muddatida topshirilmadi",
                  description:
                    "Faqat muddat kiritilgan topshiriqlarga taalluqli; «Q» (qatnashmadi) belgilangan katakka minus yozilmaydi. Keyin baho qoʻyilsa minus olib tashlanadi.",
                  indent: true,
                  multiline: true,
                  trailing: (
                    <PointsSelect
                      value={value.missedDuePoints}
                      options={[-1, -2, -3]}
                      onChange={(v) => patch({ missedDuePoints: v })}
                      ariaLabel="Muddati oʻtgan topshiriq balli"
                    />
                  ),
                },
              ]),
        ]}
      />

      {/* Jonli misol — sozlama oʻzgarsa darhol qayta hisoblanadi */}
      {example && (
        <p className="text-caption leading-relaxed">
          <span className="font-medium text-foreground">Misol (bir hafta):</span>{" "}
          {example.parts.join(" + ")} ={" "}
          <span
            className={cn("font-semibold tabular-nums", pointCls(example.total || 1))}
          >
            {example.total > 0 ? `+${example.total}` : example.total} ball
          </span>
        </p>
      )}
    </>
  );
}
