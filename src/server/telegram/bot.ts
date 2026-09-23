import "server-only";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { auth } from "@/server/auth";
import { db } from "@/server/db/client";
import { tgAuthRequests, tgChats, user, userTelegram } from "@/server/db/schema";
import { isPlaceholderEmail, telegramPlaceholderEmail } from "@/lib/placeholder-email";
import {
  answerCallbackQuery,
  editMessageText,
  esc,
  sendMessage,
  type TgCallbackQuery,
  type TgMessage,
  type TgUpdate,
  type TgUser,
} from "./api";
import { START_PREFIX, codeChoices, normalizePhone } from "./auth-requests";

/* ════════════════════════════════════════════════════════════════════
   USTOZONA BOTI — update'larni qayta ishlash

   Holat HAMMASI bazada (`tg_auth_requests`, `tg_chats`, `user_telegram`)
   — serversiz webhook'da xotira update'lar orasida yashamaydi.

   callback_data (64 baytgacha):
     c:<id>:<kod>   saytdagi kod tanlandi   (kod = "x" → «Bu men emas»)
     h:<id>         «Menda email akkaunt bor»
     m:y | m:n      marketing roziligi
   ════════════════════════════════════════════════════════════════════ */

const SITE = (process.env.BETTER_AUTH_URL || "https://www.ustozona.uz").replace(/\/$/, "");

const PHONE_KEYBOARD = {
  keyboard: [[{ text: "📱 Raqamni yuborish", request_contact: true }]],
  resize_keyboard: true,
  one_time_keyboard: true,
};

export async function handleUpdate(update: TgUpdate): Promise<void> {
  if (update.message) return onMessage(update.message);
  if (update.callback_query) return onCallback(update.callback_query);
  if (update.my_chat_member) {
    const m = update.my_chat_member;
    if (m.chat.type !== "private") return;
    const blocked = m.new_chat_member.status === "kicked";
    await db
      .update(tgChats)
      .set({ blockedAt: blocked ? new Date() : null, updatedAt: new Date() })
      .where(eq(tgChats.telegramId, String(m.from.id)));
  }
}

/* ── Suhbat qatori ───────────────────────────────────────────────── */

async function upsertChat(from: TgUser, chatId: number) {
  const now = new Date();
  const profile = {
    chatId: String(chatId),
    username: from.username ?? null,
    firstName: from.first_name ?? null,
    lastName: from.last_name ?? null,
    languageCode: from.language_code ?? null,
  };
  await db
    .insert(tgChats)
    .values({ telegramId: String(from.id), ...profile })
    .onConflictDoUpdate({
      target: tgChats.telegramId,
      // Botga yozdi — demak bloklanmagan.
      set: { ...profile, blockedAt: null, updatedAt: now },
    });
}

async function chatOf(telegramId: string) {
  const [row] = await db.select().from(tgChats).where(eq(tgChats.telegramId, telegramId));
  return row ?? null;
}

async function linkedUserId(telegramId: string): Promise<string | null> {
  const [row] = await db
    .select({ userId: userTelegram.userId })
    .from(userTelegram)
    .where(eq(userTelegram.telegramId, telegramId));
  return row?.userId ?? null;
}

/* ── Xabarlar ───────────────────────────────────────────────────── */

async function onMessage(msg: TgMessage) {
  const from = msg.from;
  if (!from || from.is_bot || msg.chat.type !== "private") return;
  await upsertChat(from, msg.chat.id);

  if (msg.contact) return onContact(msg, from);

  const text = (msg.text ?? "").trim();
  if (text.startsWith("/start")) {
    const payload = text.slice("/start".length).trim();
    if (payload.startsWith(START_PREFIX.login)) {
      return askCode(msg.chat.id, payload.slice(START_PREFIX.login.length), "login");
    }
    if (payload.startsWith(START_PREFIX.link)) {
      return askCode(msg.chat.id, payload.slice(START_PREFIX.link.length), "link");
    }
    return greet(msg.chat.id, String(from.id), from);
  }

  // Boshqa har qanday matn — qisqa yoʻriqnoma.
  return greet(msg.chat.id, String(from.id), from);
}

