import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "screens");
mkdirSync(OUT, { recursive: true });

const BASE = process.env.BASE_URL || "http://localhost:3000";

const shots = [
  { name: "dashboard", path: "/dashboard" },
  { name: "grades", path: "/dashboard/grades" },
  { name: "attendance", path: "/dashboard/attendance" },
  { name: "timetable", path: "/dashboard/timetable" },
  { name: "planner", path: "/dashboard/planner" },
  { name: "standards", path: "/dashboard/standards" },
  { name: "lessons", path: "/dashboard/lessons" },
];

// ── Standartlar sahifasi localStorage'dan oʻqiydi (boʻsh boshlanadi).
//    Skrinshot uchun ingliz tili standart toʻplamini 9-A sinfga seed qilamiz.
const STANDARDS_DATA = [
  { id: "V.01", covered: true,  bloom: "bilish",    desc: "Oʻquvchi salomlashish, tanishuv va xushmuomalalik iboralarini (hello, nice to meet you, thank you) tanib oladi va toʻgʻri talaffuz qila oladi.", file: "Salomlashish iboralari va tanishuv", foundational: true },
  { id: "V.02", covered: true,  bloom: "tushunish", desc: "Oʻquvchi oila aʼzolari va kundalik buyumlarga oid soʻz boyligini kontekstda toʻgʻri ishlatib bera oladi.", file: "Oila aʼzolari va egalik olmoshlari", foundational: true },
  { id: "V.03", covered: false, bloom: "qollash",   desc: "Oʻquvchi notanish soʻz maʼnosini matn konteksti orqali taxmin qila oladi va lugʻatdan mustaqil foydalanadi." },
  { id: "G.01", covered: true,  bloom: "tushunish", desc: "Oʻquvchi egalik olmoshlari (my, your, his, her) va to be feʼlining hozirgi shaklini toʻgʻri qoʻllay oladi.", file: "Oila aʼzolari va egalik olmoshlari", foundational: true },
  { id: "G.02", covered: true,  bloom: "qollash",   desc: "Oʻquvchi Present Simple zamonida kundalik ish-harakatlarni tasdiq, inkor va savol shaklida toʻgʻri ifodalay oladi.", file: "Present Simple: kundalik ishlar", foundational: true },
  { id: "G.03", covered: false, bloom: "tahlil",    desc: "Oʻquvchi like / donʼt like + -ing konstruksiyasi yordamida qiziqishlari haqida toʻgʻri gap tuza oladi.", file: "Hobbilar haqida suhbat" },
  { id: "S.01", covered: true,  bloom: "qollash",   desc: "Oʻquvchi oʻzini tanishtirib, oddiy savol-javob orqali qisqa dialog yurita oladi.", file: "Salomlashish iboralari va tanishuv" },
  { id: "S.02", covered: false, bloom: "yaratish",  desc: "Oʻquvchi sevimli mashgʻuloti haqida 1–2 daqiqalik ogʻzaki taqdimot tayyorlab, ravon gapira oladi.", assessType: "subjective" },
  { id: "L.01", covered: false, bloom: "tushunish", desc: "Oʻquvchi sekin va aniq aytilgan kundalik mavzudagi matndan asosiy maʼlumotni (ism, raqam, vaqt) ajratib ola oladi." },
  { id: "R.01", covered: true,  bloom: "tushunish", desc: "Oʻquvchi tanish mavzudagi qisqa matnni oʻqib, uning asosiy gʻoyasini (main idea) aniqlay oladi.", file: "Matnni oʻqib tushunish: asosiy gʻoya", foundational: true },
  { id: "R.02", covered: true,  bloom: "tahlil",    desc: "Oʻquvchi matndan aniq detallarni (scanning) topa oladi va savollarga matnga asoslanib javob bera oladi.", file: "Matnni oʻqib tushunish: asosiy gʻoya" },
  { id: "W.01", covered: true,  bloom: "yaratish",  desc: "Oʻquvchi paragraf tuzilishi va bogʻlovchilardan foydalanib qisqa norasmiy xat yoza oladi.", file: "Norasmiy xat yozish", assessType: "subjective" },
  { id: "W.02", covered: false, bloom: "yaratish",  desc: "Oʻquvchi berilgan mavzuda 80–100 soʻzlik izchil va xatosi kam insho yoza oladi.", assessType: "subjective" },
];

