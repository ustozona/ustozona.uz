"use client";

import * as React from "react";
import { toast } from "sonner";
import { Copy, Crown, LogOut, Plus, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  acceptWorkspaceInviteAction,
  createWorkspaceInviteAction,
  getWorkspaceAuditAction,
  getWorkspaceInvitesAction,
  getWorkspaceMembersAction,
  leaveWorkspaceAction,
  previewWorkspaceInviteAction,
  revokeWorkspaceInviteAction,
} from "@/server/actions/workspace";
import { SettingsCard } from "./SettingsShared";
import { DuplicateStudentsCard } from "./DuplicateStudentsCard";

/* ════════════════════════════════════════════════════════════════════
   JAMOA — hamkasblar va taklif kodlari (admin-lite kirish nuqtasi).

   ⚠️ Bu boʻlim `/dashboard/settings` da, `/admin` da EMAS. `/admin` —
   Ustozona jamoasining PLATFORMA paneli, butunlay boshqa oʻq
   (docs/ish-maydoni-arxitektura.md §11.1).

   ⭐ Yakka oʻqituvchi bu yerda «maktab» soʻzini koʻrmaydi: u faqat
   «Hamkasbni taklif qilish» tugmasini koʻradi. Maydon tushunchasi
   hamkasb qoʻshilgandan KEYIN paydo boʻladi (§1).
   ════════════════════════════════════════════════════════════════════ */

type Member = {
  teacherId: string;
  name: string;
  email: string;
  role: string;
  isMe: boolean;
};

type Invite = {
  id: string;
  code: string;
  role: string;
  expiresAt: Date;
  usedAt: Date | null;
  usedByName: string | null;
  revokedAt: Date | null;
};

const ROLE_LABEL: Record<string, string> = {
  owner: "Egasi",
  admin: "Maʼmuriyat",
  teacher: "Oʻqituvchi",
};

const AUDIT_LABEL: Record<string, string> = {
  "student.merge": "oʻquvchi yozuvlarini birlashtirdi",
  "class_teacher.add": "darsga oʻqituvchi biriktirdi",
  "class_teacher.remove": "darsdan oʻqituvchi chiqardi",
  "class.transfer_ownership": "sinf egaligini oʻtkazdi",
};

type AuditItem = {
  id: string;
  actorName: string;
  action: string;
  targetLabel: string | null;
  createdAt: Date;
};

