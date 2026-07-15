import { neon } from "@neondatabase/serverless";

/* ════════════════════════════════════════════════════════════════════
   SUPER-ADMIN TAYINLASH (bootstrap).

   Ishga tushirish:
     npm run admin:promote -- bek.kodchi@gmail.com
     npm run admin:promote -- someone@mail.com school_admin

   Email boʻyicha user topib, rollar roʻyxatiga berilgan rolni QOʻSHADI
   (union — mavjud rollar saqlanadi, masalan "teacher,super_admin").
   Idempotent: rol allaqachon boʻlsa hech narsa oʻzgarmaydi.
   ════════════════════════════════════════════════════════════════════ */

const VALID_ROLES = ["teacher", "school_admin", "super_admin"];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL topilmadi. Ishga tushirish: npm run admin:promote -- <email> [rol]",
    );
  }

  const [email, roleArg] = process.argv.slice(2);
  const role = roleArg ?? "super_admin";
  if (!email) throw new Error("Email berilmadi: npm run admin:promote -- <email> [rol]");
  if (!VALID_ROLES.includes(role)) {
    throw new Error(`Notoʻgʻri rol "${role}". Ruxsat etilgan: ${VALID_ROLES.join(", ")}`);
  }

  const sql = neon(url);
  const rows = await sql`SELECT id, role FROM "user" WHERE email = ${email}`;
  if (rows.length === 0) {
    throw new Error(`Foydalanuvchi topilmadi: ${email} (avval tizimga kirib roʻyxatdan oʻting)`);
  }

  const current = ((rows[0].role as string | null) ?? "teacher")
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
  if (current.includes(role)) {
    console.log(`${email} allaqachon "${role}" roliga ega (rollar: ${current.join(",")}).`);
    return;
  }

  const next = [...current, role].join(",");
  await sql`UPDATE "user" SET role = ${next} WHERE id = ${rows[0].id as string}`;
  console.log(`${email} yangilandi: rollar endi "${next}".`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
