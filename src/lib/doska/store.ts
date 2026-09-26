"use client";

import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";

import type { DoskaDeck, DoskaScreen, DoskaWidget, InkStroke, WidgetKind } from "./types";
import { widgetMeta } from "./registry";
import { visibleInk } from "./ink";
import { DEFAULT_BACKGROUND_ID } from "./backgrounds";

/* ════════════════════════════════════════════════════════════════════
   DOSKA STORE — mehmon rejimi (localStorage).

   `/doska` kirmasdan ochiladi: oʻqituvchi darsga kirdi, projektorni
   yoqdi, 3 soniyada taymer kerak (R134). Shu sababli hamma narsa
   avval lokal ishlaydi; server sinxronizatsiyasi keyingi bosqichda
   qoʻshiladi va lokal ekran **serverga koʻchiriladi** — yoʻqolmaydi.

   ⚠️ Kalit prefiksi `murabbiyona-` — mavjud kalitlar bilan izchil
   (brend nomi oʻzgargan, kalitlar ATAYLAB qoldirilgan).
   ════════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = "murabbiyona-doska-v1";

/** Oxirgi oʻzgarishdan keyin diskka yozishni shuncha kutamiz. */
const SAVE_DELAY_MS = 350;

/**
 * Nusxa asl vidjetdan shuncha surilib chiqadi (piksel).
 *
 * Aynan ustiga tushsa nusxa koʻrinmaydi va oʻqituvchi tugma ishlamadi
 * deb oʻylaydi; uzoqqa tashlansa esa uni qidirish kerak boʻladi.
 */
const DUPLICATE_OFFSET = 24;

/**
 * Qaytarish tarixining chuqurligi. Dars davomida 50 qadam ortga yetadi;
 * cheksiz tarix esa uzun darsda xotirani sekin toʻldirib boradi.
 */
const HISTORY_LIMIT = 50;

/* ────────────────────────────────────────────────────────────────────
   KECHIKTIRILGAN YOZUV.

   ⚠️ `localStorage.setItem` — SINXRON amal: u asosiy oqimni to'xtatadi.
   Persist esa har `set()` da yozadi, yaʼni tuzatishsiz:

     • har bosilgan harf   → butun deck JSON'ga oʻgiriladi va yoziladi
     • har `pointermove`   → sekundiga 60–120 marta oʻsha ish
     • har `bringToFront`  → yana bir marta

   Sinf ekranida bu «matn kechikib chiqadi, vidjet sudralganda
   tirmalaydi» boʻlib koʻrinadi — va ekran toʻlgani sayin yomonlashadi,
   chunki yozuv hajmi butun deckka bogʻliq.

   Yechim: oxirgi holatni ushlab turamiz va tinchlangach bir marta
   yozamiz. Oraliq holatlarni saqlashning maʼnosi ham yoʻq — vidjet
   sudralayotgan paytdagi 100 ta oraliq koordinata hech kimga kerak
   emas, faqat qoʻyilgan joyi kerak.

   ⚠️ Kutish paytida sahifa yopilishi mumkin. Kutilayotgan yozuvni
   darhol tushirish uchun `flushDoskaPersist()` eksport qilinadi;
   uni `pagehide` / `visibilitychange` ga ULAYDIGAN joy — komponent
   effekti (`DoskaShell`), chunki faqat oʻshanda toza `removeEventListener`
   bor. Listenerni shu faylda, factory ichida qoʻyish HMR'da ularni
   toʻplab ketardi va tozalash yoʻli yoʻq edi.
   ──────────────────────────────────────────────────────────────────── */

/**
 * Joriy storage instansiyasining «darhol yoz» funksiyasi. HMR yangi
 * instansiya yaratsa shu koʻrsatkich yangisiga oʻtadi — eskisiga emas.
 */
let flushPending: (() => void) | null = null;

/** Kutilayotgan localStorage yozuvini darhol diskka tushiradi. */
export function flushDoskaPersist(): void {
  flushPending?.();
}

