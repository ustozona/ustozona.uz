import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "@/server/db/schema";

/* ════════════════════════════════════════════════════════════════════
   Blog uchun bitta demo (mock) post — /blog va /blog/[slug] boʻsh
   boʻlmasin, tipografika shkalasini sinab koʻrish uchun.

   Ishga tushirish:
     npx tsx --env-file=.env.local scripts/seed-blog-demo.ts

   IDEMPOTENT: slug boʻyicha upsert — qayta ishga tushirish xato bermaydi.
   scripts/seed.ts dagi demo oʻqituvchi (email: demo@ustozona.uz yoki
   SEED_EMAIL) allaqachon mavjud boʻlishi kerak — avval `npm run db:seed`.
   ════════════════════════════════════════════════════════════════════ */

const DEMO_EMAIL = process.env.SEED_EMAIL || "demo@ustozona.uz";

const SLUG = "yangi-oquv-yilini-sozlash-demo";

const CONTENT = `
<h1>Oʻquv yilini pedagogik jihatdan toʻgʻri sozlash</h1>
<p>Oʻquv yili — Ustozonadagi barcha ishning asosi: sinflar, darslar, jurnal va davomat shu davr ichida yashaydi. Uni sozlash bir necha daqiqa vaqt oladi, ammo butun oʻquv yili davomida taʼlim jarayonini tartibli saqlaydi.</p>
<h2>Nega bosqichma-bosqich baholash muhim</h2>
<p>Choraklarning borligi baholashni bitta katta yakuniy natija emas, bir necha kichik bosqichga boʻlib koʻrish imkonini beradi. Har bir chorak — oʻquvchi uchun oʻz xatosini tuzatib, keyingi bosqichga tayyor holda oʻtish imkoniyati.</p>
<h3>Amaliy qadam</h3>
<p>Sozlamalar → Kalendar boʻlimiga oʻting, oʻquv yilining boshlanish/tugash sanalarini kiriting, keyin choraklarni qoʻshing. Shundan soʻng sinf yaratishga tayyorsiz.</p>
<h2>Koʻp yillik ish</h2>
<p>Yangi oʻquv yili boshlanganda eski maʼlumotlarni oʻchirish shart emas — Ustozona bir nechta oʻquv yilini parallel saqlaydi. Bu shunchaki arxiv emas: oʻtgan yillar saqlanib qolgani uchun bir sinfning qaysi chorakda koʻproq qiynalganini orqaga qaytib solishtirish mumkin boʻladi.</p>
`.trim();

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(sql, { schema });

  const [teacher] = await db
    .select({ id: schema.teachers.id })
    .from(schema.teachers)
    .where(eq(schema.teachers.email, DEMO_EMAIL));
  if (!teacher) {
    console.error(`Demo oʻqituvchi topilmadi (${DEMO_EMAIL}). Avval: npm run db:seed`);
    process.exit(1);
  }

  const [existing] = await db
    .select({ id: schema.blogPosts.id })
    .from(schema.blogPosts)
    .where(eq(schema.blogPosts.slug, SLUG));

  const values = {
    teacherId: teacher.id,
    title: "Oʻquv yilini pedagogik jihatdan toʻgʻri sozlash",
    slug: SLUG,
    excerpt: "Choraklar, koʻp yillik ish va oʻquv yilini sozlashning pedagogik mohiyati — demo maqola.",
    coverImageUrl: null,
    content: CONTENT,
    status: "published" as const,
    publishedAt: new Date(),
    updatedAt: new Date(),
  };

  if (existing) {
    await db.update(schema.blogPosts).set(values).where(eq(schema.blogPosts.id, existing.id));
    console.log(`Demo post yangilandi: /blog/${SLUG}`);
  } else {
    await db.insert(schema.blogPosts).values({ id: crypto.randomUUID(), ...values });
    console.log(`Demo post yaratildi: /blog/${SLUG}`);
  }

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
