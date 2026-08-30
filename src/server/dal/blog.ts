import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { blogComments, blogPosts, teachers } from "@/server/db/schema";
import type { BlogPublishedSnapshot } from "@/server/db/schema/blog";
import { getSession, requireTeacher } from "@/server/session";

/* ════════════════════════════════════════════════════════════════════
   BLOG DAL — koʻp-mualliflik maqolalar. Yozish/tahrirlash faqat egasi
   (feedback.ts naqshi bilan bir xil), oʻqish (ochiq lenta) va fikr
   bildirish hammaga ochiq.

   ⚠️ NASHR MODELI (docs/blog-nashr-modeli.md): ishchi nusxa ≠ nashr
   qilingan versiya. Muharrir FAQAT ishchi ustunlarga (title/excerpt/
   content/coverImageUrl) yozadi. Ommaviy sahifa esa `publishedSnapshot`
   dan oʻqiydi — u faqat «Nashr qilish»/«Yangilash» bosilganda yangilanadi.
   ════════════════════════════════════════════════════════════════════ */

export type BlogPostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  status: string;
  publishedAt: string | null;
  updatedAt: string;
  viewCount: number;
  authorName: string;
  authorAvatarUrl: string | null;
};

export type BlogPostFull = BlogPostSummary & {
  content: string;
  teacherId: string;
  /** `null` = hali nashr qilinmagan (qoralama). */
  publishedSnapshot: BlogPublishedSnapshot | null;
  /** Nashr qilingan, lekin ishchi nusxa suratdan farq qiladi. */
  hasUnpublishedChanges: boolean;
};

export type BlogComment = {
  id: string;
  /** `null` = root fikr; aks holda javob berilgan root fikr id'si. */
  parentId: string | null;
  name: string;
  /** Yumshoq oʻchirilgan fikrda `""` (UI «[oʻchirilgan]» koʻrsatadi). */
  body: string;
  createdAt: string;
  editedAt: string | null;
  deleted: boolean;
  /** Koʻruvchi shu fikr egasi — «Tahrirlash / Oʻchirish». */
  mine: boolean;
  /** Fikr egasi = maqola muallifi — «Muallif» chipi. */
  isPostAuthor: boolean;
  /** Hisobga bogʻlanmagan eski (anonim) fikrlarda `null`. */
  authorAvatarUrl: string | null;
};

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[ʻʼ'`]/g, "")
    .replace(/[^a-z0-9а-яёʻʼ\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80) || "maqola";
}

/** "studio" — /blog/studio statik marshruti bilan toʻqnashmasin
    (Next.js statik segment dinamikdan ustun boʻlsa ham, bu slug muharrirga
    hech qachon URL orqali yetib bormasligi uchun band qilingan). */
const RESERVED_SLUGS = new Set(["studio"]);

async function uniqueSlug(title: string, excludeId?: string): Promise<string> {
  const rawBase = slugify(title);
  const base = RESERVED_SLUGS.has(rawBase) ? `${rawBase}-maqola` : rawBase;
  let slug = base;
  let n = 1;
  while (true) {
    const [existing] = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug));
    if (!existing || existing.id === excludeId) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

/** Nashr qilingan post uchun koʻrsatiladigan maydonlar — suratdan, u
 *  yoʻq boʻlsa (nazariy holat) ishchi ustunlardan. */
function resolvePublicFields(row: {
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  publishedSnapshot: BlogPublishedSnapshot | null;
}): { title: string; excerpt: string; content: string; coverImageUrl: string | null } {
  const s = row.publishedSnapshot;
  return {
    title: s?.title ?? row.title,
    excerpt: s?.excerpt ?? row.excerpt,
    content: s?.content ?? row.content,
    coverImageUrl: s?.coverImageUrl ?? row.coverImageUrl,
  };
}

function computeDirty(
  row: { status: string; title: string; excerpt: string; content: string; coverImageUrl: string | null },
  snap: BlogPublishedSnapshot | null,
): boolean {
  if (row.status !== "published") return false; // qoralama: amal = «Nashr qilish», «Yangilash» emas
  if (!snap) return true;
  return (
    row.title !== snap.title ||
    row.excerpt !== snap.excerpt ||
    row.content !== snap.content ||
    (row.coverImageUrl ?? null) !== (snap.coverImageUrl ?? null)
  );
}

/** Ochiq lenta — faqat nashr qilingan postlar, eng yangisi birinchi. */
export async function listPublishedPosts(): Promise<BlogPostSummary[]> {
  const rows = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
      content: blogPosts.content,
      coverImageUrl: blogPosts.coverImageUrl,
      publishedSnapshot: blogPosts.publishedSnapshot,
      status: blogPosts.status,
      publishedAt: blogPosts.publishedAt,
      updatedAt: blogPosts.updatedAt,
      viewCount: blogPosts.viewCount,
      authorName: teachers.name,
      authorAvatarUrl: teachers.avatarUrl,
    })
    .from(blogPosts)
    .innerJoin(teachers, eq(teachers.id, blogPosts.teacherId))
    .where(eq(blogPosts.status, "published"))
    .orderBy(desc(blogPosts.publishedAt));

  return rows.map((r) => {
    const pub = resolvePublicFields(r);
    return {
      id: r.id,
      slug: r.slug,
      title: pub.title,
      excerpt: pub.excerpt,
      coverImageUrl: pub.coverImageUrl,
      status: r.status,
      publishedAt: r.publishedAt?.toISOString() ?? null,
      updatedAt: r.updatedAt.toISOString(),
      viewCount: r.viewCount,
      authorName: r.authorName,
      authorAvatarUrl: r.authorAvatarUrl,
    };
  });
}

