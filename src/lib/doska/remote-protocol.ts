/* ════════════════════════════════════════════════════════════════════
   USTOZ PULTI — Doska ↔ telefon xabar shartnomasi (yagona manba).

   docs/ustoz-pulti-spec.md. Oʻqituvchi telefoni Doskani dars davomida
   boshqaradi: ekranlar, taqdimot qadami, «Javobni ochish», va shu
   paytdagi testni telefon kamerasi bilan tekshirish.

   Kanal — Supabase Realtime BROADCAST (`useRealtimeChannel`), tasodifiy
   128-bitli mavzu. Mavzuni faqat imzolangan pult chiptasi egasi biladi
   (`server/remote/remote-ticket.ts`). DB ga hech narsa yozilmaydi:
   kanal faqat BUYRUQ va HOLAT tashiydi, natija (javoblar) mavjud
   skaner yoʻlidan (`/api/baholash/scan/apply`) yoziladi.

   HOKIMIYAT — DOSKA. Holat Doskada (brauzer xotirasi), telefon faqat
   buyruq yuboradi va Doska eʼlon qilgan holatni koʻrsatadi. Ikki telefon
   ulansa ham ziddiyat yoʻq: ikkalasi bir manbaga ergashadi.

   Neytral modul: Doska (klient), telefon sahifasi (klient) va server
   (tiplar) shu yerdan oladi.
   ════════════════════════════════════════════════════════════════════ */

/** Telefon → Doska. */
export type RemoteCommand =
  | { type: "hello" }
  | { type: "screen"; to: "next" | "prev" }
  | { type: "screen-goto"; id: string }
  | { type: "step"; to: "next" | "prev" }
  | { type: "reveal" }
  | { type: "curtain" }
  /** Radio pult rejimini Doskada ochish (joriy taqdimot testi bilan). */
  | { type: "pult" }
  /** Tezkor tekshirish: javob shablonini yangi ekranga chiqarish (savollar soni). */
  | { type: "template"; count: number }
  | { type: "scanned"; added: number; answers: number };

/** Doska ekranining telefonda koʻrinadigan qisqa tavsifi. */
export type RemoteScreen = {
  id: string;
  /** Ekranning asosiy mazmuni — taqdimot nomi yoki vidjet turi kaliti. */
  label: string;
  /** `label` tarjima kalitimi (`Doska.widgets.<kind>`), yoki tayyor matnmi. */
  labelIsKind: boolean;
};

/** Faol ekrandagi taqdimot — telefon shu bilan ishlaydi. */
export type RemotePresentation = {
  widgetId: string;
  setId: string;
  classId: string | null;
  title: string;
  index: number;
  total: number;
  /** `slide` | `mcq` | `poll` | … — `activities.shape`. */
  shape: string | null;
  /** Joriy qadamning qisqa matni (slayd sarlavhasi yoki savol). */
  stepText: string;
  revealed: boolean;
  /** Javob ochiladimi (slaydda — yoʻq). */
  canReveal: boolean;
  /** Jonli sessiya ketyapti — PIN va qoʻshilganlar. */
  live: { joinCode: string; joined: number } | null;
  /** Testdagi variantli savollar soni (skaner faqat shularni oʻqiydi). */
  mcqCount: number;
};

/** Doska → telefon. */
export type RemoteState = {
  screens: RemoteScreen[];
  activeId: string | null;
  presentation: RemotePresentation | null;
  /** Dars rejimi — studiyadan ochilgan dars nomi. */
  lessonTitle: string | null;
  /** Parda (ekran yopiq) yoqilganmi. */
  curtain: boolean;
  /** Radio pult rejimi ochiq boʻlsa — qadam va javob unga yuboriladi. */
  pult: {
    title: string;
    index: number;
    total: number;
    answered: number;
    rosterSize: number;
    revealed: boolean;
    connected: boolean;
  } | null;
  sentAt: number;
};

export const REMOTE_EVENTS = { command: "cmd", state: "state" } as const;

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Kanaldan kelgan buyruqni tekshiradi — kanal ommaviy, ishonchsiz manba. */
export function parseRemoteCommand(raw: unknown): RemoteCommand | null {
  if (!isObj(raw)) return null;
  switch (raw.type) {
    case "hello":
    case "reveal":
    case "curtain":
    case "pult":
      return { type: raw.type };
    case "screen":
    case "step":
      return raw.to === "next" || raw.to === "prev" ? { type: raw.type, to: raw.to } : null;
    case "template": {
      const count = Math.round(Number(raw.count));
      return count >= 1 && count <= 100 ? { type: "template", count } : null;
    }
    case "screen-goto":
      return typeof raw.id === "string" && raw.id.length <= 100 ? { type: "screen-goto", id: raw.id } : null;
    case "scanned": {
      const added = Math.max(0, Math.min(500, Math.round(Number(raw.added) || 0)));
      const answers = Math.max(0, Math.min(10000, Math.round(Number(raw.answers) || 0)));
      return { type: "scanned", added, answers };
    }
    default:
      return null;
  }
}

/** Doska holati — telefon tomonda tekshiriladi (shakli buzilgan boʻlsa — e'tiborsiz). */
export function parseRemoteState(raw: unknown): RemoteState | null {
  if (!isObj(raw) || !Array.isArray(raw.screens)) return null;
  return raw as RemoteState;
}
