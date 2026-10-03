/* ════════════════════════════════════════════════════════════════════
   SKANER NAVBATI — internet uzilsa suratlar yoʻqolmasin.

   Qishloq maktabida tarmoq darsning oʻrtasida uziladi. Ilgari 20 ta
   varaqdan 7-sida tarmoq uzilsa, qolgan 13 tasi umuman yuborilmas,
   olingan suratlar esa faqat sahifa xotirasida turardi — sahifa yopilsa
   hammasi yoʻqolardi. Endi:

     • tarmoq sabab yuborilmagan surat telefonning OʻZ xotirasiga
       (IndexedDB) yoziladi — sahifa yopilsa ham, telefon oʻchsa ham qoladi;
     • tarmoq qaytganda (`online`) yoki sahifa qayta ochilganda navbat
       oʻzi yuboriladi;
     • koʻrib chiqilayotgan (hali jurnalga yozilmagan) varaqlar roʻyxati
       ham saqlanadi (`localStorage`, 24 soat).

   Doira — test + sinf (`setId:classId`): telefondagi skaner havolasi
   eskirib, yangi QR ochilsa ham navbat oʻsha test uchun topiladi.

   Faqat brauzerda. Xotira yopiq boʻlsa (maxfiy oyna) — jim, avvalgidek
   ishlaydi: hech narsa buzilmaydi, faqat saqlanmaydi.
   ════════════════════════════════════════════════════════════════════ */

export type QueuedKind = "sheet" | "quick";

export type QueuedPhoto = {
  id: string;
  scope: string;
  kind: QueuedKind;
  blob: Blob;
  createdAt: number;
};

const DB_NAME = "ustozona-scan-queue";
const STORE = "photos";
/** Navbatda koʻpi bilan — telefon xotirasini toʻldirib yubormaslik uchun. */
export const MAX_QUEUED = 120;

export const scanScope = (setId: string, classId: string) => `${setId}:${classId}`;

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const store = req.result.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("scope", "scope");
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, mode);
      const req = run(tx.objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      tx.oncomplete = () => db.close();
    } catch {
      db.close();
      resolve(null);
    }
  });
}

/** Navbatga yozish. `false` — xotira yoʻq yoki toʻla (surat saqlanmadi). */
export async function queuePhoto(scope: string, kind: QueuedKind, blob: Blob): Promise<boolean> {
  const existing = await listQueued(scope);
  if (existing.length >= MAX_QUEUED) return false;
  const item: QueuedPhoto = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`, scope, kind, blob, createdAt: Date.now() };
  const res = await withStore("readwrite", (s) => s.put(item));
  return res !== null;
}

export async function listQueued(scope: string): Promise<QueuedPhoto[]> {
  const res = await withStore<QueuedPhoto[]>("readonly", (s) => s.index("scope").getAll(scope));
  return (res ?? []).sort((a, b) => a.createdAt - b.createdAt);
}

export async function removeQueued(id: string): Promise<void> {
  await withStore("readwrite", (s) => s.delete(id));
}

/* ── Koʻrib chiqilayotgan varaqlar roʻyxati ── */

const REVIEW_KEY = "ustozona.scanReview.v1:";
const REVIEW_TTL_MS = 24 * 60 * 60 * 1000;

export function saveReview<T>(scope: string, data: T | null) {
  try {
    if (data === null) window.localStorage.removeItem(REVIEW_KEY + scope);
    else window.localStorage.setItem(REVIEW_KEY + scope, JSON.stringify({ at: Date.now(), data }));
  } catch {
    // Xotira toʻla yoki yopiq — roʻyxat faqat shu sahifada qoladi.
  }
}

export function loadReview<T>(scope: string): T | null {
  try {
    const raw = window.localStorage.getItem(REVIEW_KEY + scope);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; data: T };
    if (!parsed || Date.now() - parsed.at > REVIEW_TTL_MS) {
      window.localStorage.removeItem(REVIEW_KEY + scope);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

/** Javob — qayta urinish kerakmi (tarmoq/server), yoki surat oʻzi yaroqsiz. */
export function isRetryable(status: number | null): boolean {
  // `null` — soʻrov umuman ketmadi (tarmoq yoʻq, uzildi).
  // 401 — skaner havolasi eskirdi: surat yaxshi, yangi QR bilan yuboriladi.
  return status === null || status === 401 || status === 408 || status >= 500;
}
