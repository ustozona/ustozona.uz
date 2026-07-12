import { CLASS_DATA } from "@/lib/grades-data";
import {
  DEFAULT_SKILL_DEFS,
  DEFAULT_REWARD_DEFS,
  defaultSkillId,
  defaultRewardId,
  todayDateKey,
  type BehaviorEvent,
  type BehaviorRedemption,
} from "@/lib/behavior-data";
import { DEMO_TIMETABLE, seeded } from "./demo-attendance";

/* ════════════════════════════════════════════════════════════════════
   DEMO XULQ GENERATORI — faqat scripts/seed.ts uchun.

   Oxirgi ~6 hafta (42 kun, seed ishga tushgan kundan orqaga) boʻyicha
   har sinfning DEMO_TIMETABLE'dagi dars kunlariga eventlar yoziladi:
   ~80/20 ijobiy/salbiy (reja talabi), koʻnikmalar DAL server-side seed
   bilan BIR XIL deterministik id'larda (bhs-{slug}-{teacherId}) —
   shuning uchun demo teacher'da hisobot donut'i segmentlari jonli
   koʻnikmalarga bogʻlanadi.

   Balansi yetarli oʻquvchilarning bir qismi mukofot sarflagan boʻladi
   (doʻkon tarixi ham koʻrinsin). Sanalar bugunga nisbatan — "Bugun /
   Shu hafta / Shu oy" davr filtrlari boʻsh chiqmaydi.
   ════════════════════════════════════════════════════════════════════ */

const DAYS_BACK = 42; // ~6 hafta
/** Oʻquvchi bitta dars kunida event olish ehtimoli. */
const EVENT_CHANCE = 0.4;
/** Ijobiy event ulushi (reja: 80/20). */
const POSITIVE_SHARE = 0.8;

const POSITIVE_DEFS = DEFAULT_SKILL_DEFS.filter((s) => s.points > 0);
const NEGATIVE_DEFS = DEFAULT_SKILL_DEFS.filter((s) => s.points < 0);

export type DemoBehaviorEventRow = BehaviorEvent & { classId: string };

export function demoBehaviorData(teacherId: string): {
  events: DemoBehaviorEventRow[];
  redemptions: BehaviorRedemption[];
} {
  const events: DemoBehaviorEventRow[] = [];
  const redemptions: BehaviorRedemption[] = [];

  const today = new Date();
  const dayAt = (back: number) =>
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - back);

  Object.values(CLASS_DATA).forEach((data, classIdx) => {
    const classId = data.info.id;
    const cfg = DEMO_TIMETABLE[classId];
    if (!cfg) return;

    const rnd = seeded(classIdx * 131 + 7);
    const balances = new Map<string, number>();

    for (let back = DAYS_BACK - 1; back >= 0; back--) {
      const d = dayAt(back);
      if (!cfg.days.includes(d.getDay())) continue;
      const dateKey = todayDateKey(d);

      data.students.forEach((st, si) => {
        if (rnd() >= EVENT_CHANCE) return;
        const defs = rnd() < POSITIVE_SHARE ? POSITIVE_DEFS : NEGATIVE_DEFS;
        const def = defs[Math.floor(rnd() * defs.length)];
        const createdAt = new Date(
          d.getFullYear(),
          d.getMonth(),
          d.getDate(),
          8 + Math.floor(rnd() * 6),
          Math.floor(rnd() * 60)
        ).toISOString();
        events.push({
          id: `bhe-seed-${classId}-${dateKey}-${si}`,
          classId,
          studentId: st.id,
          skillId: defaultSkillId(def.slug, teacherId),
          name: def.name,
          emoji: def.emoji,
          description: def.description,
          points: def.points,
          date: dateKey,
          createdAt,
        });
        balances.set(st.id, (balances.get(st.id) ?? 0) + def.points);
      });
    }

    /* Doʻkon tarixi: balansi yetarli oʻquvchilarning bir qismi oxirgi
       ~10 kun ichida bitta mukofot sarflagan. */
    data.students.forEach((st, si) => {
      const balance = balances.get(st.id) ?? 0;
      if (balance < 10 || rnd() >= 0.3) return;
      const affordable = DEFAULT_REWARD_DEFS.filter((r) => r.cost <= balance);
      if (affordable.length === 0) return;
      const reward = affordable[Math.floor(rnd() * affordable.length)];
      const d = dayAt(Math.floor(rnd() * 10));
      redemptions.push({
        id: `bhrd-seed-${classId}-${si}`,
        classId,
        studentId: st.id,
        rewardId: defaultRewardId(reward.slug, teacherId),
        name: reward.name,
        emoji: reward.emoji,
        cost: reward.cost,
        date: todayDateKey(d),
        createdAt: new Date(
          d.getFullYear(),
          d.getMonth(),
          d.getDate(),
          14,
          Math.floor(rnd() * 60)
        ).toISOString(),
      });
    });
  });

  return { events, redemptions };
}
