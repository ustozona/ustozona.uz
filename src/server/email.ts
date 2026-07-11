import "server-only";
import { Resend } from "resend";

/* ════════════════════════════════════════════════════════════════════
   EMAIL — Resend orqali yuboriladigan tizim xatlari (parolni tiklash va h.k.)
   RESEND_API_KEY yoʻq boʻlsa, yuborish oʻrniga konsolga link chiqadi —
   lokal ishlab chiqishda API kalitsiz ham oqimni sinash mumkin.
   ════════════════════════════════════════════════════════════════════ */

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendResetPasswordEmail(to: string, url: string) {
  if (!resend) {
    console.log(`[email] RESEND_API_KEY yoʻq — parolni tiklash havolasi (${to}):\n${url}`);
    return;
  }
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "Ustozona <onboarding@resend.dev>",
    to,
    subject: "Parolni tiklash — Ustozona",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Parolni tiklash</h2>
        <p>Hisobingiz uchun parolni tiklash soʻrovi yuborildi. Quyidagi tugma orqali yangi parol oʻrnatishingiz mumkin:</p>
        <p style="margin: 24px 0;">
          <a href="${url}" style="background:#111827;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;">
            Parolni tiklash
          </a>
        </p>
        <p style="color:#6b7280;font-size:13px;">Agar bu soʻrovni siz yubormagan boʻlsangiz, bu xatni eʼtiborsiz qoldiring.</p>
      </div>
    `,
  });
  if (error) {
    console.error(`[email] Resend xatosi (${to}):`, error);
    return;
  }
  console.log(`[email] Yuborildi (${to}), id: ${data?.id}`);
}