async function greet(chatId: number, telegramId: string, from: TgUser) {
  const userId = await linkedUserId(telegramId);
  if (!userId) {
    await sendMessage(
      chatId,
      `Assalomu alaykum, ${esc(from.first_name)}! 👋\n\n` +
        `Bu — <b>Ustozona</b> boti. Kirish yoki roʻyxatdan oʻtish uchun saytda ` +
        `«Telegram orqali davom etish» tugmasini bosing — qolganini shu yerda tasdiqlaysiz.`,
      { inline_keyboard: [[{ text: "🌐 Ustozonani ochish", url: `${SITE}/login` }]] }
    );
    return;
  }

  const chat = await chatOf(telegramId);
  await sendMessage(
    chatId,
    `Assalomu alaykum, ${esc(from.first_name)}! ✅ Akkauntingiz ulangan.\n\n` +
      `Har kuni kechqurun ertangi darslar, ertalab esa bugungi reja shu yerga keladi. ` +
      `Vaqtini Sozlamalarda oʻzgartirasiz.`,
    { inline_keyboard: [[{ text: "⚙️ Sozlamalar", url: `${SITE}/dashboard/settings?section=telegram` }]] }
  );
  if (!chat?.phone) await askPhone(chatId);
}

async function askPhone(chatId: number) {
  await sendMessage(
    chatId,
    "📱 Telefon raqamingizni qoʻshing — akkauntni tiklash va muhim xabarlar uchun. " +
      "Pastdagi tugmani bosing.",
    PHONE_KEYBOARD
  );
}

async function askMarketing(chatId: number, telegramId: string) {
  const chat = await chatOf(telegramId);
  if (chat?.marketingConsentAt || chat?.marketingOptOutAt) return;
  await sendMessage(
    chatId,
    "📣 Ustozona yangiliklari va oʻqituvchilar uchun foydali maslahatlarni shu yerga yuboraylikmi?\n\n" +
      "Istalgan payt Sozlamalarda oʻchirasiz.",
    {
      inline_keyboard: [[
        { text: "✅ Ha, yuboring", callback_data: "m:y" },
        { text: "Yoʻq", callback_data: "m:n" },
      ]],
    }
  );
}

/* ── 1-qadam: saytdagi kodni tanlash ─────────────────────────────── */

async function askCode(chatId: number, requestId: string, kind: "login" | "link") {
  const [req] = await db
    .select()
    .from(tgAuthRequests)
    .where(and(eq(tgAuthRequests.id, requestId), eq(tgAuthRequests.kind, kind)));

  if (!req || req.status !== "pending" || req.expiresAt.getTime() < Date.now()) {
    await sendMessage(
      chatId,
      "⌛ Bu havola eskirgan yoki allaqachon ishlatilgan. Saytda tugmani qayta bosing."
    );
    return;
  }

  const title = kind === "login" ? "🔐 <b>Ustozonaga kirish</b>" : "🔗 <b>Telegramni akkauntga ulash</b>";
  let who = "";
  if (kind === "link" && req.userId) {
    const [u] = await db.select({ name: user.name, email: user.email }).from(user).where(eq(user.id, req.userId));
    if (u) who = `\nAkkaunt: <b>${esc(u.name)}</b> (${esc(maskEmail(u.email))})`;
  }
  const device = req.clientLabel ? `\nQurilma: ${esc(req.clientLabel)}` : "";

  const choices = codeChoices(req.code);
  await sendMessage(
    chatId,
    `${title}${who}${device}\n\nSaytda qaysi kod koʻrinyapti?`,
    {
      inline_keyboard: [
        choices.map((c) => ({ text: c, callback_data: `c:${req.id}:${c}` })),
        [{ text: "❌ Bu men emas", callback_data: `c:${req.id}:x` }],
      ],
    }
  );
}

function maskEmail(email: string): string {
  if (isPlaceholderEmail(email)) return "Telegram orqali ochilgan";
  const [name, domain] = email.split("@");
  if (!domain) return email;
  return `${name.slice(0, 1)}•••@${domain}`;
}

/* ── Callback'lar ───────────────────────────────────────────────── */

