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
  coverImageUrl: z.string().max(2000).nullable(),
  content: z.string().max(200_000),
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
