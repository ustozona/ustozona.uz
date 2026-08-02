"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Pencil, Trash2, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BirthDatePicker } from "@/components/ui/birth-date-picker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSettingsStore } from "@/store/useSettingsStore";
import { CLASS_COLOR_HEX, type ClassColor } from "@/lib/class-colors";
import { MONTHS_UZ } from "@/lib/localization";
import { SettingsCard, useDraft, useRegisterDraft } from "./SettingsShared";

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

export default function ProfileSection() {
  const t = useTranslations("ProfileSection");
  const profile = useSettingsStore((s) => s.profile);
  const setProfile = useSettingsStore((s) => s.setProfile);
  const avatarHex =
    CLASS_COLOR_HEX[(profile.avatarColor as ClassColor) ?? "orange"] ?? CLASS_COLOR_HEX.orange;

  const isGoogle = profile.provider === "google";

  // Faqat forma maydonlari draft'da — avatar darhol saqlanadi (subset,
  // aks holda dirty draft'ni saqlash avatar oʻzgarishini bosib ketardi).
  const formValues = React.useMemo(
    () => ({
      name: profile.name,
      school: profile.school,
      subject: profile.subject,
      birthDate: profile.birthDate,
    }),
    [profile.name, profile.school, profile.subject, profile.birthDate]
  );
  const { draft, setDraft, dirty, save, reset } = useDraft(formValues, setProfile);
  const nameError = draft.name.trim().length === 0;
  useRegisterDraft("profil-forma", dirty, save, reset, !nameError);

  const fileRef = React.useRef<HTMLInputElement>(null);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // bir xil faylni qayta tanlashga ruxsat
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("toastImageOnly"));
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error(t("toastImageTooLarge"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfile({ avatarUrl: String(reader.result) });
      toast.success(t("toastAvatarUpdated"));
    };
    reader.onerror = () => toast.error(t("toastReadError"));
    reader.readAsDataURL(file);
  };

  return (
    <>
      {/* Asosiy maʼlumotlar */}
      <SettingsCard
        title={t("title")}
        description={t("description")}
      >
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/20 px-5 py-5 sm:flex-row sm:items-start">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label={t("changePhotoAria")}
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
                  {t("removePhoto")}
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
                  <TooltipContent>{t("googleVerified")}</TooltipContent>
                </Tooltip>
              )}
            </div>
            <span className="mt-0.5 text-xs text-muted-foreground">
              {t("joined", { date: formatJoined(profile.joinedAt) })}
              {profile.school && ` · ${profile.school}`}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">{t("nameLabel")}</Label>
            <Input
              id="profile-name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder={t("namePlaceholder")}
              aria-invalid={nameError}
            />
            {nameError && <p className="text-xs text-destructive">{t("nameError")}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-email">{t("emailLabel")}</Label>
            <Input id="profile-email" type="email" value={profile.email} readOnly disabled />
            <p className="text-xs text-muted-foreground">
              {isGoogle ? t("emailGoogleNote") : t("emailManualNote")}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-school">{t("schoolLabel")}</Label>
            <Input
              id="profile-school"
              value={draft.school}
              onChange={(e) => setDraft({ ...draft, school: e.target.value })}
              placeholder={t("schoolPlaceholder")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-subject">{t("subjectLabel")}</Label>
            <Input
              id="profile-subject"
              value={draft.subject}
              onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
              placeholder={t("subjectPlaceholder")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-birth-date" className="flex items-center gap-1.5">
              {t("birthDateLabel")}
              <span className="text-xs font-normal text-muted-foreground">{t("optional")}</span>
            </Label>
            <BirthDatePicker value={draft.birthDate} onChange={(v) => setDraft({ ...draft, birthDate: v })} />
          </div>
        </div>
      </SettingsCard>
    </>
  );
}
