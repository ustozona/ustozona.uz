import { notFound } from "next/navigation";
import { getMyPostById } from "@/server/dal/blog";
import { BlogEditor } from "../_components/BlogEditor";

export default async function BlogEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getMyPostById(id);
  if (!post) notFound();
  return <BlogEditor post={post} />;
}
