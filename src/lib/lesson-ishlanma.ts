import type { ClassEnvironment } from "@/lib/lesson-models";
import type { LessonStudio, StudioBlock } from "@/lib/lesson-studio";

/* ════════════════════════════════════════════════════════════════════
   DARS ISHLANMASI — studiya rejasidan chop etiladigan hujjat.

   Maktabda oʻqituvchidan har dars uchun yozma ishlanma (konspekt)
   soʻraladi — rahbar va inspektor tekshiradi. Studiya rejasida uning
   hamma qismi allaqachon bor: maqsad, mezonlar, standartlar, bosqichlar
   (daqiqa, maqsad, oʻqituvchi va oʻquvchi faoliyati), materiallar,
   baholash usuli va uy vazifasi. Shu modul ularni rasmiy jadval
   koʻrinishidagi HTML ga yigʻadi.

   BITTA manba, ikki chiqish:
     • ekranda koʻrish va «Chop etish / PDF» (brauzer, `.a4-print`);
     • «Word'da yuklab olish» — Word HTML ni `.doc` sifatida ochadi va
       oʻqituvchi uni oʻzi tahrirlay oladi.
   Shuning uchun uslublar INLINE (Word tashqi CSS'ni oʻqimaydi).

   Matnlar (`labels`) chaqiruvchidan — tarjima UI tilida. Har foydalanuvchi
   matni `esc()` dan oʻtadi: reja AI yoki oʻqituvchi yozgan erkin matn.
   ════════════════════════════════════════════════════════════════════ */

export type IshlanmaLabels = {
  heading: string;
  subject: string;
  className: string;
  date: string;
  topic: string;
  model: string;
  duration: string;
  minutes: (count: number) => string;
  objective: string;
  criteria: string;
  standards: string;
  equipment: string;
  flow: string;
  colNo: string;
  colStage: string;
  colGoal: string;
  colTeacher: string;
  colStudents: string;
  colActivities: string;
  assessment: string;
  homework: string;
  reflection: string;
  signature: string;
  none: string;
  eqBoard: string;
  eqScreen: string;
  eqPrinter: string;
  eqPhones: string;
  eqPult: string;
  eqInternet: string;
  /** Blok qatori: tur nomi, sarlavha, usul. */
  kind: (block: StudioBlock) => string;
  method: (block: StudioBlock) => string | null;
  game: (block: StudioBlock) => string | null;
};

export type IshlanmaInput = {
  topic: string;
  subject: string;
  className: string;
  dateLabel: string;
  modelName: string;
  studio: LessonStudio;
  standards: { code: string; desc: string }[];
  env: ClassEnvironment;
  /** Oʻtilgan darsdan keyin yozilgan tahlil (boʻlsa). */
  reflection?: string;
};

export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const FONT = "font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.35;color:#000";
const CELL = "border:1px solid #000;padding:4pt 6pt;vertical-align:top;text-align:left";
const HEAD = `${CELL};background:#f2f2f2;font-weight:bold`;
const H2 = "font-size:12pt;font-weight:bold;margin:12pt 0 4pt";

function para(text: string | undefined, none: string): string {
  const v = text?.trim();
  return `<p style="margin:0 0 4pt">${v ? esc(v).replace(/\n/g, "<br>") : none}</p>`;
}