/** Bitta post — slug boʻyicha, faqat nashr qilingan (ochiq sahifa uchun).
 *  Koʻrsatiladigan matn HAR DOIM `publishedSnapshot` dan. */
export async function getPublishedPostBySlug(slug: string): Promise<BlogPostFull | null> {
  const [row] = await db
    .select({
      id: blogPosts.id,
      teacherId: blogPosts.teacherId,
      slug: blogPosts.slug,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
      content: blogPosts.content,
      coverImageUrl: blogPosts.coverImageUrl,
      publishedSnapshot: blogPosts.publishedSnapshot,
      status: blogPosts.status,
      publishedAt: blogPosts.publishedAt,
      updatedAt: blogPosts.updatedAt,
      viewCount: blogPosts.viewCount,
      authorName: teachers.name,
      authorAvatarUrl: teachers.avatarUrl,
    })
    .from(blogPosts)
    .innerJoin(teachers, eq(teachers.id, blogPosts.teacherId))
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")));
  if (!row) return null;
  const pub = resolvePublicFields(row);
  return {
    id: row.id,
    teacherId: row.teacherId,
    slug: row.slug,
    title: pub.title,
    excerpt: pub.excerpt,
    content: pub.content,
    coverImageUrl: pub.coverImageUrl,
    publishedSnapshot: row.publishedSnapshot,
    hasUnpublishedChanges: computeDirty(row, row.publishedSnapshot),
    status: row.status,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
    viewCount: row.viewCount,
    authorName: row.authorName,
    authorAvatarUrl: row.authorAvatarUrl,
  };
}

/** Preview (draftMode) — slug boʻyicha ISHCHI nusxani qaytaradi, LEKIN
 *  faqat postning egasiga. Egasi boʻlmasa yoki post topilmasa `null`
 *  (chaqiruvchi ommaviy versiyaga qaytadi). */
