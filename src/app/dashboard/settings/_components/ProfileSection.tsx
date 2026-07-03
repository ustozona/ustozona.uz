"use client";

import * as React from "react";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  FileText,
  CheckCircle,
  Mail,
  CalendarDays,
  Building2,
  ChevronRight,
  Upload,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useLessonStore } from "@/store/useLessonStore";
import { useTaskStore } from "@/store/useTaskStore";
import { CLASS_DATA } from "@/lib/grades-data";
import { getAllStudents } from "@/lib/relations";
import { CLASS_COLOR_HEX, type ClassColor } from "@/lib/class-colors";
import { MONTHS_UZ } from "@/lib/localization";
import { SettingsGroup, SavedIndicator } from "./SettingsShared";

const ACADEMIC_YEARS = ["2024–2025", "2025–2026", "2026–2027"];
const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB

/** Google bilan kirilганда keladiган namuna rasm (data URI — tarmoqsiz, prototip uchun). */
const GOOGLE_SAMPLE_AVATAR =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%234285F4'/><stop offset='1' stop-color='%2334A853'/></linearGradient></defs><rect width='128' height='128' fill='url(%23g)'/><text x='50%' y='54%' font-family='Arial' font-size='64' fill='white' text-anchor='middle' dominant-baseline='middle'>O</text></svg>`
  );

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
  value,
  label,
  href,
}: {
  icon: React.ElementType;
  value: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-1 rounded-xl border border-border bg-card px-4 py-3.5 transition-colors hover:border-foreground/25 hover:bg-muted/40"
    >
      <div className="flex items-center justify-between">
        <Icon className="size-4 text-muted-foreground" strokeWidth={2} />
        <ChevronRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <span className="mt-1 text-2xl font-bold tracking-tight text-foreground tabular-nums">
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </Link>
  );
}

export default function ProfileSection() {
  const profile = useSettingsStore((s) => s.profile);
  const setProfile = useSettingsStore((s) => s.setProfile);
  const academicYear = useSettingsStore((s) => s.academicYear);
  const setAcademicYear = useSettingsStore((s) => s.setAcademicYear);

  const lessonCount = useLessonStore((s) => s.lessons.length);
  const taskCount = useTaskStore((s) => s.tasks.length);

  // Hidratsiya oldidan store sonlari farq qilishi mumkin — mount-gate.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const classCount = Object.keys(CLASS_DATA).length;
  const studentCount = getAllStudents().length;
  const avatarHex =
    CLASS_COLOR_HEX[(profile.avatarColor as ClassColor) ?? "orange"] ?? CLASS_COLOR_HEX.orange;

  const isGoogle = profile.provider === "google";
  const nameError = profile.name.trim().length === 0;
  const emailError = profile.email.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email);

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
      {/* Identifikatsiya */}
      <SettingsGroup
        title="Identifikatsiya"
        description="Ismingiz sidebar va bosh sahifadagi salomlashuvда koʻrinadi. Oʻzgarishlar avtomatik saqlanadi."
        action={<SavedIndicator signal={JSON.stringify(profile)} />}
      >
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card px-4 py-4 sm:flex-row sm:items-center">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <Avatar size="lg" className="size-16">
              {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile.name} />}
              <AvatarFallback
                className="text-xl font-semibold text-white"
                style={{ backgroundColor: avatarHex }}
              >
                {initialsOf(profile.name)}
              </AvatarFallback>
            </Avatar>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickFile}
            />
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="size-3.5" />
                {profile.avatarUrl ? "Oʻzgartirish" : "Rasm yuklash"}
              </Button>
              {profile.avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground"
                  aria-label="Rasmni olib tashlash"
                  onClick={() => setProfile({ avatarUrl: "" })}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="truncate text-base font-semibold text-foreground">{profile.name || "—"}</span>
            <span className="truncate text-sm text-muted-foreground">{profile.email}</span>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground">
                <Mail className="size-3.5 text-muted-foreground" />
                {isGoogle ? "Google" : "Email"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" />
                Aʼzo: {formatJoined(profile.joinedAt)}
              </span>
              {profile.school && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
                  <Building2 className="size-3.5" />
                  {profile.school}
                </span>
              )}
            </div>
            {isGoogle && !profile.avatarUrl && (
              <button
                type="button"
                onClick={() => setProfile({ avatarUrl: GOOGLE_SAMPLE_AVATAR })}
                className="mt-1 self-start text-xs text-primary underline-offset-2 hover:underline"
              >
                Google hisobingizdagi rasmni ishlatish
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Toʻliq ism</Label>
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
            <Input
              id="profile-email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ email: e.target.value })}
              placeholder="pochta@example.com"
              aria-invalid={emailError}
            />
            {emailError && <p className="text-xs text-destructive">Email formati notoʻgʻri.</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-school">Maktab / muassasa</Label>
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

      {/* Akademik statistika */}
      <SettingsGroup
        title="Akademik statistika"
        description={`Joriy ${academicYear} oʻquv yili boʻyicha umumiy koʻrsatkichlar.`}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={GraduationCap} value={mounted ? classCount : "—"} label="Sinf" href="/dashboard/classes" />
          <StatCard icon={Users} value={mounted ? studentCount : "—"} label="Oʻquvchi" href="/dashboard/students" />
          <StatCard icon={FileText} value={mounted ? lessonCount : "—"} label="Dars" href="/dashboard/lessons" />
          <StatCard icon={CheckCircle} value={mounted ? taskCount : "—"} label="Topshiriq" href="/dashboard/tasks" />
        </div>
      </SettingsGroup>

      {/* Oʻquv yili */}
      <SettingsGroup title="Oʻquv yili" description="Koʻrsatkichlar va hisobotlar shu davrga moslanadi.">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">Faol oʻquv yili</span>
            <span className="text-xs text-muted-foreground">Header'dagi yil tanlagichi bilan sinxron.</span>
          </div>
          <Select value={academicYear} onValueChange={setAcademicYear}>
            <SelectTrigger className="w-36" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACADEMIC_YEARS.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </SettingsGroup>
    </>
  );
}
