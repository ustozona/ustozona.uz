"use client";

import * as React from "react";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  BookOpen,
  ClipboardList,
  Pencil,
  Trash2,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { isCalendarConfigured } from "@/lib/academic-calendar";
import { useLessonStore } from "@/store/useLessonStore";
import { useTaskStore } from "@/store/useTaskStore";
import { useGradesStore } from "@/store/useGradesStore";
import { CLASS_COLOR_HEX, type ClassColor, classTints } from "@/lib/class-colors";
import { MONTHS_UZ } from "@/lib/localization";
import { cn } from "@/lib/utils";
import { SettingsGroup, SaveSignalPing } from "./SettingsShared";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB

function initialsOf(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function formatJoined(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  if (!y || !m) return iso;
  return `${MONTHS_UZ[m - 1]} ${y}`;
}

function StatCard({
  icon: Icon,
  color,
  value,
  label,
  href,
}: {
  icon: React.ElementType;
  color: ClassColor;
  value: React.ReactNode;
  label: string;
  href: string;
}) {
  const tints = classTints(color);
  const style = {
    ["--stat-border" as string]: (tints.softBorder as React.CSSProperties).borderColor,
    ["--stat-border-hover" as string]: (tints.ring as React.CSSProperties).borderColor,
    ["--stat-bg" as string]: (tints.surface as React.CSSProperties).backgroundColor,
    ["--stat-bg-hover" as string]: (tints.tint as React.CSSProperties).backgroundColor,
  } as React.CSSProperties;
  return (
    <Link
      href={href}
      style={style}
      className="group flex flex-col gap-3 rounded-xl border border-[var(--stat-border)] bg-[var(--stat-bg)] px-4 py-4 transition-colors hover:border-[var(--stat-border-hover)] hover:bg-[var(--stat-bg-hover)]"
    >
      <div className="flex items-center gap-2">
        <div
          style={tints.iconBg}
          className="flex size-7 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110"
        >
          <Icon className="size-4" style={tints.iconText} strokeWidth={2} />
        </div>
        <span className="heading-small">{label}</span>
      </div>
      <span className="heading-page tabular-nums">
        {value} <span className="text-body font-normal text-muted-foreground">ta</span>
      </span>
    </Link>
  );
}

export default function ProfileSection() {
  const profile = useSettingsStore((s) => s.profile);
  const setProfile = useSettingsStore((s) => s.setProfile);
  const calendar = useCalendarStore((s) => s.calendar);
  const configured = isCalendarConfigured(calendar);
  const yearLabel = calendar.yearLabel;

  const lessonCount = useLessonStore((s) => s.lessons.length);
  const taskCount = useTaskStore((s) => s.tasks.length);

  // Hidratsiya oldidan store sonlari farq qilishi mumkin — mount-gate.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const classDataMap = useGradesStore((s) => s.classDataMap);
  const classCount = Object.keys(classDataMap).length;
  const studentCount = Object.values(classDataMap).reduce((n, cd) => n + cd.students.length, 0);
  const avatarHex =
    CLASS_COLOR_HEX[(profile.avatarColor as ClassColor) ?? "orange"] ?? CLASS_COLOR_HEX.orange;

  const isGoogle = profile.provider === "google";
  const nameError = profile.name.trim().length === 0;

  const fileRef = React.useRef<HTMLInputElement>(null);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // bir xil faylni qayta tanlashga ruxsat
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Faqat rasm fayli yuklang.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Rasm hajmi 2MB dan oshmasin.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfile({ avatarUrl: String(reader.result) });
      toast.success("Profil rasmi yangilandi.");
    };
    reader.onerror = () => toast.error("Rasmni oʻqib boʻlmadi.");
    reader.readAsDataURL(file);
  };

  return (
    <>
      {/* Asosiy maʼlumotlar */}
      <SettingsGroup
        title="Asosiy maʼlumotlar"
        description="Ismingiz yon panel (sidebar) hamda bosh sahifadagi salomlashuv matnida aks etadi. Oʻzgarishlar avtomatik ravishda saqlanadi."
        action={<SaveSignalPing signal={JSON.stringify(profile)} />}
      >
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card px-5 py-5 sm:flex-row sm:items-start">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Rasmni oʻzgartirish"
            className="group relative size-20 shrink-0 self-center overflow-hidden rounded-full sm:self-start"
          >
            <Avatar className="size-20">
              {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile.name} />}
              <AvatarFallback
                className="text-2xl font-semibold text-white"
                style={{ backgroundColor: avatarHex }}
              >
                {initialsOf(profile.name)}
              </AvatarFallback>
            </Avatar>
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Pencil className="size-5 text-white" strokeWidth={2} />
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickFile}
            />
          </button>

          <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:justify-start">
              <span className="truncate text-lg font-semibold text-foreground">{profile.name || "—"}</span>
              {profile.avatarUrl && (
                <button
                  type="button"
                  onClick={() => setProfile({ avatarUrl: "" })}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
                >
                  <Trash2 className="size-3.5" />
                  Rasmni olib tashlash
                </button>
              )}
            </div>
            <div className="flex items-center justify-center gap-1 sm:justify-start">
              <span className="truncate text-sm text-muted-foreground">{profile.email}</span>
              {isGoogle && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <BadgeCheck className="size-4 shrink-0 text-info" />
                  </TooltipTrigger>
                  <TooltipContent>Google orqali tasdiqlangan</TooltipContent>
                </Tooltip>
              )}
            </div>
            <span className="mt-0.5 text-xs text-muted-foreground">
              Aʼzo: {formatJoined(profile.joinedAt)}
              {profile.school && ` · ${profile.school}`}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Ism va familiya</Label>
            <Input
              id="profile-name"
              value={profile.name}
              onChange={(e) => setProfile({ name: e.target.value })}
              placeholder="Ism familiya"
              aria-invalid={nameError}
            />
            {nameError && <p className="text-xs text-destructive">Ism boʻsh boʻlmasin.</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" type="email" value={profile.email} readOnly disabled />
            <p className="text-xs text-muted-foreground">
              {isGoogle ? "Ushbu maʼlumot Google hisobingiz orqali boshqariladi." : "Kirish uchun ishlatiladi, shu yerdan oʻzgartirib boʻlmaydi."}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-school">Taʼlim muassasasi / Maktab</Label>
            <Input
              id="profile-school"
              value={profile.school}
              onChange={(e) => setProfile({ school: e.target.value })}
              placeholder="Masalan: 24-maktab"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-subject">Fan</Label>
            <Input
              id="profile-subject"
              value={profile.subject}
              onChange={(e) => setProfile({ subject: e.target.value })}
              placeholder="Masalan: Ingliz tili"
            />
          </div>
        </div>
      </SettingsGroup>

      {/* Oʻquv statistikasi */}
      <SettingsGroup
        title="Oʻquv statistikasi"
        description={
          configured ? (
            <>
              <Link href="/dashboard/settings?section=oquv-yili" className="font-medium text-foreground underline-offset-2 hover:underline">
                {yearLabel}
              </Link>{" "}
              oʻquv yili uchun umumiy koʻrsatkichlar.
            </>
          ) : (
            <>
              Umumiy koʻrsatkichlar (
              <Link href="/dashboard/settings?section=oquv-yili" className="font-medium text-foreground underline-offset-2 hover:underline">
                oʻquv yili hali sozlanmagan
              </Link>
              ).
            </>
          )
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={GraduationCap}
            color="amber"
            value={mounted ? classCount : "—"}
            label="Sinflar"
            href="/dashboard/classes"
          />
          <StatCard
            icon={Users}
            color="violet"
            value={mounted ? studentCount : "—"}
            label="Oʻquvchilar"
            href="/dashboard/students"
          />
          <StatCard
            icon={BookOpen}
            color="sky"
            value={mounted ? lessonCount : "—"}
            label="Darslar"
            href="/dashboard/lessons"
          />
          <StatCard
            icon={ClipboardList}
            color="green"
            value={mounted ? taskCount : "—"}
            label="Topshiriqlar"
            href="/dashboard/tasks"
          />
        </div>
      </SettingsGroup>
    </>
  );
}