async function onCallback(q: TgCallbackQuery) {
  const data = q.data ?? "";
  const chatId = q.message?.chat.id;
  const messageId = q.message?.message_id;
  if (!chatId || !messageId || q.message?.chat.type !== "private") {
    await answerCallbackQuery(q.id);
    return;
  }
  await upsertChat(q.from, chatId);
  const telegramId = String(q.from.id);

  if (data === "m:y" || data === "m:n") {
    const now = new Date();
    await db
      .update(tgChats)
      .set(
        data === "m:y"
          ? { marketingConsentAt: now, marketingOptOutAt: null, updatedAt: now }
          : { marketingOptOutAt: now, updatedAt: now }
      )
      .where(eq(tgChats.telegramId, telegramId));
    await answerCallbackQuery(q.id);
    await editMessageText(
      chatId,
      messageId,
      data === "m:y"
        ? "✅ Rahmat! Yangiliklarni shu yerga yuboramiz."
        : "Mayli, faqat darslar va akkaunt haqidagi xabarlar keladi."
    );
    return;
  }

  if (data.startsWith("h:")) {
    const requestId = data.slice(2);
    await db
      .update(tgAuthRequests)
      .set({ status: "has_account", decidedAt: new Date() })
      .where(
        and(
          eq(tgAuthRequests.id, requestId),
          eq(tgAuthRequests.telegramId, telegramId),
          eq(tgAuthRequests.status, "awaiting_phone")
        )
      );
    await answerCallbackQuery(q.id);
    await editMessageText(
      chatId,
      messageId,
      "Unda avval saytda <b>email bilan kiring</b>, keyin Sozlamalar → Telegram → «Ulash» ni bosing. " +
        "Shunda ikkinchi akkaunt ochilmaydi va hamma maʼlumotingiz joyida qoladi."
    );
    await sendMessage(chatId, "👌", { remove_keyboard: true });
    return;
  }

  if (data.startsWith("c:")) {
    const [, requestId, picked] = data.split(":");
    await answerCallbackQuery(q.id);
    return onCodePicked(chatId, messageId, telegramId, requestId, picked);
  }

  await answerCallbackQuery(q.id);
}

