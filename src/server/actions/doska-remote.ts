"use server";

import { z } from "zod";
import QRCode from "qrcode";
import { headers } from "next/headers";
import { requireTeacher } from "@/server/session";
import { realtimeConfig } from "@/server/realtime/config";
import { buildSheetPlan } from "@/server/dal/baholash-sheets";
import { signScanTicket } from "@/server/baholash/scan-ticket";
import { isConfigured } from "@/server/lessonlab/baholash";
import { newRemoteTicket, verifyRemoteTicket } from "@/server/remote/remote-ticket";
import { saveActiveRemote } from "@/server/dal/doska-remote";

/* ════════════════════════════════════════════════════════════════════
   USTOZ PULTI — server amallari (docs/ustoz-pulti-spec.md).

   ⚠️ "use server" fayl — tip eksport qilinmaydi (AGENTS.md). Qaytish
   shakllari shu yerda inline; mijoz `Awaited<ReturnType<…>>` bilan oladi.

   Ikki kirish yoʻli, bitta chipta:
     1. Doskadagi QR → `/pult/<chipta>` (telefonda kirish shart emas);
     2. Telefonda Ustozona'ga kirgan oʻqituvchi (ilova, brauzer) →
        `/pult` — oxirgi ochilgan Doskaga QR'siz ulanadi
        (`teachers.prefs.doskaRemote`).
   ════════════════════════════════════════════════════════════════════ */

async function originFromHeaders(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Doska: yangi pult kanali — QR, havola va realtime sozlamasi. */
export async function startDoskaRemoteAction() {
  const teacher = await requireTeacher();
  const config = realtimeConfig();
  if (!config) return { ok: false as const, reason: "realtime" as const };

  const { ticket, topic, exp } = newRemoteTicket(teacher.id);
  const url = `${await originFromHeaders()}/pult/${ticket}`;

  // Telefonda kirgan oʻqituvchi `/pult` dan QR'siz ulanishi uchun — oxirgi Doska.
  await saveActiveRemote(teacher.id, ticket, exp);

  return {
    ok: true as const,
    topic,
    url,
    config,
    expiresAt: new Date(exp * 1000).toISOString(),
    // Ekrandan oʻqiladi — xato tuzatish eng past, modullar yirik (`createScanHandoffAction` qoidasi).
    qrSvg: await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "L" }),
  };
}

/** Telefonda kirgan oʻqituvchi — oxirgi Doskaning chiptasi (yaroqli boʻlsa). */
export async function myActiveRemoteAction(): Promise<string | null> {
  const teacher = await requireTeacher();
  const stored = (teacher.prefs as { doskaRemote?: { ticket?: unknown } } | null)?.doskaRemote?.ticket;
  if (typeof stored !== "string") return null;
  const parsed = verifyRemoteTicket(stored);
  return parsed && parsed.teacherId === teacher.id ? stored : null;
}

/** Telefon: chipta → kanal va realtime sozlamasi. Kirish talab qilinmaydi. */
export async function remoteConnectAction(ticket: string) {
  const parsed = verifyRemoteTicket(z.string().min(10).max(200).parse(ticket));
  const config = realtimeConfig();
  if (!parsed) return { ok: false as const, reason: "expired" as const };
  if (!config) return { ok: false as const, reason: "realtime" as const };
  return { ok: true as const, topic: parsed.topic, config, expiresAt: new Date(parsed.exp * 1000).toISOString() };
}

const scanSchema = z.object({
  ticket: z.string().min(10).max(200),
  setId: z.string().min(1).max(200),
  classId: z.string().min(1).max(200),
});

/**
 * Telefon: Doskadagi test uchun skaner chiptasi va jonli skaner rejasi.
 *
 * Pult chiptasi kimlikni beradi; test va sinf haqiqatan shu oʻqituvchiniki
 * ekani `buildSheetPlan` da tekshiriladi — Doskadan kelgan `setId` ga
 * koʻr-koʻrona ishonilmaydi. Toʻgʻri javoblar telefonga kelmaydi.
 */
export async function remoteScanTicketAction(input: z.infer<typeof scanSchema>) {
  const parsed = scanSchema.parse(input);
  const remote = verifyRemoteTicket(parsed.ticket);
  if (!remote) return { ok: false as const, reason: "expired" as const };
  let plan;
  try {
    plan = await buildSheetPlan(parsed.setId, parsed.classId, remote.teacherId);
  } catch {
    return { ok: false as const, reason: "not_found" as const };
  }
  return {
    ok: true as const,
    scanTicket: signScanTicket({ teacherId: remote.teacherId, setId: parsed.setId, classId: parsed.classId }),
    title: plan.title,
    className: plan.className,
    engineReady: isConfigured(),
    plan: { testRef: plan.testRef, questionCount: plan.questionCount, roster: plan.roster },
  };
}
