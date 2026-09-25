/* ════════════════════════════════════════════════════════════════════
   DOSKA TOVUSHLARI — qoʻngʻiroq va taymer tugashi. Web Audio SINTEZ,
   fayl yoʻq (sabablari gʻildirakdagi bilan bir xil: `stage/spin-sound.ts`).

   Qoʻngʻiroq tovushi — ikki sinus qismi (asosiy va ~2.76× «qoʻngʻiroq»
   obertoni) sekin soʻnish bilan. Yumshoq, lekin sinf shovqinini kesib
   oʻtadi; baland «signal» bolalarni choʻchitadi.

   ⚠️ AudioContext faqat foydalanuvchi harakatidan keyin ochiladi. Taymer
   tugashi harakatsiz sodir boʻladi — shuning uchun kontekst taymer
   BOSHLANGANDA ochiladi (`unlockDoskaSound`). Sahifa yangilangandan
   keyin ishlab qolgan taymerning tugash ovozi eshitilmasligi mumkin —
   bu brauzer cheklovi.

   Kontekst gʻildirak bilan UMUMIY (`stage/audio-context.ts`): gʻildirakni
   aylantirgan oʻqituvchi uchun taymer ovozi ham ochiq boʻladi.
   ════════════════════════════════════════════════════════════════════ */

import { sharedAudioContext as audio } from "@/components/stage/audio-context";

/** Foydalanuvchi bosganda chaqiriladi — keyingi tovushlar shunda eshitiladi. */
export function unlockDoskaSound(): void {
  audio();
}

function partial(a: AudioContext, at: number, freq: number, peak: number, length: number) {
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(gain).connect(a.destination);
  osc.start(at);
  osc.stop(at + length + 0.05);
}

function ding(a: AudioContext, at: number, freq: number) {
  partial(a, at, freq, 0.18, 1.6);
  partial(a, at, freq * 2.76, 0.05, 0.9);
}

/** Qoʻngʻiroq — «ding-dong»: sinf eʼtiborini olish («2» tugmasi, menyu). */
export function playBell(): void {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + 0.02;
  ding(a, t, 880);
  ding(a, t + 0.45, 660);
}

/** Taymer tugadi — uch marta bir xil «ding». */
export function playTimerEnd(): void {
  const a = audio();
  if (!a || a.state !== "running") return;
  const t = a.currentTime + 0.02;
  [0, 0.4, 0.8].forEach((d) => ding(a, t + d, 988));
}
