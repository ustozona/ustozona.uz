import { loadEnvFile } from "node:process";
import { defineConfig } from "drizzle-kit";

// drizzle-kit .env.local ni oʻzi yuklamaydi — Node 20.12+ built-in bilan yuklaymiz.
try {
  loadEnvFile(".env.local");
} catch {
  // .env.local hali yoʻq boʻlsa ham config ochilaveradi (xato push paytida chiqadi)
}

export default defineConfig({
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
