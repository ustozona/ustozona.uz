import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

/* ════════════════════════════════════════════════════════════════════
   ROLLAR — better-auth admin plugini uchun yagona rol xaritasi.

   DIQQAT: bu fayl `server-only` import qilmasligi SHART — uni runtime
   auth (src/server/auth.ts), CLI sxema-konfiguratsiyasi
   (scripts/auth-schema-config.ts) va auth-client ham yuklaydi.

   Bitta akkaunt bir nechta rolni vergul bilan saqlaydi
   (masalan "teacher,super_admin").

   - teacher      — oddiy foydalanuvchi (default), plugin API'lari yopiq
   - school_admin — ⚠️ ESKIRGAN, RUXSAT UCHUN ISHLATILMAYDI (2026-08-26).
                    Maktab admini endi `workspace_members.role = "admin"`
                    orqali aniqlanadi — bitta manba, faol maydon boʻyicha
                    (`requireWorkspaceAdmin()`, src/server/workspace.ts).
                    Bu yorliq faqat `/admin/users` roʻyxatida koʻrinadi;
                    ⛔ unga qarab hech qanday darvoza qurilmasin.
                    Sabab: docs/ish-maydoni-arxitektura.md §11.2
   - super_admin  — toʻliq boshqaruv. `adminAc` shablonida
                    `impersonate-admins` YOʻQ — super_admin boshqa
                    super_admin sifatida kira olmaydi (ataylab).
   - student      — Shogird (oʻquvchi) — oʻz maʼlumotini read-only koʻradi
   - guardian     — Shogird (ota-ona) — bogʻlangan farzand(lar)ini koʻradi

   student/guardian oʻqituvchi darvozalaridan OʻTMAYDI: `requireTeacher()`
   `isTeacher()` ni tekshiradi, yaʼni bu rollar `teachers` qatorini
   yaratib yubormaydi (src/server/session.ts).
   ════════════════════════════════════════════════════════════════════ */

export const ac = createAccessControl(defaultStatements);

export const roles = {
  teacher: ac.newRole({ user: [], session: [] }),
  school_admin: ac.newRole({ user: [], session: [] }),
  super_admin: ac.newRole({ ...adminAc.statements }),
  student: ac.newRole({ user: [], session: [] }),
  guardian: ac.newRole({ user: [], session: [] }),
} as const;

export const ADMIN_ROLES = ["super_admin"] as const;

/** Vergul bilan saqlangan rollarni massivga aylantiradi (default: teacher). */
export function rolesOf(user: { role?: string | null } | null | undefined): string[] {
  const raw = user?.role?.trim();
  if (!raw) return ["teacher"];
  return raw
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
}

export function isSuperAdmin(user: { role?: string | null } | null | undefined): boolean {
  return rolesOf(user).includes("super_admin");
}

export function isSchoolAdmin(user: { role?: string | null } | null | undefined): boolean {
  return rolesOf(user).includes("school_admin");
}

/** Oʻqituvchi darvozasi. `rolesOf` boʻsh rolni "teacher" deb qaytargani uchun
    mavjud (roli yozilmagan) akkauntlar avvalgidek ishlayveradi — faqat aniq
    `student`/`guardian` deb belgilanganlar chetlanadi. */
export function isTeacher(user: { role?: string | null } | null | undefined): boolean {
  return rolesOf(user).includes("teacher");
}

/** Shogird tomoni: oʻquvchi yoki ota-ona. */
export function isStudentViewer(user: { role?: string | null } | null | undefined): boolean {
  const list = rolesOf(user);
  return list.includes("student") || list.includes("guardian");
}
