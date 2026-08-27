import "server-only";
import { and, asc, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/server/db/client";
import { classes } from "@/server/db/schema";
import { ForbiddenError } from "@/server/session";
import { requireWorkspace } from "@/server/workspace";
import { assertCanManageClass } from "./class-teachers";
import { writeWorkspaceAudit } from "./workspace-audit";

/* ════════════════════════════════════════════════════════════════════
   MAʼMURIY SINF ↔ DARS GURUHI (§4.3).

   `classes` — bu allaqachon DARS GURUHI («7-A Ingliz 1-guruh»), sinf
   emas: unda `subject` ustuni bor. Maʼmuriy sinf («7-A») ham shu
   jadvalda, `parentClassId` orqali oʻz-oʻziga ishora bilan. Alohida
   jadval ATAYLAB olinmagan: oʻzbek tilida ikkalasi ham «sinf».

   ⛔ FAQAT IKKI DARAJA. Ota-sinfning oʻzi boshqasiga ulanmaydi, va
   farzandi bor sinf boshqasiga ulanmaydi. Bu tsikl tekshiruvidan
   soddaroq va §4.3 dagi modelga aynan mos: uchinchi daraja hech qanday
   savolga javob bermaydi.

   ⭐ Bogʻlanish baho, davomat va xulqqa TEGMAYDI — ular `classId` ga,
   yaʼni dars guruhiga bogʻlangan va shundayligicha toʻgʻri: ingliz
   1-guruh davomati 2-guruhnikidan alohida boʻlishi KERAK. Ota-sinf
   faqat «bu bolalar bir sinfda» faktini yozadi.
   ════════════════════════════════════════════════════════════════════ */

export type ClassRef = { id: string; name: string; subject: string | null };

export type ClassParentInfo = {
  /** Bu guruh ulangan maʼmuriy sinf. */
  parent: ClassRef | null;
  /** Oʻsha maʼmuriy sinfdagi BOSHQA guruhlar. */
  siblings: ClassRef[];
  /** Bu sinfning oʻzi maʼmuriy sinf boʻlsa — unga ulangan guruhlar. */
  children: ClassRef[];
  /** Ulash mumkin boʻlgan sinflar (faqat oʻzi hech kimga ulanmaganlari). */
  candidates: ClassRef[];
  /** Bogʻlanishni oʻzgartira oladimi — sinf egasi yoki maydon admini.
      ⚠️ Faqat tugmani yashirish uchun; hokimiyat `setClassParent` da. */
  canManage: boolean;
};

const REF = { id: classes.id, name: classes.name, subject: classes.subject };

export async function getClassParentInfo(classId: string): Promise<ClassParentInfo> {
  const ctx = await requireWorkspace();

  const [self] = await db
    .select({ id: classes.id, parentClassId: classes.parentClassId })
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.workspaceId, ctx.workspaceId)));
  if (!self) throw new ForbiddenError("Bunday sinf topilmadi");

  const children = await db
    .select(REF)
    .from(classes)
    .where(and(eq(classes.parentClassId, classId), isNull(classes.archivedAt)))
    .orderBy(asc(classes.sortOrder));

  let parent: ClassRef | null = null;
  let siblings: ClassRef[] = [];
  if (self.parentClassId) {
    const [p] = await db.select(REF).from(classes).where(eq(classes.id, self.parentClassId));
    parent = p ?? null;
    if (p) {
      siblings = await db
        .select(REF)
        .from(classes)
        .where(
          and(
            eq(classes.parentClassId, p.id),
            ne(classes.id, classId),
            isNull(classes.archivedAt)
          )
        )
        .orderBy(asc(classes.sortOrder));
    }
  }

  /* Farzandi bor sinf oʻzi ulanmaydi (ikki daraja qoidasi) — demak
     tanlov roʻyxati ham keraksiz. */
  const candidates =
    children.length > 0
      ? []
      : await db
          .select(REF)
          .from(classes)
          .where(
            and(
              eq(classes.workspaceId, ctx.workspaceId),
              ne(classes.id, classId),
              isNull(classes.parentClassId),
              isNull(classes.archivedAt)
            )
          )
          .orderBy(asc(classes.sortOrder));

  /* Roʻyxat bilan bitta chaqiruvda qaytadi — aks holda panel «ulash»
     tugmasini koʻrsatish uchun yana ikkita amal chaqirardi. */
  let canManage = true;
  try {
    await assertCanManageClass(classId);
  } catch {
    canManage = false;
  }

  return { parent, siblings, children, candidates, canManage };
}

/** Guruhni maʼmuriy sinfga ulaydi; `null` — bogʻlanishni uzadi. */
export async function setClassParent(
  classId: string,
  parentClassId: string | null
): Promise<void> {
  const ctx = await assertCanManageClass(classId);

  if (parentClassId === classId) {
    throw new ForbiddenError("Sinfni oʻziga ulab boʻlmaydi");
  }

  if (parentClassId) {
    const [child] = await db
      .select({ id: classes.id })
      .from(classes)
      .where(eq(classes.parentClassId, classId));
    if (child) {
      throw new ForbiddenError(
        "Bu sinfga guruhlar ulangan — u maʼmuriy sinf, uni boshqasiga ulab boʻlmaydi"
      );
    }

    const [parent] = await db
      .select({ name: classes.name, parentClassId: classes.parentClassId })
      .from(classes)
      .where(and(eq(classes.id, parentClassId), eq(classes.workspaceId, ctx.workspaceId)));
    if (!parent) throw new ForbiddenError("Bunday sinf topilmadi");
    if (parent.parentClassId) {
      throw new ForbiddenError("Bu sinf oʻzi boshqasiga ulangan — unga ulab boʻlmaydi");
    }

    await db
      .update(classes)
      .set({ parentClassId, updatedAt: new Date() })
      .where(eq(classes.id, classId));

    await writeWorkspaceAudit(ctx, {
      action: "class.set_parent",
      targetType: "class",
      targetId: classId,
      targetLabel: parent.name,
    });
    return;
  }

  await db
    .update(classes)
    .set({ parentClassId: null, updatedAt: new Date() })
    .where(eq(classes.id, classId));

  await writeWorkspaceAudit(ctx, {
    action: "class.set_parent",
    targetType: "class",
    targetId: classId,
  });
}
