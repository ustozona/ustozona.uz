"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  listPublishedPosts,
  getPublishedPostBySlug,
  listMyPosts,
  getMyPostById,
  createPost,
  savePost,
  setPostStatus,
  deletePost,
  listComments,
  addComment,
  type BlogPostSummary,
  type BlogPostFull,
  type BlogComment,
} from "@/server/dal/blog";

export async function fetchPublishedPostsAction(): Promise<BlogPostSummary[]> {
  return listPublishedPosts();
}

export async function fetchPublishedPostAction(slug: string): Promise<BlogPostFull | null> {
  return getPublishedPostBySlug(z.string().min(1).parse(slug));
}

export async function fetchMyPostsAction(): Promise<BlogPostSummary[]> {
  return listMyPosts();
}

export async function fetchMyPostAction(id: string): Promise<BlogPostFull | null> {
  return getMyPostById(z.string().min(1).parse(id));
}

export async function createPostAction(): Promise<{ id: string }> {
  const result = await createPost();
  revalidatePath("/blog/studio");
  return result;
}

const savePostSchema = z.object({
  id: z.string().min(1),
  title: z.string().max(200),
  excerpt: z.string().max(400),
  /* ⚠️ Bu chegara ATAYLAB kichik — u yerga base64 SIGʻMASLIGI kerak.
     Sabab: `listPublishedPosts` bu ustunni HAR BIR nashr qilingan post
     uchun tanlaydi, yaʼni `/blog` indeks sahifasi barcha muqovalarni bir
     yoʻla yuklaydi. Base64 muqova ruxsat etilsa, oʻnta postli indeks
     bir necha megabaytlik HTML'ga aylanardi — hujjat ichiga inline
     boʻlgani uchun uni alohida keshlab ham boʻlmaydi.
     Muqova SHU SABABLI faqat haqiqiy URL qabul qiladi; saqlagich
     sozlanmagan boʻlsa BlogEditor yuklashni rad etadi (`onPickCover`). */
  coverImageUrl: z.string().max(2000).nullable(),
  /* ⚠️ Ilgari 200_000 edi va bu «Saqlashda xatolik» toast'ining ASOSIY
     sababi boʻlgan: muharrirga qoʻyilgan rasm base64 data-URL sifatida
     aynan shu `content` ichiga tushardi (1280px/q0.8 surat ≈ 200 000–
     530 000 belgi), yaʼni deyarli har qanday foto limitdan oshardi va
     zod `parse` xato tashlardi. Endi rasm normal holatda Supabase
     Storage'ga chiqadi va bu yerda faqat qisqa URL qoladi — lekin
     saqlagich sozlanmagan muhitda base64 fallback ishlaydi, shuning
     uchun chegara unga ham yetadigan qilib qoʻyildi. */
  content: z.string().max(4_000_000),
});

export async function savePostAction(input: z.infer<typeof savePostSchema>): Promise<{ ok: true }> {
  await savePost(savePostSchema.parse(input));
  revalidatePath("/blog/studio");
  revalidatePath("/blog");
  return { ok: true };
}

export async function setPostStatusAction(input: { id: string; status: "draft" | "published" }): Promise<{ ok: true }> {
  const schema = z.object({ id: z.string().min(1), status: z.enum(["draft", "published"]) });
  const { id, status } = schema.parse(input);
  await setPostStatus(id, status);
  revalidatePath("/blog/studio");
  revalidatePath("/blog");
  return { ok: true };
}

export async function deletePostAction(id: string): Promise<{ ok: true }> {
  await deletePost(z.string().min(1).parse(id));
  revalidatePath("/blog/studio");
  revalidatePath("/blog");
  return { ok: true };
}

export async function fetchCommentsAction(postId: string): Promise<BlogComment[]> {
  return listComments(z.string().min(1).parse(postId));
}

const addCommentSchema = z.object({
  postId: z.string().min(1),
  name: z.string().min(1).max(80),
  body: z.string().min(1).max(2000),
});

export async function addCommentAction(input: z.infer<typeof addCommentSchema>): Promise<BlogComment> {
  const { postId, name, body } = addCommentSchema.parse(input);
  const comment = await addComment(postId, name.trim(), body.trim());
  revalidatePath(`/blog`);
  return comment;
}