// ── Dars jadvali ham localStorage'dan oʻqiydi (boʻsh boshlanadi).
//    Haftalik takrorlanuvchi jadvalni seed qilamiz (classId = classes-data id, day 1=Du..6=Sh).
const timetableSeed = JSON.stringify([
  { id: "tt1",  classId: 1,  day: 1, startMin: 480, endMin: 525 }, // 5-A Du 08:00
  { id: "tt2",  classId: 1,  day: 3, startMin: 480, endMin: 525 }, // 5-A Ch 08:00
  { id: "tt3",  classId: 2,  day: 2, startMin: 530, endMin: 575 }, // 5-B Se 08:50
  { id: "tt4",  classId: 2,  day: 4, startMin: 530, endMin: 575 }, // 5-B Pa 08:50
  { id: "tt5",  classId: 3,  day: 1, startMin: 580, endMin: 625 }, // 6-A Du 09:40
  { id: "tt6",  classId: 3,  day: 3, startMin: 580, endMin: 625 }, // 6-A Ch 09:40
  { id: "tt7",  classId: 4,  day: 2, startMin: 635, endMin: 680 }, // 6-B Se 10:35
  { id: "tt8",  classId: 4,  day: 4, startMin: 635, endMin: 680 }, // 6-B Pa 10:35
  { id: "tt9",  classId: 9,  day: 4, startMin: 690, endMin: 735 }, // 10-A Pa 11:30
  { id: "tt10", classId: 5,  day: 5, startMin: 780, endMin: 825 }, // 7-A Ju 13:00
  { id: "tt11", classId: 6,  day: 1, startMin: 830, endMin: 875 }, // 7-B Du 13:50
  { id: "tt12", classId: 6,  day: 3, startMin: 830, endMin: 875 }, // 7-B Ch 13:50
  { id: "tt13", classId: 7,  day: 2, startMin: 880, endMin: 925 }, // 8-A Se 14:40
  { id: "tt14", classId: 8,  day: 3, startMin: 930, endMin: 975 }, // 9-A Ch 15:30
  { id: "tt15", classId: 10, day: 6, startMin: 600, endMin: 660 }, // Toʻgarak Sh 10:00
]);

const standardsSeed = JSON.stringify({
  state: {
    sets: [
      {
        id: "seed-eng-9a",
        name: "Ingliz tili — koʻnikma standartlari",
        subject: "Ingliz tili",
        classIds: ["9-a"],
        standards: STANDARDS_DATA,
        source: "CEFR",
        grade: "A2–B1",
        frameworkCode: "CEFR A2",
      },
    ],
    customSets: [],
  },
  version: 0,
});

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
await ctx.addInitScript(({ standards, timetable }) => {
  try {
    localStorage.setItem("murabbiyona-standard-sets-storage", standards);
    localStorage.setItem("murabbiyona-timetable-events", timetable);
  } catch {}
}, { standards: standardsSeed, timetable: timetableSeed });
const page = await ctx.newPage();

for (const s of shots) {
  try {
    await page.goto(BASE + s.path, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(1500); // let mount/anim settle

    // Darslar sahifasi sinf tanlashni talab qiladi — 6-A ni tanlab, boʻlimni ochamiz.
    if (s.name === "lessons") {
      try {
        await page.getByText("6-A", { exact: true }).first().click({ timeout: 4000 });
        await page.waitForTimeout(700);
        // Birinchi boʻlimni (unit) tanlash
        const unit = page.getByText(/Salomlashish|Oila|Present|Hobbi/).first();
        await unit.click({ timeout: 4000 });
        await page.waitForTimeout(800);
      } catch (e2) {
        console.log("note: lessons selection skipped :: " + e2.message);
      }
    }

    await page.screenshot({ path: join(OUT, s.name + ".png") });
    console.log("OK   " + s.name + "  <-  " + s.path);
  } catch (e) {
    console.log("FAIL " + s.name + "  <-  " + s.path + "  :: " + e.message);
  }
}

await browser.close();
console.log("done ->", OUT);
