import { integer, index, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { teachers } from "./teachers";

/** Nashr qilingan (muzlatilgan) surat — ommaviy sahifa AYNAN shuni oʻqiydi.
 *  Ishchi ustunlar (title/excerpt/content/...) muharrir yozgani, bu esa
 *  «Nashr qilish»/«Yangilash» bosilgan paytdagi holat. Ikkisi farq qilsa
 *  = «saqlanmagan (nashr qilinmagan) oʻzgarishlar bor». */
export type BlogPublishedSnapshot = {
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
};

/* ════════════════════════════════════════════════════════════════════
   BLOG — koʻp-mualliflik maqolalar (Medium/Substack uslubi), MVP.

   Har post bitta oʻqituvchiga tegishli (teacherId), lekin /blog ochiq —
   hamma mualliflarning nashr qilingan postlari birga koʻrinadi. Fikr
   bildirish anonim (auth talab qilinmaydi) — moderatsiya keyingi
   bosqichda qoʻshiladi.
   ════════════════════════════════════════════════════════════════════ */

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    coverImageUrl: text("cover_image_url"),
    /** Tiptap HTML — round-trip aynan (lesson-editor bilan bir xil naqsh). */
    content: text("content").notNull().default(""),
    status: text("status").notNull().default("draft"), // draft | published | archived
    /** §3 — ommaviy sahifa shundan oʻqiydi. `null` = hali nashr qilinmagan. */
    publishedSnapshot: jsonb("published_snapshot").$type<BlogPublishedSnapshot>(),
    /** Ommaviy koʻrishlar soni — klient beacon (`/api/blog/[id]/view`) oshiradi. */
    viewCount: integer("view_count").notNull().default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("blog_posts_slug_idx").on(t.slug),
    index("blog_posts_teacher_idx").on(t.teacherId),
  ]
);

export const blogComments = pgTable(
  "blog_comments",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    /** Fikr egasi. Yangi fikrlar HAR DOIM hisobga bogʻlanadi (Medium,
     *  Substack, Ghost, Dev.to — hammasida shunday). NULL boʻlishi mumkin,
     *  chunki bu maydondan OLDIN yozilgan anonim fikrlar bazada qoladi:
     *  ular `name` bilan koʻrsatiladi. Oʻqituvchi hisobi oʻchirilsa fikr
     *  yoʻqolmaydi — bogʻ uziladi, matn qolaveradi. */
    teacherId: text("teacher_id").references(() => teachers.id, { onDelete: "set null" }),
    /** Yozilgan paytdagi ism — hisob bilan bogʻlangan fikrlarda ham
     *  saqlanadi (anonim eski qatorlar uchun esa yagona manba). */
    name: text("name").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("blog_comments_post_idx").on(t.postId)]
);

export type BlogPostRow = typeof blogPosts.$inferSelect;
export type BlogCommentRow = typeof blogComments.$inferSelect;