function deferredLocalStorage(delayMs: number): StateStorage {
  // ⚠️ Birinchi qator ATAYLAB shunday: serverda `localStorage` yoʻq va
  // bu chaqiruv xato beradi. `createJSONStorage` uni ushlaydi va
  // saqlashsiz davom etadi — aynan avvalgi `() => localStorage`
  // xatti-harakati.
  const store = localStorage;

  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: { name: string; value: string } | null = null;

  const flush = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (!pending) return;
    let ok = true;
    try {
      store.setItem(pending.name, pending.value);
    } catch {
      // Xotira toʻlgan yoki maxfiylik rejimi — ekran baribir
      // ishlayveradi, faqat saqlanmaydi. Endi buni oʻqituvchi KOʻRADI
      // (`saveFailed`): qoʻlyozma deckni koʻp marta kattalashtiradi va
      // `localStorage` chegarasiga (~5 MB) yetish haqiqiy xavf — jim
      // qolinsa butun ekran (vidjetlar ham) yangilanishda yoʻqolardi.
      ok = false;
    }
    pending = null;
    reportSave(ok);
  };

  flushPending = flush;

  return {
    getItem: (name) => store.getItem(name),
    setItem: (name, value) => {
      pending = { name, value };
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(flush, delayMs);
    },
    removeItem: (name) => {
      pending = null;
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      store.removeItem(name);
    },
  };
}

/**
 * Saqlash natijasini holatga yozadi — faqat oʻzgarganda.
 *
 * ⚠️ `setState` persistʼni yana yozdiradi. Qiymat oʻzgarmasa chaqirilmaydi,
 * shuning uchun muvaffaqiyatsiz yozuv cheksiz takrorlanmaydi: ikkinchi
 * urinish ham yiqilsa holat allaqachon `true`.
 */
function reportSave(ok: boolean) {
  if (useDoskaStore.getState().saveFailed === !ok) return;
  useDoskaStore.setState({ saveFailed: !ok });
}

function newId() {
  return crypto.randomUUID();
}

function emptyScreen(ordinal: number): DoskaScreen {
  return { id: newId(), ordinal, background: DEFAULT_BACKGROUND_ID, widgets: [] };
}

function emptyDeck(): DoskaDeck {
  return {
    id: newId(),
    title: "Ekran",
    screens: [emptyScreen(0)],
    updatedAt: new Date().toISOString(),
  };
}

/* ────────────────────────────────────────────────────────────────────
   QAYTARISH TARIXI (docs/doska-ux-tadqiqot.md R312, A1).

   Sensorli doskada bola tegib ketadi, oʻqituvchi esa panelni sichqonchasiz
   boshqaradi — bir notoʻgʻri bosish vidjetni oʻchirsa yoki butun ekranni
   tozalasa, uni qaytarish yoʻli boʻlishi SHART. Shu sababli oʻchirishlar
   tasdiq oynasi soʻramaydi: amal darhol bajariladi, «Qaytarish» xabari
   esa uni bir bosishda bekor qiladi.

   Tarixga faqat oʻqituvchining ONGLI amallari yoziladi: qoʻyish,
   oʻchirish, nusxalash, koʻchirish/oʻlchash (butun harakat bitta qadam),
   fon, ekran qoʻshish/oʻchirish/tozalash.

   ⚠️ Vidjetning ICHKI holati (`state`) tarixga YOZILMAYDI va qaytarishda
   TIKLANMAYDI (`keepLiveState`). Sabab: taymer har soniya holatini
   yangilaydi, gʻildirak aylanadi — agar qaytarish ularni ham eski
   snapshotga qaytarsa, oʻqituvchi oʻchirishni bekor qilganda ishlab
   turgan taymer bir necha soniya orqaga sakrardi. Faqat OʻCHIRILGAN
   vidjet oʻzining oʻchirilgan paytdagi holati bilan qaytadi.

   Tarix saqlanmaydi (`partialize`): u dars ichidagi xavfsizlik, sahifa
   yangilangandan keyin kechagi qadamlar qaytarilmasin.
   ──────────────────────────────────────────────────────────────────── */

/** Tarixdagi bitta nuqta — ekranlar va qaysi biri ochiq edi. */
type Snapshot = { deck: DoskaDeck; activeScreenId: string };