export async function getPreviewPostBySlug(slug: string): Promise<BlogPostFull | null> {
  const session = await getSession();
  if (!session) return null;
  const [row] = await db
    .select({
      id: blogPosts.id,
      teacherId: blogPosts.teacherId,
      slug: blogPosts.slug,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
      content: blogPosts.content,
      coverImageUrl: blogPosts.coverImageUrl,
      publishedSnapshot: blogPosts.publishedSnapshot,
      status: blogPosts.status,
      publishedAt: blogPosts.publishedAt,
      updatedAt: blogPosts.updatedAt,
      viewCount: blogPosts.viewCount,
      authorName: teachers.name,
      authorAvatarUrl: teachers.avatarUrl,
    })
    .from(blogPosts)
    .innerJoin(teachers, eq(teachers.id, blogPosts.teacherId))
    .where(eq(blogPosts.slug, slug));
  if (!row) return null;
  // teachers.id === auth user.id (session.ts: requireTeacher)
  if (row.teacherId !== session.user.id) return null;
  return {
    id: row.id,
    teacherId: row.teacherId,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverImageUrl: row.coverImageUrl,
    publishedSnapshot: row.publishedSnapshot,
    hasUnpublishedChanges: computeDirty(row, row.publishedSnapshot),
    status: row.status,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
    viewCount: row.viewCount,
    authorName: row.authorName,
    authorAvatarUrl: row.authorAvatarUrl,
  };
}

/** Joriy oʻqituvchining barcha postlari (qoralama + nashr + arxiv), dashboard uchun. */
export async function listMyPosts(): Promise<BlogPostSummary[]> {
  const teacher = await requireTeacher();
  const rows = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
      coverImageUrl: blogPosts.coverImageUrl,
      status: blogPosts.status,
      publishedAt: blogPosts.publishedAt,
      updatedAt: blogPosts.updatedAt,
      viewCount: blogPosts.viewCount,
    })
    .from(blogPosts)
    .where(eq(blogPosts.teacherId, teacher.id))
    .orderBy(desc(blogPosts.updatedAt));

  return rows.map((r) => ({
    ...r,
    publishedAt: r.publishedAt?.toISOString() ?? null,
    updatedAt: r.updatedAt.toISOString(),
    authorName: teacher.name,
    authorAvatarUrl: teacher.avatarUrl,
  }));
}

/** Bitta post — muharrir uchun, faqat egasi. Ishchi ustunlarni qaytaradi. */
export async function getMyPostById(id: string): Promise<BlogPostFull | null> {
  const teacher = await requireTeacher();
  const [row] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
  if (!row || row.teacherId !== teacher.id) return null;
  return {
    id: row.id,
    teacherId: row.teacherId,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverImageUrl: row.coverImageUrl,
    publishedSnapshot: row.publishedSnapshot,
    hasUnpublishedChanges: computeDirty(row, row.publishedSnapshot),
    status: row.status,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
    viewCount: row.viewCount,
    authorName: teacher.name,
    authorAvatarUrl: teacher.avatarUrl,
  };
}

export async function createPost(): Promise<{ id: string }> {
  const teacher = await requireTeacher();
  const id = crypto.randomUUID();
  const title = "Sarlavhasiz maqola";
  const slug = await uniqueSlug(title);
  await db.insert(blogPosts).values({
    id,
    teacherId: teacher.id,
    title,
    slug,
    excerpt: "",
    content: "",
    status: "draft",
  });
  return { id };
}

export type SavePostInput = {
  id: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  content: string;
};

export async function savePost(input: SavePostInput): Promise<void> {
  const teacher = await requireTeacher();
  const [row] = await db.select().from(blogPosts).where(eq(blogPosts.id, input.id));
  if (!row || row.teacherId !== teacher.id) return;
  const title = input.title.trim() || "Sarlavhasiz maqola";
  /* Slug FAQAT hali bir marta ham nashr qilinmagan qoralamada sarlavhadan
     qayta hisoblanadi. Birinchi nashrdan keyin muzlaydi — aks holda
     ulashilgan havolalar jimgina 404 boʻlardi (§6). */
  const slugFrozen = row.status !== "draft" || row.publishedAt !== null;
  const slug = !slugFrozen && title !== row.title ? await uniqueSlug(title, row.id) : row.slug;
  await db
    .update(blogPosts)
    .set({
      title,
      slug,
      excerpt: input.excerpt,
      coverImageUrl: input.coverImageUrl,
      content: input.content,
      updatedAt: new Date(),
    })
    .where(eq(blogPosts.id, input.id));
}