export default function TeamSection() {
  const [members, setMembers] = React.useState<Member[] | null>(null);
  const [invites, setInvites] = React.useState<Invite[] | null>(null);
  const [audit, setAudit] = React.useState<AuditItem[] | null>(null);
  const [code, setCode] = React.useState("");
  const [confirming, setConfirming] = React.useState<{
    workspaceName: string;
    invitedByName: string;
    role: string;
  } | null>(null);
  const [leaving, setLeaving] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const load = React.useCallback(() => {
    getWorkspaceMembersAction()
      .then(setMembers)
      .catch(() => setMembers([]));
    /* Taklif roʻyxati faqat adminga ochiq — oddiy oʻqituvchida bu
       chaqiruv rad etiladi va roʻyxat shunchaki koʻrinmaydi. */
    getWorkspaceInvitesAction()
      .then(setInvites)
      .catch(() => setInvites(null));
    getWorkspaceAuditAction()
      .then(setAudit)
      .catch(() => setAudit(null));
  }, []);

  React.useEffect(load, [load]);

  const me = members?.find((m) => m.isMe);
  const canInvite = me?.role === "owner" || me?.role === "admin";
  const isSolo = (members?.length ?? 1) <= 1;

  const createInvite = (role: "admin" | "teacher") => {
    startTransition(async () => {
      try {
        const created = await createWorkspaceInviteAction({ role });
        await navigator.clipboard.writeText(created).catch(() => {});
        toast.success(`Kod: ${created}`, { description: "Nusxalandi — hamkasbingizga bering" });
        load();
      } catch {
        toast.error("Kod yaratilmadi");
      }
    });
  };

  const checkCode = () => {
    startTransition(async () => {
      try {
        setConfirming(await previewWorkspaceInviteAction({ code }));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Kod notoʻgʻri");
      }
    });
  };

  const accept = () => {
    setConfirming(null);
    startTransition(async () => {
      try {
        await acceptWorkspaceInviteAction({ code });
        setCode("");
        toast.success("Jamoaga qoʻshildingiz");
        load();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Qoʻshilib boʻlmadi");
      }
    });
  };

  const leave = () => {
    setLeaving(false);
    startTransition(async () => {
      try {
        await leaveWorkspaceAction();
        toast.success("Jamoadan chiqdingiz");
        load();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Chiqib boʻlmadi");
      }
    });
  };

  /* Server faqat FAOL kodlarni qaytaradi — "muddati oʻtdimi" render
     paytida hisoblanmaydi (DAL izohi). */
  const activeInvites = invites ?? [];

  return (
    <div className="space-y-4">
      <SettingsCard
        title="Hamkasblar"
        description={
          isSolo
            ? "Hozircha yolgʻiz ishlayapsiz. Hamkasbingizni taklif qilsangiz, oʻquvchilar roʻyxati umumiy boʻladi — har biringiz ismlarni qaytadan yozmaysiz."
            : "Bir xil oʻquvchilar ustida ishlaydigan oʻqituvchilar. Kim qaysi darsni oʻtishi sinf sahifasida belgilanadi."
        }
      >
        <div className="flex flex-col gap-1">
          {(members ?? []).map((m) => (
            <div
              key={m.teacherId}
              className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm text-foreground">{m.name}</span>
                  {m.isMe ? <Badge variant="secondary">Siz</Badge> : null}
                </div>
                <span className="truncate text-xs text-muted-foreground">{m.email}</span>
              </div>
              {m.role === "owner" ? (
                <Crown className="size-3.5 shrink-0 text-muted-foreground" />
              ) : null}
              {m.role === "admin" ? (
                <Shield className="size-3.5 shrink-0 text-muted-foreground" />
              ) : null}
              <span className="shrink-0 text-xs text-muted-foreground">
                {ROLE_LABEL[m.role] ?? m.role}
              </span>
            </div>
          ))}
        </div>

        {canInvite ? (
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button variant="outline" disabled={pending} onClick={() => createInvite("teacher")}>
              <Plus className="size-4" />
              Oʻqituvchini taklif qilish
            </Button>
            <Button variant="ghost" disabled={pending} onClick={() => createInvite("admin")}>
              <Shield className="size-4" />
              Maʼmuriyat huquqi bilan
            </Button>
          </div>
        ) : null}
      </SettingsCard>

      {canInvite && activeInvites.length > 0 ? (
        <SettingsCard
          title="Faol kodlar"
          description="Har kod bir marta ishlaydi va 7 kundan keyin oʻz-oʻzidan kuchini yoʻqotadi."
        >
          <div className="flex flex-col gap-1">
            {activeInvites.map((i) => (
              <div key={i.id} className="flex items-center gap-2 rounded-md px-2 py-2">
                <code className="font-mono text-sm tracking-widest text-foreground">
                  {i.code}
                </code>
                <span className="text-xs text-muted-foreground">
                  {ROLE_LABEL[i.role] ?? i.role}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto size-7"
                  aria-label="Nusxalash"
                  onClick={() => {
                    void navigator.clipboard.writeText(i.code);
                    toast.success("Nusxalandi");
                  }}
                >
                  <Copy className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await revokeWorkspaceInviteAction({ inviteId: i.id });
                      toast.success("Kod bekor qilindi");
                      load();
                    })
                  }
                >
                  Bekor qilish
                </Button>
              </div>
            ))}
          </div>
        </SettingsCard>
      ) : null}

      {/* Dublikat yoʻq boʻlsa oʻzi koʻrinmaydi. */}
      <DuplicateStudentsCard />

      <SettingsCard
        title="Taklif kodi bilan qoʻshilish"
        description="Hamkasbingiz bergan kodni kiriting."
      >
        <div className="flex flex-wrap gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCD2345"
            className="max-w-48 font-mono tracking-widest"
            maxLength={16}
          />
          <Button disabled={pending || code.trim().length < 4} onClick={checkCode}>
            Tekshirish
          </Button>
        </div>
      </SettingsCard>

      {canInvite && audit && audit.length > 0 ? (
        <SettingsCard
          title="Faoliyat tarixi"
          description="Jamoa aʼzoligi va oʻquvchi yozuvlariga tegishli oxirgi amallar."
        >
          <div className="flex flex-col gap-1">
            {audit.map((a) => (
              <div key={a.id} className="flex items-baseline gap-2 py-1 text-xs">
                <span className="text-foreground">{a.actorName}</span>
                <span className="text-muted-foreground">
                  {AUDIT_LABEL[a.action] ?? a.action}
                </span>
                {a.targetLabel ? (
                  <span className="truncate text-muted-foreground">— {a.targetLabel}</span>
                ) : null}
                <span className="ml-auto shrink-0 text-muted-foreground">
                  {a.createdAt.toLocaleDateString("uz-UZ")}
                </span>
              </div>
            ))}
          </div>
        </SettingsCard>
      ) : null}

      {!isSolo && me?.role !== "owner" ? (
        <SettingsCard
          title="Jamoadan chiqish"
          description="Siz shaxsiy maydoningizga qaytasiz."
          destructive
        >
          <p className="text-caption">
            ⚠️ Sinflar va oʻquvchilar jamoada QOLADI — ular umumiy yozuvlar. Siz qoʻygan
            baholar ham oʻchmaydi, lekin ularni koʻra olmaysiz.
          </p>
          <Button variant="destructive" disabled={pending} onClick={() => setLeaving(true)}>
            <LogOut className="size-4" />
            Chiqish
          </Button>
        </SettingsCard>
      ) : null}

      <AlertDialog open={confirming !== null} onOpenChange={(v) => !v && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>«{confirming?.workspaceName}» ga qoʻshilasizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              Taklif qildi: {confirming?.invitedByName}. Rol:{" "}
              {ROLE_LABEL[confirming?.role ?? ""] ?? confirming?.role}.
              {"\n"}
              ⚠️ Sinflaringiz va oʻquvchilaringiz shu jamoaga koʻchadi — hamkasblar ular
              bilan birga ishlay oladi. Bu amalni orqaga qaytarib boʻlmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={accept}>Qoʻshilaman</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={leaving} onOpenChange={setLeaving}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Jamoadan chiqasizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              Sinflar va oʻquvchilar jamoada qoladi. Siz boʻsh shaxsiy maydoningizga
              qaytasiz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={leave}>Chiqish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