/**
 * Qaytarib boʻladigan oʻchirish haqida xabar — `DoskaNotice` chizadi.
 *
 * Xabar faqat oʻsha amal tarixning ENG USTIDA turganda yashaydi: keyingi
 * har qanday yozilgan amal uni yopadi. Aks holda «Qaytarish» tugmasi
 * vidjetni emas, undan keyingi boshqa ishni bekor qilib yuborardi.
 */
export type DoskaNotice =
  | { id: number; kind: "widgetRemoved"; widgetKind: WidgetKind }
  | { id: number; kind: "screenCleared" }
  | { id: number; kind: "screenRemoved" }
  | { id: number; kind: "inkCleared" };

let noticeSeq = 0;

type DoskaState = {
  deck: DoskaDeck;
  activeScreenId: string;
  /** Tanlangan vidjet — chegara va oʻlcham tutqichlari shunga chiziladi. */
  selectedId: string | null;
  /**
   * Matni tahrirlanayotgan vidjet.
   *
   * ⚠️ Tanlovdan ALOHIDA holat: tanlangan vidjet sudraladi, tahrirdagi
   * vidjet esa yozuvni qabul qiladi va sudralmaydi. Ikkisi bitta
   * maydon boʻlsa, oʻqituvchi matn ichida soʻz belgilamoqchi
   * boʻlganda vidjet joyidan siljib ketardi.
   *
   * Efemer — `partialize` uni saqlamaydi: sahifa yangilanganda
   * kursor ochiq qolgan vidjet boʻlmasin.
   */
  editingId: string | null;
  /** localStorage oʻqilganini bildiradi; render mount-gate uchun. */
  hydrated: boolean;
  /**
   * Sozlamasi ochiq vidjet (docs/doska-ux-tadqiqot.md Q2).
   *
   * Efemer va TANLOVGA bogʻlangan: boshqa vidjet tanlansa yoki boʻsh
   * kanvas bosilsa yopiladi (`select`). Bir vaqtda bitta karta.
   */
  settingsId: string | null;
  /**
   * «Markazga» chiqarilgan vidjet — ekran oʻrtasida katta, qolgani parda
   * ostida (R311). Efemer: sahifa yangilanganda oddiy holat.
   */
  spotlightId: string | null;
  /**
   * Parda — butun ekran yopiladi («1» tugmasi yoki menyu). Oʻqituvchi
   * ovozini koʻtarmasdan sinf eʼtiborini oladi (R313). Efemer.
   */
  curtain: boolean;

  /**
   * `initial` — reyestrdagi boshlangʻich holat ustiga qoʻyiladi.
   * Bitta `kind` bir necha koʻrinishda boʻlgan vidjetlar uchun: shakl
   * paneli aynan qaysi figura qoʻyilayotganini shu orqali aytadi
   * (`{ shape: "romb" }`), alohida `kind` ixtiro qilmasdan.
   */
  addWidget: (
    kind: WidgetKind,
    at?: { x: number; y: number },
    initial?: Record<string, unknown>,
  ) => void;
  removeWidget: (id: string) => void;
  /**
   * Tanlangan vidjetning nusxasi — biroz surilgan holda, ustiga.
   *
   * Nega kerak: sinf ekranida bir xil vidjet takrorlanadi (ikki guruhga
   * ikki taymer, uch bosqichga uch eslatma). Nusxasiz oʻqituvchi uni
   * qaytadan qoʻyib, qaytadan sozlaydi — holat esa `state` da,
   * yaʼni nusxalash uni bepul olib keladi.
   */
  duplicateWidget: (id: string) => void;
  moveWidget: (id: string, x: number, y: number) => void;
  resizeWidget: (id: string, w: number, h: number, x: number, y: number) => void;
  patchWidgetState: (id: string, patch: Record<string, unknown>) => void;
  select: (id: string | null) => void;
  setEditing: (id: string | null) => void;
  bringToFront: (id: string) => void;
  /** Sozlama kartasini ochadi/yopadi; ochilganda vidjet tanlanadi. */
  toggleSettings: (id: string) => void;
  closeSettings: () => void;
  /** Qulflash/qulfni ochish — oʻqituvchi amali, tarixga yoziladi. */
  toggleLock: (id: string) => void;
  setSpotlight: (id: string | null) => void;
  setCurtain: (on: boolean) => void;

  setBackground: (backgroundId: string) => void;
  renameDeck: (title: string) => void;
  removeScreen: (id: string) => void;
  addScreen: () => void;
  setActiveScreen: (id: string) => void;
  clearScreen: () => void;

  /**
   * QOʻLYOZMA (docs/doska-qolyozma-tadqiqot.md). Har chiziq — bitta
   * qaytarish qadami: oʻqituvchi «Ctrl+Z» bosganda oxirgi yozgan
   * chizigʻi ketadi, butun yozuv emas.
   */
  /**
   * `screenId` — chiziq BOSHLANGAN ekran: yozish oʻrtasida ekran
   * almashsa (strelka, pult) chiziq yangi ekranga tushib qolmasin.
   */
  addStroke: (stroke: InkStroke, screenId: string) => void;
  /**
   * Oʻchirgich tekkan chiziqlarni almashtiradi: `id → qolgan boʻlaklar`
   * (butun chiziq oʻchirgʻichida boʻsh massiv). Boʻlaklar asl chiziq
   * OʻRNIGA qoʻyiladi — ustma-ust tartib buzilmaydi.
   *
   * Tarixga YOZMAYDI: oʻchirgich bir harakatda koʻp chiziqqa tegadi;
   * tarix harakat boshida bir marta yoziladi (`beginGesture`), sudrash
   * bilan bir xil naqsh.
   */
  replaceStrokes: (changes: ReadonlyMap<string, InkStroke[]>) => void;
  /**
   * Joriy ekranda KOʻRINIB turgan yozuvni oʻchiradi — «Qaytarish» xabari
   * bilan. Taqdimotning boshqa slaydlaridagi belgilar qoladi: oʻqituvchi
   * koʻrmagan narsani oʻchirmaslik kerak.
   */
  clearInk: () => void;

  /**
   * Oxirgi saqlash yiqildi (brauzer xotirasi toʻlgan). Efemer — keyingi
   * muvaffaqiyatli yozuvda oʻzi tushadi. `DoskaNotice` koʻrsatadi.
   */
  saveFailed: boolean;

  /** Qaytarish uchun oldingi holatlar (eng yangisi oxirida). Efemer. */
  past: Snapshot[];
  /** Qaytarilgan holatlar — «qaytadan bajarish» uchun. Efemer. */
  future: Snapshot[];
  notice: DoskaNotice | null;
  undo: () => void;
  redo: () => void;
  /**
   * Sudrash, oʻlchash yoki strelka bilan siljitish BOSHLANDI.
   *
   * Harakat davomida `moveWidget`/`resizeWidget` sekundiga oʻnlab marta
   * chaqiriladi — ularning har biri tarixga yozilsa bitta sudrashni
   * qaytarish uchun yuz marta bosish kerak boʻlardi. Shuning uchun tarix
   * harakat BOSHIDA bir marta yoziladi va butun harakat bitta qadam
   * boʻlib qaytariladi.
   */
  beginGesture: () => void;
  /** `id` berilsa faqat oʻsha xabar yopiladi — eski taymer yangisini yopmasin. */
  dismissNotice: (id?: number) => void;
};