/** «Nashr qilish» / «Yangilash» — ishchi nusxani muzlatilgan suratga
 *  koʻchiradi. Ommaviy koʻrinishni oʻzgartiradigan YAGONA amal. */
export async function publishPost(id: string): Promise<{ slug: string } | null> {
  const teacher = await requireTeacher();
  const [row] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
  if (!row || row.teacherId !== teacher.id) return null;
  const snapshot: BlogPublishedSnapshot = {
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverImageUrl: row.coverImageUrl,
  };
  await db
    .update(blogPosts)
    .set({
      status: "published",
      publishedSnapshot: snapshot,
      publishedAt: row.publishedAt ?? new Date(),
      updatedAt: new Date(),
    })
    .where(eq(blogPosts.id, id));
  return { slug: row.slug };
}

/** «Nashrdan olish» — ommaviy sahifa yoʻqoladi, surat va publishedAt
 *  saqlanadi (qayta nashr qilinsa slug/sana oʻzgarmaydi). */
export async function unpublishPost(id: string): Promise<{ slug: string } | null> {
  const teacher = await requireTeacher();
  const [row] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
  if (!row || row.teacherId !== teacher.id) return null;
  await db
    .update(blogPosts)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(blogPosts.id, id));
  return { slug: row.slug };
}

export async function deletePost(id: string): Promise<void> {
  const teacher = await requireTeacher();
  await db.delete(blogPosts).where(and(eq(blogPosts.id, id), eq(blogPosts.teacherId, teacher.id)));
}

/** Ommaviy koʻrish beacon'idan chaqiriladi — auth talab qilinmaydi.
 *  Faqat nashr qilingan postlar sanaladi. `revalidate` CHAQIRILMAYDI. */
export async function incrementViewCount(id: string): Promise<void> {
  await db
    .update(blogPosts)
    .set({ viewCount: sql`${blogPosts.viewCount} + 1` })
    .where(and(eq(blogPosts.id, id), eq(blogPosts.status, "published")));
}

/** Koʻruvchi shu maqola fikrlarini moderatsiya qila oladimi (= maqola egasi). */
export async function canModerateComments(postAuthorId: string): Promise<boolean> {
  const session = await getSession();
  return session != null && session.user.id === postAuthorId;
}

/** Postga fikrlar — OʻQISH ochiq (auth talab qilinmaydi). Tekis roʻyxat
 *  qaytadi (root + javoblar), createdAt boʻyicha oʻsish tartibida; javob
 *  daraxtini klient quradi. Yumshoq oʻchirilgan fikr faqat javobi bor
 *  root boʻlsa «tombstone» sifatida qoladi. Avatar `teachers` dan LEFT
 *  JOIN — anonim eski fikrlarda `null`. */
export async function listComments(postId: string): Promise<BlogComment[]> {
  const session = await getSession();
  const viewerId = session?.user.id ?? null;

  const [post] = await db
    .select({ teacherId: blogPosts.teacherId })
    .from(blogPosts)
    .where(eq(blogPosts.id, postId));
  const postAuthorId = post?.teacherId ?? null;

  const rows = await db
    .select({
      id: blogComments.id,
      parentId: blogComments.parentId,
      teacherId: blogComments.teacherId,
      name: blogComments.name,
      body: blogComments.body,
      createdAt: blogComments.createdAt,
      editedAt: blogComments.editedAt,
      deletedAt: blogComments.deletedAt,
      authorAvatarUrl: teachers.avatarUrl,
    })
    .from(blogComments)
    .leftJoin(teachers, eq(teachers.id, blogComments.teacherId))
    .where(eq(blogComments.postId, postId))
    .orderBy(blogComments.createdAt);

  const liveChildren = new Map<string, number>();
  for (const r of rows) {
    if (r.parentId && !r.deletedAt) liveChildren.set(r.parentId, (liveChildren.get(r.parentId) ?? 0) + 1);
  }

  const out: BlogComment[] = [];
  for (const r of rows) {
    const deleted = r.deletedAt != null;
    if (deleted && !(r.parentId == null && (liveChildren.get(r.id) ?? 0) > 0)) continue;
    out.push({
      id: r.id,
      parentId: r.parentId,
      name: r.name,
      body: deleted ? "" : r.body,
      createdAt: r.createdAt.toISOString(),
      editedAt: r.editedAt ? r.editedAt.toISOString() : null,
      deleted,
      mine: !deleted && viewerId != null && r.teacherId === viewerId,
      isPostAuthor: r.teacherId != null && r.teacherId === postAuthorId,
      authorAvatarUrl: r.authorAvatarUrl,
    });
  }
  return out;
}