async function onCodePicked(
  chatId: number,
  messageId: number,
  telegramId: string,
  requestId: string,
  picked: string
) {
  const [req] = await db.select().from(tgAuthRequests).where(eq(tgAuthRequests.id, requestId));
  if (!req || req.status !== "pending" || req.expiresAt.getTime() < Date.now()) {
    await editMessageText(chatId, messageId, "⌛ Bu soʻrov eskirgan. Saytda tugmani qayta bosing.");
    return;
  }

  if (picked !== req.code) {
    // Notoʻgʻri kod ham, «Bu men emas» ham — soʻrov yopiladi. Yangi
    // urinish faqat saytdan: firibgar tanlovni qayta-qayta sinab koʻra olmaydi.
    await decide(req.id, "rejected", telegramId);
    await editMessageText(
      chatId,
      messageId,
      picked === "x"
        ? "❌ Rad etildi. Agar bu siz boʻlmasangiz — hech narsa qilish shart emas, akkauntingizga hech kim kirmadi."
        : "❌ Kod mos kelmadi, soʻrov bekor qilindi. Saytda tugmani qayta bosing."
    );
    return;
  }

  const existingUserId = await linkedUserId(telegramId);

  if (req.kind === "link") {
    const target = req.userId;
    if (!target) return;
    if (existingUserId && existingUserId !== target) {
      await decide(req.id, "taken_tg", telegramId);
      await editMessageText(
        chatId,
        messageId,
        "⚠️ Bu Telegram boshqa Ustozona akkauntiga ulangan. Avval oʻsha akkauntda Sozlamalar → Telegram → «Uzish» ni bosing."
      );
      return;
    }
    if (!existingUserId) {
      const [mine] = await db
        .select({ telegramId: userTelegram.telegramId })
        .from(userTelegram)
        .where(eq(userTelegram.userId, target));
      if (mine) {
        await decide(req.id, "taken_uz", telegramId);
        await editMessageText(
          chatId,
          messageId,
          "⚠️ Bu Ustozona akkaunti boshqa Telegramga ulangan. Avval saytda Sozlamalardan uni uzing."
        );
        return;
      }
    }
    if (!(await decide(req.id, "approved", telegramId, target))) {
      await editMessageText(chatId, messageId, "⌛ Bu soʻrov eskirgan. Saytda tugmani qayta bosing.");
      return;
    }
    if (!existingUserId) {
      const chat = await chatOf(telegramId);
      await db
        .insert(userTelegram)
        .values({ telegramId, userId: target, username: chat?.username ?? null })
        .onConflictDoNothing();
    }
    await editMessageText(
      chatId,
      messageId,
      "✅ Telegram akkauntingizga ulandi! Saytga qaytishingiz mumkin.\n\n" +
        "Endi har kuni kechqurun ertangi darslar, ertalab bugungi reja shu yerga keladi."
    );
    await afterLinked(chatId, telegramId);
    return;
  }

  // login
  if (existingUserId) {
    if (!(await decide(req.id, "approved", telegramId, existingUserId))) {
      await editMessageText(chatId, messageId, "⌛ Bu soʻrov eskirgan. Saytda tugmani qayta bosing.");
      return;
    }
    await editMessageText(chatId, messageId, "✅ Tasdiqlandi. Saytga qayting — kirish oʻzi davom etadi.");
    await afterLinked(chatId, telegramId);
    return;
  }

  // Yangi odam — akkaunt telefon kelgach ochiladi.
  if (!(await decide(req.id, "awaiting_phone", telegramId))) {
    await editMessageText(chatId, messageId, "⌛ Bu soʻrov eskirgan. Saytda tugmani qayta bosing.");
    return;
  }
  await editMessageText(
    chatId,
    messageId,
    "👋 Bu Telegram bilan Ustozonada akkaunt yoʻq — yangisini ochamiz.\n\n" +
      "Buning uchun pastdagi <b>«📱 Raqamni yuborish»</b> tugmasini bosing.",
    { inline_keyboard: [[{ text: "Menda email bilan ochilgan akkaunt bor", callback_data: `h:${req.id}` }]] }
  );
  await sendMessage(chatId, "Telefon raqamingiz:", PHONE_KEYBOARD);
}

/** Soʻrov holatini faqat `pending` dan oʻzgartiradi — ikki bosish poygasi shu yerda tugaydi. */
async function decide(
  id: string,
  status: string,
  telegramId: string,
  userId?: string
): Promise<boolean> {
  const rows = await db
    .update(tgAuthRequests)
    .set({ status, telegramId, decidedAt: new Date(), ...(userId ? { userId } : {}) })
    .where(and(eq(tgAuthRequests.id, id), eq(tgAuthRequests.status, "pending")))
    .returning({ id: tgAuthRequests.id });
  return rows.length > 0;
}

async function afterLinked(chatId: number, telegramId: string) {
  const chat = await chatOf(telegramId);
  if (!chat?.phone) await askPhone(chatId);
  else await askMarketing(chatId, telegramId);
}

/* ── Kontakt: telefon ────────────────────────────────────────────── */