/** Joriy ekranni topib, uning vidjetlarini oʻzgartiruvchi yordamchi. */
function withActiveScreen(
  deck: DoskaDeck,
  activeScreenId: string,
  fn: (widgets: DoskaWidget[]) => DoskaWidget[],
): DoskaDeck {
  return {
    ...deck,
    screens: deck.screens.map((s) =>
      s.id === activeScreenId ? { ...s, widgets: fn(s.widgets) } : s,
    ),
    updatedAt: new Date().toISOString(),
  };
}

/** Berilgan ekranning siyohini oʻzgartiruvchi yordamchi. */
function withScreenInk(
  deck: DoskaDeck,
  screenId: string,
  fn: (ink: InkStroke[]) => InkStroke[],
): DoskaDeck {
  return {
    ...deck,
    screens: deck.screens.map((s) =>
      s.id === screenId ? { ...s, ink: fn(s.ink ?? []) } : s,
    ),
    updatedAt: new Date().toISOString(),
  };
}

/** Ekranda qulflangan vidjet bormi — bunday ekran oʻchirilmaydi. */
export function screenHasLocked(deck: DoskaDeck, screenId: string): boolean {
  return !!deck.screens.find((x) => x.id === screenId)?.widgets.some((w) => w.locked);
}

/** Hozirgi holatni tarixga qoʻshadi va «qaytadan bajarish»ni tozalaydi. */
function pushHistory(s: DoskaState): Pick<DoskaState, "past" | "future"> {
  return {
    past: [
      ...s.past.slice(-(HISTORY_LIMIT - 1)),
      { deck: s.deck, activeScreenId: s.activeScreenId },
    ],
    future: [],
  };
}