function list(items: string[], none: string): string {
  if (!items.length) return `<p style="margin:0 0 4pt">${none}</p>`;
  return `<ul style="margin:0 0 4pt 18pt;padding:0">${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
}

function blockLine(b: StudioBlock, L: IshlanmaLabels): string {
  const parts = [L.kind(b)];
  if (b.title?.trim()) parts[0] = `${L.kind(b)}: ${b.title.trim()}`;
  const extra = [L.method(b), L.game(b), b.setTitle ? `«${b.setTitle}»` : null].filter(Boolean) as string[];
  const head = esc(parts[0]) + (extra.length ? ` <i>(${esc(extra.join(", "))})</i>` : "");
  const brief = b.brief?.trim() ? `<br>${esc(b.brief.trim())}` : "";
  return `<div style="margin:0 0 3pt">• ${head}${brief}</div>`;
}

/** Hujjatning ichki qismi (sarlavhadan imzogacha) — ekran, chop etish va Word uchun. */
export function ishlanmaBody(input: IshlanmaInput, L: IshlanmaLabels): string {
  const { studio, env } = input;
  const blocks = studio.stages.flatMap((s) => s.blocks);

  const info: [string, string][] = [
    [L.subject, input.subject || L.none],
    [L.className, input.className || L.none],
    [L.date, input.dateLabel || L.none],
    [L.topic, input.topic || L.none],
    [L.model, input.modelName || L.none],
    [L.duration, L.minutes(studio.duration)],
  ];

  const equipment = [
    L.eqBoard,
    env.smartboard || env.projector ? L.eqScreen : null,
    env.printer ? L.eqPrinter : null,
    env.phones ? L.eqPhones : null,
    env.pult ? L.eqPult : null,
    env.internet ? L.eqInternet : null,
    ...blocks.filter((b) => b.setTitle).map((b) => `${L.kind(b)}: «${b.setTitle}»`),
  ].filter((x): x is string => Boolean(x));

  const rows = studio.stages
    .map((s, i) => {
      const acts = s.blocks.filter((b) => b.kind !== "homework").map((b) => blockLine(b, L)).join("");
      return `<tr>
<td style="${CELL};text-align:center">${i + 1}</td>
<td style="${CELL}"><b>${esc(s.name)}</b><br>${esc(L.minutes(s.minutes))}</td>
<td style="${CELL}">${s.goal?.trim() ? esc(s.goal) : L.none}</td>
<td style="${CELL}">${s.teacher?.trim() ? esc(s.teacher) : L.none}</td>
<td style="${CELL}">${s.students?.trim() ? esc(s.students) : L.none}</td>
<td style="${CELL}">${acts || L.none}</td>
</tr>`;
    })
    .join("");

  const checks = blocks.filter((b) => b.kind === "check" || b.kind === "exit");
  const homework = blocks.filter((b) => b.kind === "homework");

  return `<div style="${FONT}">
<p style="text-align:center;font-size:14pt;font-weight:bold;margin:0 0 10pt;letter-spacing:1pt">${esc(L.heading)}</p>
<table style="border-collapse:collapse;width:100%;margin:0 0 6pt">
${info.map(([k, v]) => `<tr><td style="${HEAD};width:28%">${esc(k)}</td><td style="${CELL}">${esc(v)}</td></tr>`).join("")}
</table>
<p style="${H2}">${esc(L.objective)}</p>
${para(studio.objective, L.none)}
<p style="${H2}">${esc(L.criteria)}</p>
${list(studio.criteria ?? [], L.none)}
<p style="${H2}">${esc(L.standards)}</p>
${list(input.standards.map((s) => (s.desc ? `${s.code} — ${s.desc}` : s.code)), L.none)}
<p style="${H2}">${esc(L.equipment)}</p>
${list(equipment, L.none)}
<p style="${H2}">${esc(L.flow)}</p>
<table style="border-collapse:collapse;width:100%">
<thead><tr>
<th style="${HEAD};width:4%">${esc(L.colNo)}</th>
<th style="${HEAD};width:14%">${esc(L.colStage)}</th>
<th style="${HEAD};width:18%">${esc(L.colGoal)}</th>
<th style="${HEAD};width:20%">${esc(L.colTeacher)}</th>
<th style="${HEAD};width:20%">${esc(L.colStudents)}</th>
<th style="${HEAD};width:24%">${esc(L.colActivities)}</th>
</tr></thead>
<tbody>${rows}</tbody>
</table>
<p style="${H2}">${esc(L.assessment)}</p>
${checks.length ? checks.map((b) => blockLine(b, L)).join("") : `<p style="margin:0 0 4pt">${L.none}</p>`}
<p style="${H2}">${esc(L.homework)}</p>
${homework.length ? homework.map((b) => blockLine(b, L)).join("") : `<p style="margin:0 0 4pt">${L.none}</p>`}
<p style="${H2}">${esc(L.reflection)}</p>
${input.reflection?.trim() ? para(input.reflection, L.none) : `<p style="margin:0">______________________________________________________________</p><p style="margin:0">______________________________________________________________</p>`}
<p style="margin:18pt 0 0">${esc(L.signature)}</p>
</div>`;
}

/** Word (`.doc`) — HTML hujjat, Word uni tahrirlanadigan qilib ochadi. */
export function ishlanmaWordHtml(input: IshlanmaInput, L: IshlanmaLabels): string {
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${esc(L.heading)}</title>
<style>@page{size:A4;margin:2cm 1.5cm}body{margin:0}</style></head>
<body>${ishlanmaBody(input, L)}</body></html>`;
}

/** Fayl nomi — oʻqituvchi papkasida tanish boʻlsin. */
export function ishlanmaFileName(heading: string, topic: string): string {
  const clean = `${heading} — ${topic}`.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim();
  return `${clean.slice(0, 100)}.doc`;
}
