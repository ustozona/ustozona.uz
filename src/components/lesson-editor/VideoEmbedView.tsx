"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { ExternalLink, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoEmbedFacade } from "@/components/video-embed/VideoEmbedFacade";
import type { VideoEmbedRef, VideoProvider } from "@/lib/video-embed";

/**
 * Video bloki muharrir ichida — nashr qilingan koʻrinishning AYNI oʻzi
 * (`VideoEmbedFacade`), ustiga faqat ikki amal qoʻyilgan: manbada ochish
 * va oʻchirish. Ular hover/tanlovda koʻrinadi.
 *
 * `interactive={false}` — muharrirda ▶︎ ijro etmaydi. Sabab: blok ustiga
 * bosish avvalo tugunni TANLASHI kerak (oʻchirish, sudrash, koʻchirish shu
 * bilan ishlaydi). Video muharrir ichida ijro etilsa foydalanuvchi blokni
 * tanlay olmay qolardi. Koʻrish uchun «Koʻrish» (preview) yoki manbadagi
 * havola bor.
 */
export default function VideoEmbedView({ node, deleteNode, selected }: NodeViewProps) {
  const video: VideoEmbedRef = {
    provider: (node.attrs.provider as VideoProvider) ?? "youtube",
    videoId: (node.attrs.videoId as string) ?? "",
    kind: (node.attrs.kind as VideoEmbedRef["kind"]) ?? undefined,
    url: (node.attrs.url as string) ?? "",
  };

  return (
    <NodeViewWrapper
      className={cn(
        "video-embed group relative my-6",
        selected && "rounded-xl outline outline-2 outline-offset-2 outline-ring",
      )}
      data-drag-handle
      /* Chop etish qoidasi (globals.css) havolani `attr(data-url)` dan
         oʻqiydi — NodeView oʻz DOMini qurgani uchun tugun atributlari
         avtomatik tushmaydi, shuning uchun qoʻlda beriladi. */
      data-url={video.url}
    >
      <VideoEmbedFacade video={video} interactive={false} />

      <div
        contentEditable={false}
        className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
      >
        {video.url && (
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Manbada ochish"
            className="flex size-8 items-center justify-center rounded-md bg-background/90 text-foreground backdrop-blur transition hover:bg-background"
          >
            <ExternalLink className="size-4" />
          </a>
        )}
        <button
          type="button"
          title="Videoni oʻchirish"
          onClick={() => deleteNode()}
          className="flex size-8 items-center justify-center rounded-md bg-background/90 text-destructive backdrop-blur transition hover:bg-background"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </NodeViewWrapper>
  );
}