/**
 * Snapshotdagi vidjetlarga JONLI ichki holatni qaytaradi (tarix izohi).
 * Deck nomi ham jonli qoladi — u tarixga yozilmaydi.
 */
function keepLiveState(target: DoskaDeck, live: DoskaDeck): DoskaDeck {
  const states = new Map<string, DoskaWidget["state"]>();
  for (const screen of live.screens) {
    for (const w of screen.widgets) states.set(w.id, w.state);
  }
  return {
    ...target,
    title: live.title,
    screens: target.screens.map((screen) => ({
      ...screen,
      widgets: screen.widgets.map((w) => {
        const state = states.get(w.id);
        return state && state !== w.state ? { ...w, state } : w;
      }),
    })),
    updatedAt: new Date().toISOString(),
  };
}

/** Tiklangan holatga koʻra tanlov: vidjet ochiq ekranda qolgan boʻlsa saqlanadi. */
function restore(
  s: DoskaState,
  to: Snapshot,
): Pick<
  DoskaState,
  "deck" | "activeScreenId" | "selectedId" | "editingId" | "notice" | "settingsId" | "spotlightId"
> {
  const deck = keepLiveState(to.deck, s.deck);
  const activeScreenId = deck.screens.some((x) => x.id === to.activeScreenId)
    ? to.activeScreenId
    : deck.screens[0].id;
  const screen = deck.screens.find((x) => x.id === activeScreenId);
  const keep = s.selectedId !== null && screen?.widgets.some((w) => w.id === s.selectedId);
  return {
    deck,
    activeScreenId,
    selectedId: keep ? s.selectedId : null,
    editingId: null,
    notice: null,
    settingsId: null,
    spotlightId: null,
  };
}

