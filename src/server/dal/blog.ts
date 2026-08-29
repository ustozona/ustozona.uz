import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { blogComments, blogPosts, teachers } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";

/* ════════════════════════════════════════════════════════════════════
   BLOG DAL — koʻp-mualliflik maqolalar. Yozish/tahrirlash faqat egasi
   (feedback.ts naqshi bilan bir xil), oʻqish (ochiq lenta) va fikr
   bildirish hammaga ochiq.
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
  authorName: string;
  authorAvatarUrl: string | null;
};

export type BlogPostFull = BlogPostSummary & { content: string; teacherId: string };

export type BlogComment = {
  id: string;
  name: string;
  body: string;
  createdAt: string;
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

/** Ochiq lenta — faqat nashr qilingan postlar, eng yangisi birinchi. */
export async function listPublishedPosts(): Promise<BlogPostSummary[]> {
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
      authorName: teachers.name,
      authorAvatarUrl: teachers.avatarUrl,
    })
    .from(blogPosts)
    .innerJoin(teachers, eq(teachers.id, blogPosts.teacherId))
    .where(eq(blogPosts.status, "published"))
    .orderBy(desc(blogPosts.publishedAt));

  return rows.map((r) => ({
    ...r,
    publishedAt: r.publishedAt?.toISOString() ?? null,
    updatedAt: r.updatedAt.toISOString(),
  }));
}

/** Bitta post — slug boʻyicha, faqat nashr qilingan (ochiq sahifa uchun). */
export async function getPublishedPostBySlug(slug: string): Promise<BlogPostFull | null> {
  const [row] = await db
    .select({
      id: blogPosts.id,
      teacherId: blogPosts.teacherId,
      slug: blogPosts.slug,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
      coverImageUrl: blogPosts.coverImageUrl,
      content: blogPosts.content,
      status: blogPosts.status,
      publishedAt: blogPosts.publishedAt,
      updatedAt: blogPosts.updatedAt,
      authorName: teachers.name,
      authorAvatarUrl: teachers.avatarUrl,
    })
    .from(blogPosts)
    .innerJoin(teachers, eq(teachers.id, blogPosts.teacherId))
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")));
  if (!row) return null;
  return {
    ...row,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Joriy oʻqituvchining barcha postlari (qoralama + nashr), dashboard uchun. */
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

/** Bitta post — muharrir uchun, faqat egasi. */
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
    coverImageUrl: row.coverImageUrl,
    content: row.content,
    status: row.status,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
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
  const slug = title !== row.title ? await uniqueSlug(title, row.id) : row.slug;
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

export async function setPostStatus(id: string, status: "draft" | "published"): Promise<void> {
  const teacher = await requireTeacher();
  const [row] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
  if (!row || row.teacherId !== teacher.id) return;
  await db
    .update(blogPosts)
    .set({
      status,
      publishedAt: status === "published" ? (row.publishedAt ?? new Date()) : row.publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(blogPosts.id, id));
}

export async function deletePost(id: string): Promise<void> {
  const teacher = await requireTeacher();
  await db.delete(blogPosts).where(and(eq(blogPosts.id, id), eq(blogPosts.teacherId, teacher.id)));
}

/** Postga fikrlar — OʻQISH ochiq (auth talab qilinmaydi).
 *  Avatar `teachers` dan LEFT JOIN bilan olinadi: hisobga bogʻlanmagan
 *  eski (anonim) fikrlarda u `null` boʻladi va bosh harflar chiziladi. */
export async function listComments(postId: string): Promise<BlogComment[]> {
  const rows = await db
    .select({
      id: blogComments.id,
      name: blogComments.name,
      body: blogComments.body,
      createdAt: blogComments.createdAt,
      authorAvatarUrl: teachers.avatarUrl,
    })
    .from(blogComments)
    .leftJoin(teachers, eq(teachers.id, blogComments.teacherId))
    .where(eq(blogComments.postId, postId))
    .orderBy(blogComments.createdAt);
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

/** Fikr YOZISH — hisob TALAB QILINADI.
 *
 *  Ilgari ism erkin matn edi va istalgan odam istalgan nom bilan yozardi:
 *  na moderatsiya, na javobgarlik, na spamdan himoya. Endi ism va avatar
 *  hisobdan olinadi — clientdan ism UMUMAN qabul qilinmaydi (u yerdan
 *  kelgan qiymatga ishonib boʻlmaydi). */
export async function addComment(postId: string, body: string): Promise<BlogComment> {
  const teacher = await requireTeacher();
  const [post] = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(and(eq(blogPosts.id, postId), eq(blogPosts.status, "published")));
  if (!post) throw new Error("Post topilmadi");
  const id = crypto.randomUUID();
  const createdAt = new Date();
  await db.insert(blogComments).values({
    id,
    postId,
    teacherId: teacher.id,
    name: teacher.name,
    body,
    createdAt,
  });
  return {
    id,
    name: teacher.name,
    body,
    createdAt: createdAt.toISOString(),
    authorAvatarUrl: teacher.avatarUrl,
  };
}
