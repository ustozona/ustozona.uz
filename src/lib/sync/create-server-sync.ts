import { toast } from "sonner";

/* ════════════════════════════════════════════════════════════════════
   createServerSync — zustand store → server sync (v1 pattern).

   Store'ga subscribe boʻladi; oʻzgarish debounce (default 1.5s) bilan
   flush qilinadi. Flush paytida `diff(lastSynced, joriy)` hisoblanadi:
   - null → yuboriladigan narsa yoʻq (masalan, hydration setState'i);
   - aks holda natija `push`ga ketadi, muvaffaqiyatda joriy snapshot
     `lastSynced` boʻladi.

   `diff` berilmasa — oddiy store rejimi: snapshot shallow-teng boʻlmasa
   BUTUN snapshot yuboriladi (settings, calendar, notes...). Murakkab
   store'lar (grades) oʻz granular diff funksiyasini beradi.

   Xatoda eksponensial backoff bilan qayta uriniladi (2s→4s→…→30s cap),
   birinchi xatoda sonner toast. Push davomida kelgan oʻzgarishlar
   yoʻqolmaydi — keyingi flush qolgan farqni yuboradi (idempotent
   yozuvlar uchun xavfsiz).

   MUHIM: hydration tugagandan KEYIN chaqirilsin, aks holda default
   holat serverdagi haqiqiy maʼlumot ustiga yoziladi.
   ════════════════════════════════════════════════════════════════════ */

type StoreLike<S> = {
  getState: () => S;
  subscribe: (listener: (state: S) => void) => () => void;
};

export function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (
    typeof a !== "object" || a === null ||
    typeof b !== "object" || b === null
  ) {
    return false;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) =>
    Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])
  );
}

export function createServerSync<S, P, D = P>(opts: {
  store: StoreLike<S>;
  /** Sinxronlanadigan boʻlak. Diff'siz rejimda tekis obyekt boʻlsin. */
  select: (state: S) => P;
  /** Granular diff: null = oʻzgarish yoʻq. Default: shallow-teng boʻlmasa butun snapshot. */
  diff?: (prev: P, next: P) => D | null;
  push: (payload: D) => Promise<unknown>;
  debounceMs?: number;
  errorMessage?: string;
}): { stop: () => void } {
  const debounceMs = opts.debounceMs ?? 1500;
  const errorMessage = opts.errorMessage ?? "Oʻzgarishlar serverga saqlanmadi";
  const diff =
    opts.diff ??
    ((prev: P, next: P) => (shallowEqual(prev, next) ? null : (next as unknown as D)));

  let lastSynced: P = opts.select(opts.store.getState());
  let dirty = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;
  let attempt = 0;
  let stopped = false;

  function schedule(delay: number) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void flush(), delay);
  }

  async function flush(): Promise<void> {
    timer = null;
    if (stopped || inFlight || !dirty) return;

    const next = opts.select(opts.store.getState());
    let payload: D | null;
    try {
      payload = diff(lastSynced, next);
    } catch (err) {
      console.error("[sync] diff xatosi:", err);
      dirty = false;
      return;
    }
    if (payload === null) {
      lastSynced = next;
      dirty = false;
      attempt = 0;
      return;
    }

    inFlight = true;
    try {
      await opts.push(payload);
      lastSynced = next;
      attempt = 0;
      // Push davomida yangi oʻzgarish kelgan boʻlsa — qolgan farq keyingi flush'da.
      dirty = opts.select(opts.store.getState()) !== next;
      if (dirty) schedule(debounceMs);
    } catch (err) {
      console.error("[sync] push xatosi:", err);
      attempt += 1;
      if (attempt === 1) toast.error(`${errorMessage} — qayta urinilmoqda…`);
      schedule(Math.min(30_000, 2_000 * 2 ** (attempt - 1)));
    } finally {
      inFlight = false;
    }
  }

  const unsubscribe = opts.store.subscribe((state) => {
    if (opts.select(state) === lastSynced) return;
    dirty = true;
    schedule(debounceMs);
  });

  return {
    stop() {
      stopped = true;
      unsubscribe();
      if (timer) clearTimeout(timer);
    },
  };
}