async function onContact(msg: TgMessage, from: TgUser) {
  const contact = msg.contact!;
  // ⛔ Faqat OʻZ raqami. Kontaktlar roʻyxatidan birovnikini yuborish
  // mumkin — Telegram buni ajratib beradi: `user_id` faqat oʻz
  // kontaktida yuboruvchiga teng.
  if (contact.user_id !== from.id) {
    await sendMessage(
      msg.chat.id,
      "Iltimos, oʻz raqamingizni pastdagi <b>«📱 Raqamni yuborish»</b> tugmasi orqali yuboring.",
      PHONE_KEYBOARD
    );
    return;
  }

  const telegramId = String(from.id);
  const phone = normalizePhone(contact.phone_number);
  const now = new Date();
  await db
    .update(tgChats)
    .set({ phone, phoneVerifiedAt: now, updatedAt: now })
    .where(eq(tgChats.telegramId, telegramId));

  // Raqam kutayotgan roʻyxatdan oʻtish soʻrovi bormi?
  const [req] = await db
    .select({ id: tgAuthRequests.id })
    .from(tgAuthRequests)
    .where(
      and(
        eq(tgAuthRequests.telegramId, telegramId),
        eq(tgAuthRequests.kind, "login"),
        eq(tgAuthRequests.status, "awaiting_phone"),
        gt(tgAuthRequests.expiresAt, now)
      )
    )
    .orderBy(desc(tgAuthRequests.createdAt))
    .limit(1);

  if (!req) {
    await sendMessage(msg.chat.id, "✅ Raqamingiz saqlandi. Rahmat!", { remove_keyboard: true });
    await askMarketing(msg.chat.id, telegramId);
    return;
  }

  // Band qilish: ikki marta yuborilgan kontakt ikkita akkaunt ochmasin.
  const claimed = await db
    .update(tgAuthRequests)
    .set({ status: "creating" })
    .where(and(eq(tgAuthRequests.id, req.id), eq(tgAuthRequests.status, "awaiting_phone")))
    .returning({ id: tgAuthRequests.id });
  if (claimed.length === 0) return;

  const userId = await createTelegramAccount(from);
  if (!userId) {
    await db
      .update(tgAuthRequests)
      .set({ status: "awaiting_phone" })
      .where(eq(tgAuthRequests.id, req.id));
    await sendMessage(
      msg.chat.id,
      "⚠️ Akkaunt ochishda xatolik. Bir daqiqadan keyin raqamni qayta yuboring.",
      PHONE_KEYBOARD
    );
    return;
  }

  await db
    .update(tgAuthRequests)
    .set({ status: "approved", userId, decidedAt: new Date() })
    .where(and(eq(tgAuthRequests.id, req.id), eq(tgAuthRequests.status, "creating")));

  await sendMessage(
    msg.chat.id,
    "🎉 Akkaunt ochildi! Saytga qayting — kirish oʻzi davom etadi.",
    { remove_keyboard: true }
  );
  await askMarketing(msg.chat.id, telegramId);
}

/** Parolsiz akkaunt + `user_telegram` bogʻlanishi.

    Email — oʻrinbosar (`tg<id>@telegram.invalid`, sabab
    `lib/placeholder-email.ts`). Foydalanuvchi keyin Sozlamalarda
    haqiqiy email va parol qoʻshishi mumkin.

    Akkaunt Better Auth'ning ichki adapteri orqali yaratiladi — shunda
    `databaseHooks` (admin plagini standart roli, aktivatsiya zanjiri)
    email roʻyxati bilan aynan bir xil ishlaydi. */
async function createTelegramAccount(from: TgUser): Promise<string | null> {
  const telegramId = String(from.id);
  const email = telegramPlaceholderEmail(telegramId);
  const name = [from.first_name, from.last_name].filter(Boolean).join(" ").trim().slice(0, 120) || "Ustoz";

  try {
    // Oldingi urinishda akkaunt yaratilib, bogʻlash yiqilgan boʻlishi mumkin.
    const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
    let userId = existing?.id;

    if (!userId) {
      const ctx = await auth.$context;
      const created = await ctx.internalAdapter.createUser({
        name,
        email,
        emailVerified: false,
      });
      userId = created.id;
    }

    await db
      .insert(userTelegram)
      .values({ telegramId, userId, username: from.username ?? null })
      .onConflictDoNothing();

    // Poyga: shu orada telegram boshqa akkauntga ulangan boʻlsa — oʻshani qaytaramiz.
    const owner = await linkedUserId(telegramId);
    return owner ?? userId;
  } catch (err) {
    console.error("[tg-bot] akkaunt yaratilmadi:", err);
    return null;
  }
}

/** Cron va boshqa joylar uchun: foydalanuvchining faol suhbati (bloklanmagan). */
export async function activeChatFor(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ chatId: tgChats.chatId })
    .from(userTelegram)
    .innerJoin(tgChats, eq(tgChats.telegramId, userTelegram.telegramId))
    .where(and(eq(userTelegram.userId, userId), isNull(tgChats.blockedAt)))
    .limit(1);
  return row?.chatId ?? null;
}
