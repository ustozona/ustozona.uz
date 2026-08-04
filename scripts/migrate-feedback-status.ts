import postgres from "postgres";

/* ════════════════════════════════════════════════════════════════════
   FIKR HOLATLARINI SODDALASHTIRISH (bir martalik data-migratsiya).

   Ishga tushirish:
     npm run feedback:migrate-status

   Statuslar 6 tadan 4 taga tushirildi: korilmoqda/rejalashtirilgan/
   bajarilmoqda → "jarayonda" birlashtirildi. Bu SQL-jadval ustuni
   (drizzle migratsiya emas — `status` ustuni oddiy text, tur oʻzgarmadi),
   shuning uchun faqat MAVJUD QATORLAR yangilanadi: ham denormallangan
   `status` ustuni, ham `data` JSONB ichidagi `status` maydoni.
   Idempotent: eski qiymat topilmasa hech narsa oʻzgarmaydi.
   ════════════════════════════════════════════════════════════════════ */

const OLD_TO_NEW: Record<string, string> = {
  korilmoqda: "jarayonda",
  rejalashtirilgan: "jarayonda",
  bajarilmoqda: "jarayonda",
};

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL topilmadi.");
  const sql = postgres(url, { prepare: false, max: 1 });

  let totalRows = 0;
  let totalCols = 0;
  for (const [oldStatus, newStatus] of Object.entries(OLD_TO_NEW)) {
    const colRows = await sql`
      UPDATE feedback SET status = ${newStatus}, updated_at = now()
      WHERE status = ${oldStatus}
    `;
    const dataRows = await sql`
      UPDATE feedback SET data = jsonb_set(data, '{status}', to_jsonb(${newStatus}::text)), updated_at = now()
      WHERE data->>'status' = ${oldStatus}
    `;
    totalCols += (colRows as unknown as { length: number }).length ?? 0;
    totalRows += (dataRows as unknown as { length: number }).length ?? 0;
    console.log(`"${oldStatus}" → "${newStatus}": status ustuni + data JSONB yangilandi.`);
  }

  console.log(`Tugadi. status ustuni: ${totalCols}, data JSONB: ${totalRows} qator qayta ishlandi.`);
}

/* `process.exit(0)` — postgres-js hovuzi ochiq qolsa Node hodisa
   sikli tugamaydi va skript qotib qoladi. neon-http stateless edi,
   shuning uchun ilgari bu kerak emasdi. */
main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
