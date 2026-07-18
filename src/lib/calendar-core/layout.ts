/* ════════════════════════════════════════════════════════════════════
   CALENDAR-CORE · LAYOUT — vaqt-toʻr geometriyasi (pure funksiyalar).
   px/daqiqa masshtabi isteʼmolchidan keladi (TodayRail 1px/daq,
   planner/timetable 3px/daq = 180px/soat).
   ════════════════════════════════════════════════════════════════════ */

export type LayoutBox = { top: number; height: number };

/** Daqiqa → vertikal px (toʻr boshidan). */
export function timeToY(min: number, rangeStartMin: number, pxPerMin: number): number {
  return (min - rangeStartMin) * pxPerMin;
}

/** Vertikal px → daqiqa. */
export function yToMin(y: number, rangeStartMin: number, pxPerMin: number): number {
  return rangeStartMin + y / pxPerMin;
}

/** Vaqt oraligʻi → blok geometriyasi (minHeight bilan). */
export function spanToBox(
  startMin: number,
  endMin: number,
  rangeStartMin: number,
  pxPerMin: number,
  minHeight = 22,
): LayoutBox {
  return {
    top: timeToY(startMin, rangeStartMin, pxPerMin),
    height: Math.max((endMin - startMin) * pxPerMin, minHeight),
  };
}

/** Soat chiziqlari uchun daqiqa belgilari: [startHour*60, …, (endHour-1)*60]. */
export function hourMarks(startHour: number, endHour: number): number[] {
  return Array.from({ length: endHour - startHour }, (_, i) => (startHour + i) * 60);
}

/** Koʻrinadigan diapazon: elementlar boʻlsa ularning chetlaridan (pad bilan,
    soatga yaxlitlab), boʻlmasa fallback soatlardan. */
export function rangeFromSpans(
  spans: readonly { startMin: number; endMin: number }[],
  fallback: { startHour: number; endHour: number },
  padMin = 30,
): { startMin: number; endMin: number } {
  if (!spans.length) return { startMin: fallback.startHour * 60, endMin: fallback.endHour * 60 };
  let lo = Infinity, hi = -Infinity;
  for (const s of spans) { lo = Math.min(lo, s.startMin); hi = Math.max(hi, s.endMin); }
  return {
    startMin: Math.max(0, Math.floor((lo - padMin) / 60) * 60),
    endMin: Math.min(24 * 60, Math.ceil((hi + padMin) / 60) * 60),
  };
}

export type PackedItem<T> = { item: T; col: number; cols: number };

/** Ustma-ust tushgan bloklarni yonma-yon ustunlarga joylash (greedy
    interval packing, Google Calendar uslubi). Har kesishuv-klasteri oʻz
    ustun soniga ega — blok kengligi = 1/cols. */
export function packColumns<T>(
  items: readonly T[],
  getSpan: (t: T) => { startMin: number; endMin: number },
): PackedItem<T>[] {
  const sorted = [...items].sort((a, b) => {
    const sa = getSpan(a), sb = getSpan(b);
    return sa.startMin - sb.startMin || sb.endMin - sa.endMin;
  });

  const out: PackedItem<T>[] = [];
  let cluster: { item: T; col: number }[] = [];
  let colEnds: number[] = []; // har ustunning band-tugash daqiqasi
  let clusterEnd = -Infinity;

  const flush = () => {
    const cols = colEnds.length;
    for (const c of cluster) out.push({ item: c.item, col: c.col, cols });
    cluster = [];
    colEnds = [];
    clusterEnd = -Infinity;
  };

  for (const item of sorted) {
    const { startMin, endMin } = getSpan(item);
    if (cluster.length && startMin >= clusterEnd) flush();
    let col = colEnds.findIndex((end) => end <= startMin);
    if (col === -1) { col = colEnds.length; colEnds.push(endMin); }
    else colEnds[col] = endMin;
    cluster.push({ item, col });
    clusterEnd = Math.max(clusterEnd, endMin);
  }
  flush();
  return out;
}