export const useDoskaStore = create<DoskaState>()(
  persist(
    (set, get) => {
      const initialDeck = emptyDeck();

      return {
        deck: initialDeck,
        activeScreenId: initialDeck.screens[0].id,
        selectedId: null,
        editingId: null,
        hydrated: false,
        settingsId: null,
        spotlightId: null,
        curtain: false,
        saveFailed: false,
        past: [],
        future: [],
        notice: null,

        addWidget: (kind, at, initial) => {
          const meta = widgetMeta(kind);
          const { deck, activeScreenId } = get();
          const screen = deck.screens.find((s) => s.id === activeScreenId);
          const maxZ = screen?.widgets.reduce((m, w) => Math.max(m, w.z), 0) ?? 0;

          const widget: DoskaWidget = {
            id: newId(),
            kind,
            x: at?.x ?? 80 + (screen?.widgets.length ?? 0) * 28,
            y: at?.y ?? 80 + (screen?.widgets.length ?? 0) * 28,
            w: meta.defaultSize.w,
            h: meta.defaultSize.h,
            z: maxZ + 1,
            // Chuqur nusxa: holatda massiv bor (gʻildirakning `picked`i) va
            // reyestrdagi boshlangʻich qiymat hamma vidjetga umumiy.
            state: { ...structuredClone(meta.initialState), ...initial },
          };

          set({
            ...pushHistory(get()),
            notice: null,
            deck: withActiveScreen(deck, activeScreenId, (ws) => [...ws, widget]),
            selectedId: widget.id,
            // Matn vidjeti darhol yozishga tayyor: oʻqituvchi «Matn»
            // tugmasini bosdi, demak yozmoqchi. Aks holda u qoʻyilgan
            // quti bilan yozish orasida ikkinchi qadam paydo boʻladi
            // va bu dars oʻrtasida sezilarli.
            editingId: meta.editable ? widget.id : null,
            settingsId: meta.openSettingsOnAdd ? widget.id : null,
          });
        },

        removeWidget: (id) =>
          set((s) => {
            const screen = s.deck.screens.find((x) => x.id === s.activeScreenId);
            const target = screen?.widgets.find((w) => w.id === id);
            // Qulflangan vidjet oʻchirilmaydi — avval qulfni ochish kerak.
            if (!target || target.locked) return s;

            return {
              ...pushHistory(s),
              // Vidjet sahifalariga bogʻlangan yozuv u bilan birga ketadi —
              // koʻrinmas maʼlumot boʻlib qolmasin. «Qaytarish» ikkalasini
              // birga qaytaradi (bitta qadam).
              deck: withScreenInk(
                withActiveScreen(s.deck, s.activeScreenId, (ws) => ws.filter((w) => w.id !== id)),
                s.activeScreenId,
                (ink) => ink.filter((x) => x.anchor?.widgetId !== id),
              ),
              selectedId: s.selectedId === id ? null : s.selectedId,
              editingId: s.editingId === id ? null : s.editingId,
              settingsId: s.settingsId === id ? null : s.settingsId,
              spotlightId: s.spotlightId === id ? null : s.spotlightId,
              notice: { id: ++noticeSeq, kind: "widgetRemoved", widgetKind: target.kind },
            };
          }),

        duplicateWidget: (id) => {
          const { deck, activeScreenId } = get();
          const screen = deck.screens.find((s) => s.id === activeScreenId);
          const source = screen?.widgets.find((w) => w.id === id);
          if (!source) return;

          const maxZ = screen?.widgets.reduce((m, w) => Math.max(m, w.z), 0) ?? 0;
          // `state` CHUQUR koʻchiriladi: unda endi massiv va obyektlar bor
          // (gʻildirakning `picked`i, taqdimotning `teams`i). Sayoz nusxada
          // ular asl vidjet bilan bogʻlanib qolardi.
          const copy: DoskaWidget = {
            ...source,
            id: newId(),
            x: source.x + DUPLICATE_OFFSET,
            y: source.y + DUPLICATE_OFFSET,
            z: maxZ + 1,
            state: structuredClone(source.state),
            // Nusxa QULFSIZ tugʻiladi: oʻqituvchi uni joyiga surmoqchi.
            locked: undefined,
          };

          set({
            ...pushHistory(get()),
            notice: null,
            deck: withActiveScreen(deck, activeScreenId, (ws) => [...ws, copy]),
            selectedId: copy.id,
            // Nusxa tahrirga OCHILMAYDI, asl vidjetdan farqli: matn
            // allaqachon yozilgan, oʻqituvchi esa nusxani koʻchirmoqchi.
            editingId: null,
            settingsId: null,
          });
        },

        moveWidget: (id, x, y) =>
          set((s) => ({
            deck: withActiveScreen(s.deck, s.activeScreenId, (ws) =>
              ws.map((w) => (w.id === id ? { ...w, x, y } : w)),
            ),
          })),

        resizeWidget: (id, w, h, x, y) =>
          set((s) => ({
            deck: withActiveScreen(s.deck, s.activeScreenId, (ws) =>
              ws.map((it) => (it.id === id ? { ...it, w, h, x, y } : it)),
            ),
          })),

        patchWidgetState: (id, patch) =>
          set((s) => ({
            deck: withActiveScreen(s.deck, s.activeScreenId, (ws) =>
              ws.map((w) =>
                w.id === id ? { ...w, state: { ...w.state, ...patch } } : w,
              ),
            ),
          })),

        select: (id) =>
          set((s) => ({
            selectedId: id,
            settingsId: s.settingsId === id ? s.settingsId : null,
          })),

        setEditing: (id) => set({ editingId: id }),

        bringToFront: (id) =>
          set((s) => {
            const screen = s.deck.screens.find((x) => x.id === s.activeScreenId);
            const maxZ = screen?.widgets.reduce((m, w) => Math.max(m, w.z), 0) ?? 0;
            const current = screen?.widgets.find((w) => w.id === id);
            if (!current || current.z === maxZ) return s;

            return {
              deck: withActiveScreen(s.deck, s.activeScreenId, (ws) =>
                ws.map((w) => (w.id === id ? { ...w, z: maxZ + 1 } : w)),
              ),
            };
          }),

        toggleSettings: (id) =>
          set((s) =>
            s.settingsId === id
              ? { settingsId: null }
              : { settingsId: id, selectedId: id, editingId: null },
          ),

        closeSettings: () => set({ settingsId: null }),

        toggleLock: (id) =>
          set((s) => {
            const screen = s.deck.screens.find((x) => x.id === s.activeScreenId);
            if (!screen?.widgets.some((w) => w.id === id)) return s;
            return {
              ...pushHistory(s),
              notice: null,
              deck: withActiveScreen(s.deck, s.activeScreenId, (ws) =>
                ws.map((w) => (w.id === id ? { ...w, locked: w.locked ? undefined : true } : w)),
              ),
            };
          }),

        // Tanlov ham yopiladi: markazdagi vidjetda tanlovga bogʻliq
        // tugmalar (taymerning «Qaytadan», «+1») sinfga koʻrinmasin.
        setSpotlight: (id) =>
          set({ spotlightId: id, settingsId: null, editingId: null, selectedId: null }),

        setCurtain: (on) => set({ curtain: on }),

        setBackground: (backgroundId) =>
          set((s) => ({
            ...pushHistory(s),
            notice: null,
            deck: {
              ...s.deck,
              screens: s.deck.screens.map((x) =>
                x.id === s.activeScreenId ? { ...x, background: backgroundId } : x,
              ),
              updatedAt: new Date().toISOString(),
            },
          })),

        renameDeck: (title) =>
          set((s) => ({
            deck: { ...s.deck, title, updatedAt: new Date().toISOString() },
          })),

        /**
         * Oxirgi ekran oʻchirilmaydi — doska hech qachon boʻsh qolmasin.
         *
         * Qulflangan vidjeti bor ekran ham oʻchirilmaydi: qulf «bu joyida
         * tursin» degani, u `removeWidget` va `clearScreen` da ham
         * saqlanadi. Menyu bu holatda bandni sababi bilan koʻrsatadi
         * (`screenHasLocked`).
         */
        removeScreen: (id) =>
          set((s) => {
            if (s.deck.screens.length <= 1) return s;
            if (screenHasLocked(s.deck, id)) return s;

            const rest = s.deck.screens
              .filter((x) => x.id !== id)
              .map((x, i) => ({ ...x, ordinal: i }));

            return {
              ...pushHistory(s),
              deck: { ...s.deck, screens: rest, updatedAt: new Date().toISOString() },
              activeScreenId: s.activeScreenId === id ? rest[0].id : s.activeScreenId,
              selectedId: null,
              editingId: null,
              settingsId: null,
              spotlightId: null,
              notice: { id: ++noticeSeq, kind: "screenRemoved" },
            };
          }),

        addScreen: () =>
          set((s) => {
            const screen = emptyScreen(s.deck.screens.length);
            return {
              ...pushHistory(s),
              notice: null,
              deck: {
                ...s.deck,
                screens: [...s.deck.screens, screen],
                updatedAt: new Date().toISOString(),
              },
              activeScreenId: screen.id,
              selectedId: null,
              editingId: null,
              settingsId: null,
              spotlightId: null,
            };
          }),

        setActiveScreen: (id) =>
          set({
            activeScreenId: id,
            selectedId: null,
            editingId: null,
            settingsId: null,
            spotlightId: null,
          }),

        clearScreen: () =>
          set((s) => {
            const screen = s.deck.screens.find((x) => x.id === s.activeScreenId);
            // Qulflangan vidjetlar tozalashdan ham omon qoladi — qulf
            // «bu joyida tursin» degani (R311).
            const kept = screen?.widgets.filter((w) => w.locked) ?? [];
            // Yozuv ham ketadi: «ekranni tozalash» — toza doska. Faqat
            // QOLGAN (qulflangan) vidjet sahifalariga bogʻlangan yozuv
            // u bilan birga qoladi — aks holda taqdimotning boshqa
            // slaydlaridagi belgilar koʻrinmasdan oʻchib ketardi.
            const keptIds = new Set(kept.map((w) => w.id));
            const ink = screen?.ink ?? [];
            const keptInk = ink.filter((x) => x.anchor && keptIds.has(x.anchor.widgetId));
            // Oʻchadigan narsa yoʻq — tarixga bekor qadam qoʻshilmasin.
            if (!screen || (screen.widgets.length === kept.length && ink.length === keptInk.length)) return s;

            // Hammasi bitta qadam va bitta «Qaytarish» bilan qaytadi.
            const deck = withActiveScreen(s.deck, s.activeScreenId, () => kept);
            return {
              ...pushHistory(s),
              deck: withScreenInk(deck, s.activeScreenId, () => keptInk),
              selectedId: null,
              editingId: null,
              settingsId: null,
              spotlightId: null,
              notice: { id: ++noticeSeq, kind: "screenCleared" },
            };
          }),

        addStroke: (stroke, screenId) =>
          set((s) => {
            // Yozish paytida ekran oʻchirilgan boʻlsa chiziq tashlanadi.
            if (!s.deck.screens.some((x) => x.id === screenId)) return s;
            return {
              ...pushHistory(s),
              notice: null,
              deck: withScreenInk(s.deck, screenId, (ink) => [...ink, stroke]),
            };
          }),

        replaceStrokes: (changes) =>
          set((s) => ({
            deck: withScreenInk(s.deck, s.activeScreenId, (ink) =>
              ink.flatMap((x) => changes.get(x.id) ?? [x]),
            ),
          })),

        clearInk: () =>
          set((s) => {
            const screen = s.deck.screens.find((x) => x.id === s.activeScreenId);
            const visible = new Set(visibleInk(screen).map((x) => x.stroke));
            if (!visible.size) return s;
            return {
              ...pushHistory(s),
              deck: withScreenInk(s.deck, s.activeScreenId, (ink) =>
                ink.filter((x) => !visible.has(x)),
              ),
              notice: { id: ++noticeSeq, kind: "inkCleared" },
            };
          }),

        undo: () =>
          set((s) => {
            const prev = s.past[s.past.length - 1];
            if (!prev) return s;
            return {
              ...restore(s, prev),
              past: s.past.slice(0, -1),
              future: [...s.future, { deck: s.deck, activeScreenId: s.activeScreenId }],
            };
          }),

        redo: () =>
          set((s) => {
            const next = s.future[s.future.length - 1];
            if (!next) return s;
            return {
              ...restore(s, next),
              past: [...s.past, { deck: s.deck, activeScreenId: s.activeScreenId }],
              future: s.future.slice(0, -1),
            };
          }),

        beginGesture: () => set((s) => ({ ...pushHistory(s), notice: null })),

        dismissNotice: (id) =>
          set((s) =>
            s.notice && (id === undefined || s.notice.id === id) ? { notice: null } : s,
          ),
      };
    },
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => deferredLocalStorage(SAVE_DELAY_MS)),
      partialize: (s) => ({ deck: s.deck, activeScreenId: s.activeScreenId }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

/**
 * Vidjet tanlanganmi — ikkilamchi tugmalar faqat shunda chiqadi
 * (docs/doska-ux-tadqiqot.md A7: sinf ekrani toza qolsin).
 */
export function useIsSelected(id: string): boolean {
  return useDoskaStore((s) => s.selectedId === id);
}

/** Joriy ekran — komponentlar shu selektor orqali oʻqiydi. */
export function useActiveScreen(): DoskaScreen | undefined {
  return useDoskaStore((s) => s.deck.screens.find((x) => x.id === s.activeScreenId));
}

/**
 * Joriy ekran — hook EMAS: hodisa ishlovchilari va store tashqarisidagi
 * amallar uchun (siyoh qatlami, belgilash amallari).
 */
export function getActiveScreen(): DoskaScreen | undefined {
  const s = useDoskaStore.getState();
  return s.deck.screens.find((x) => x.id === s.activeScreenId);
}