/** Fikr YOZISH — hisob TALAB QILINADI. Ism/avatar hisobdan olinadi
 *  (clientdan ism qabul qilinmaydi). `parentId` berilsa — bir daraja
 *  javob: root fikrga (javobning javobi boʻlmaydi). */
export async function addComment(postId: string, body: string, parentId?: string): Promise<BlogComment> {
  const teacher = await requireTeacher();
  const [post] = await db
    .select({ id: blogPosts.id, teacherId: blogPosts.teacherId })
    .from(blogPosts)
    .where(and(eq(blogPosts.id, postId), eq(blogPosts.status, "published")));
  if (!post) throw new Error("Post topilmadi");

  let parent: string | null = null;
  if (parentId) {
    const [p] = await db
      .select({
        id: blogComments.id,
        postId: blogComments.postId,
        parentId: blogComments.parentId,
        deletedAt: blogComments.deletedAt,
      })
      .from(blogComments)
      .where(eq(blogComments.id, parentId));
    if (!p || p.postId !== postId || p.parentId != null || p.deletedAt != null) {
      throw new Error("Javob berib boʻlmadi");
    }
    parent = p.id;
  }

  const id = crypto.randomUUID();
  const createdAt = new Date();
  await db.insert(blogComments).values({
    id,
    postId,
    parentId: parent,
    teacherId: teacher.id,
    name: teacher.name,
    body,
    createdAt,
  });
  return {
    id,
    parentId: parent,
    name: teacher.name,
    body,
    createdAt: createdAt.toISOString(),
    editedAt: null,
    deleted: false,
    mine: true,
    isPostAuthor: teacher.id === post.teacherId,
    authorAvatarUrl: teacher.avatarUrl,
  };
}

/** Oʻz fikrini tahrirlash — faqat egasi. Oʻchirilgan fikr tahrirlanmaydi. */
export async function editComment(commentId: string, body: string): Promise<{ editedAt: string }> {
  const teacher = await requireTeacher();
  const [row] = await db
    .select({ teacherId: blogComments.teacherId, deletedAt: blogComments.deletedAt })
    .from(blogComments)
    .where(eq(blogComments.id, commentId));
  if (!row || row.deletedAt != null) throw new Error("Fikr topilmadi");
  if (row.teacherId !== teacher.id) throw new Error("Ruxsat yoʻq");
  const editedAt = new Date();
  await db.update(blogComments).set({ body, editedAt }).where(eq(blogComments.id, commentId));
  return { editedAt: editedAt.toISOString() };
}

/** Fikrni oʻchirish (yumshoq) — egasi YOKI maqola muallifi. */
export async function deleteComment(commentId: string): Promise<void> {
  const teacher = await requireTeacher();
  const [row] = await db
    .select({ teacherId: blogComments.teacherId, postId: blogComments.postId })
    .from(blogComments)
    .where(eq(blogComments.id, commentId));
  if (!row) return;
  if (row.teacherId !== teacher.id) {
    const [post] = await db
      .select({ teacherId: blogPosts.teacherId })
      .from(blogPosts)
      .where(eq(blogPosts.id, row.postId));
    if (!post || post.teacherId !== teacher.id) throw new Error("Ruxsat yoʻq");
  }
  await db.update(blogComments).set({ deletedAt: new Date() }).where(eq(blogComments.id, commentId));
}
