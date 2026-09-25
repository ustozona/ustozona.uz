/* ════════════════════════════════════════════════════════════════════
   GʻILDIRAK TOVUSHI — Web Audio bilan SINTEZ, fayl yoʻq.

   Nega fayl emas: tiq-tiq ovozi 30 ms, gʻolib ohangi uchta nota. MP3
   yuklash, keshlash va oflayn rejimda yoʻqolishi — shuning uchun
   ortiqcha. Sintez darhol, internetsiz va istalgan tezlikda ishlaydi.

   ⚠️ Brauzer AudioContextʼni faqat foydalanuvchi harakatidan keyin
   ochadi. Shuning uchun kontekst birinchi aylantirish BOSILGANDA
   yaratiladi (`unlockSpinSound`), sahifa ochilganda emas.

   Ovoz balandligi past (0.1–0.15): sinfda proyektor karnayi baland
   boʻladi, tiq-tiq esa 4 soniya davomida 50–80 marta chaladi.
   ════════════════════════════════════════════════════════════════════ */

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Foydalanuvchi bosganda chaqiriladi — keyingi tovushlar shunda eshitiladi. */
export function unlockSpinSound(): void {
  audio();
}

function blip(a: AudioContext, at: number, freq: number, peak: number, length: number) {
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = "triangle";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(gain).connect(a.destination);
  osc.start(at);
  osc.stop(at + length + 0.02);
}

/** Boʻlak chegarasidan oʻtganda — qisqa «tiq». */
export function playSpinTick(): void {
  const a = audio();
  if (!a || a.state !== "running") return;
  blip(a, a.currentTime, 1500, 0.1, 0.035);
}

/** Gʻolib chiqqanda — koʻtariluvchi uch nota. */
export function playSpinWinner(): void {
  const a = audio();
  if (!a || a.state !== "running") return;
  const t = a.currentTime;
  [523.25, 659.25, 783.99].forEach((freq, i) => blip(a, t + i * 0.09, freq, 0.15, 0.22));
}
