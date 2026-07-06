/**
 * Quyosh chiqishi/botishi hisobi — SunCalc yadrosining ixcham varianti
 * (Vladimir Agafonkin, BSD). Kutubxonasiz, astronomik formulalar asosida.
 * Standart joylashuv — Toshkent; keyinchalik foydalanuvchi koordinatasiga
 * ulash mumkin.
 */

const TASHKENT = { lat: 41.2995, lng: 69.2401 };

const rad = Math.PI / 180;
const dayMs = 86_400_000;
const J1970 = 2_440_588;
const J2000 = 2_451_545;
const e = rad * 23.4397; // ekliptika egilishi

const toJulian = (d: Date) => d.valueOf() / dayMs - 0.5 + J1970;
const fromJulian = (j: number) => new Date((j + 0.5 - J1970) * dayMs);
const toDays = (d: Date) => toJulian(d) - J2000;

const solarMeanAnomaly = (d: number) => rad * (357.5291 + 0.98560028 * d);
const eclipticLongitude = (M: number) => {
  const C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const P = rad * 102.9372; // periheliy
  return M + C + P + Math.PI;
};
const declination = (l: number) => Math.asin(Math.sin(e) * Math.sin(l));

const J0 = 0.0009;
const julianCycle = (d: number, lw: number) => Math.round(d - J0 - lw / (2 * Math.PI));
const approxTransit = (Ht: number, lw: number, n: number) => J0 + (Ht + lw) / (2 * Math.PI) + n;
const solarTransitJ = (ds: number, M: number, L: number) =>
  J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
const hourAngle = (h: number, phi: number, d: number) =>
  Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d)));

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
  solarNoon: Date;
}

/** Berilgan sana uchun quyosh chiqishi, botishi va zenit vaqtini qaytaradi. */
export function getSunTimes(
  date: Date,
  lat: number = TASHKENT.lat,
  lng: number = TASHKENT.lng
): SunTimes {
  const lw = rad * -lng;
  const phi = rad * lat;
  const d = toDays(date);

  const n = julianCycle(d, lw);
  const ds = approxTransit(0, lw, n);
  const M = solarMeanAnomaly(ds);
  const L = eclipticLongitude(M);
  const dec = declination(L);

  const Jnoon = solarTransitJ(ds, M, L);
  const h0 = rad * -0.833; // quyosh diski + refraksiya
  const w0 = hourAngle(h0, phi, dec);
  const Jset = solarTransitJ(approxTransit(w0, lw, n), M, L);
  const Jrise = Jnoon - (Jset - Jnoon);

  return {
    sunrise: fromJulian(Jrise),
    sunset: fromJulian(Jset),
    solarNoon: fromJulian(Jnoon),
  };
}

export type DayPhase = "tong" | "kun" | "kech";

/**
 * Vaqtni quyosh holatiga qarab uch bosqichga ajratadi:
 * - `tong`  — tunning oxiri/tong (04:00) → quyosh zenitigacha
 * - `kun`   — zenit → quyosh botishi
 * - `kech`  — botishdan keyin va yarim tundan 04:00 gacha
 */
export function getDayPhase(now: Date, sun: SunTimes): DayPhase {
  const t = now.getTime();
  if (t >= sun.sunset.getTime()) return "kech";
  if (t < sun.sunrise.getTime()) return now.getHours() < 4 ? "kech" : "tong";
  return t < sun.solarNoon.getTime() ? "tong" : "kun";
}
