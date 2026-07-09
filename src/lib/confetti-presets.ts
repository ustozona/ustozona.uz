import confetti from "canvas-confetti";

/**
 * 9 ta tayyor confetti uslubi — barchasi global `canvas-confetti`ni
 * (o'zining butun ekranga yopishgan canvas'i bilan) ishlatadi, shuning
 * uchun hech qanday <Confetti> komponentiga ehtiyoj yo'q — istalgan
 * joydan (masalan onClick ichida) to'g'ridan-to'g'ri chaqiring:
 *
 *   import { confettiPresets } from "@/lib/confetti-presets";
 *   confettiPresets.sideCannons();
 */
export const confettiPresets = {
  /** 1 — bosilgan elementdan chiqadigan tor portlash (tugma markazidan). */
  fromElement: (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      },
    });
  },

  /** 2 — pastdan chiquvchi keng rangli kamalak portlash. */
  rainbow: () => {
    confetti({
      particleCount: 200,
      spread: 120,
      origin: { y: 0.8 },
      colors: ["#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#0000ff", "#4b0082", "#8b00ff"],
    });
  },

  /** 3 — pastki chekkadan yumshoq koʻtariluvchi yomgʻir. */
  shower: () => {
    confetti({
      particleCount: 100,
      spread: 60,
      startVelocity: 30,
      origin: { y: 1 },
    });
  },

  /** 4 — ekran tagidan tepaga otiluvchi fontan. */
  fountain: () => {
    confetti({
      particleCount: 150,
      spread: 160,
      angle: -90,
      origin: { y: 0 },
    });
  },

  /** 5 — ekranning tasodifiy nuqtasidan qizil-oq doiralar portlashi. */
  randomBurst: () => {
    confetti({
      particleCount: 100,
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      colors: ["#bb0000", "#ffffff"],
      shapes: ["circle"],
      origin: { x: Math.random(), y: Math.random() },
    });
  },

  /** 6 — ekranning tasodifiy nuqtasidan katta, tezkor portlash. */
  randomBig: () => {
    confetti({
      particleCount: 200,
      startVelocity: 50,
      spread: 360,
      origin: { x: Math.random(), y: Math.random() },
    });
  },

  /** 7 — ekran oʻrtasidan yengil pushti portlash. */
  pink: () => {
    confetti({
      particleCount: 50,
      spread: 70,
      angle: 45,
      origin: { y: 0.7, x: 0.5 },
      colors: ["#ff69b4", "#ff1493"],
      shapes: ["circle"],
    });
  },

  /** 8 — ekran markazidan barcha yoʻnalishga tekis yoyilish. */
  center: () => {
    confetti({
      particleCount: 100,
      angle: 0,
      spread: 90,
      origin: { x: 0.5, y: 0.5 },
      ticks: 100,
    });
  },

  /** 9 — chap va oʻng burchakdan bir vaqtda otiluvchi ikki pushka. */
  sideCannons: () => {
    confetti({ particleCount: 100, angle: 60, spread: 55, origin: { x: 0, y: 0.6 } });
    confetti({ particleCount: 100, angle: 120, spread: 55, origin: { x: 1, y: 0.6 } });
  },
} as const;

export type ConfettiPresetName = keyof typeof confettiPresets;
