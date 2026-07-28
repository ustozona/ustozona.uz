import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "react-hooks/set-state-in-effect": "off",
      "@typescript-eslint/no-unused-vars": "warn"
    }
  },

  /* ══════════════════════════════════════════════════════════════════
     IJARA CHEGARALARI — ost-loyihalar uchun (docs/ost-loyihalar-
     arxitektura.md, A.5).

     Loyihada test freymvorki YOʻQ, shuning uchun bu chegaralar
     konvensiya emas, lint xatosi boʻlishi shart. Koʻp-ijarali
     sizishlarning deyarli hammasi bitta sababdan kelib chiqadi:
     mavjud read model boshqa filtr bilan qayta ishlatiladi.
     ══════════════════════════════════════════════════════════════════ */

  // DB klientiga faqat DAL va sessiya qatlamlari tegadi.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/server/dal/**",
      "src/server/db/**",
      "src/server/session.ts",
      "src/server/auth.ts",
      "src/server/play/**",
      "src/server/shogird/**",
    ],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["@/server/db/client", "**/server/db/client"],
          message:
            "DB klienti faqat src/server/dal/**, src/server/{play,shogird}/** va sessiya qatlamida ishlatiladi.",
        }],
      }],
    },
  },

  // Ishtirokchi va Shogird DAL'lari oʻqituvchi darvozasiga TEGMAYDI.
  {
    files: ["src/server/dal/play/**/*.ts", "src/server/dal/student/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["@/server/session", "**/server/session"],
            message:
              "Bu qatlam requireParticipant()/requireStudentViewer() darvozasidan foydalanadi — requireTeacher() emas.",
          },
          {
            group: ["@/server/dal/*", "@/server/dal/admin/*"],
            message:
              "Oʻqituvchi DAL'i QAYTA ISHLATILMAYDI — read model qayta yoziladi. Filtr almashtirish sizishning asosiy sababi.",
          },
        ],
      }],
    },
  },

  // Mahsulot komponentlari bir-birini import qilmaydi (ajratish seami).
  {
    files: ["src/components/{play,doska,shogird,boshqaruv}/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["@/components/dashboard/*", "@/components/sync/*"],
          message:
            "Mahsulot komponentlari src/components/ui/* dan quriladi; panel komponentlariga bogʻlanmaydi.",
        }],
      }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "*.js"
  ]),
]);

export default eslintConfig;
