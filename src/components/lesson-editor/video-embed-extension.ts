"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { parseVideoUrl, type VideoEmbedRef } from "@/lib/video-embed";
import VideoEmbedView from "./VideoEmbedView";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    videoEmbed: {
      /** Havoladan video bloki qoʻyadi. Havola tanilmasa `false`. */
      setVideoEmbed: (url: string) => ReturnType;
    };
  }
}

/**
 * VIDEO EMBED — havola bilan qoʻyiladigan video bloki (Notion'dagi
 * `/embed` kabi).
 *
 * ─── ATOM, `content` YOʻQ ───
 * Rasmdagi `FigureImage` dan farqli: video ostida izoh maydoni yoʻq, ichida
 * tahrirlanadigan matn yoʻq. Shuning uchun `atom: true` + `draggable: true`
 * (Tiptap'ning oddiy `Image` tuguni bilan bir xil model) — blokni butunligi
 * bilan tanlash, sudrash va Backspace bilan oʻchirish shu bilan ishlaydi.
 *
 * ─── HTML SHAKLI ───
 * Bazaga iframe EMAS, fasad yoziladi (sabab `lib/video-embed.ts` da).
 * Ichidagi `<a>` — JS oʻchiq boʻlgan koʻrinish va chop etish (dars A4 PDF)
 * uchun: qogʻozda iframe maʼnosiz, havola esa oʻqiladi.
 */
export const VideoEmbed = Node.create({
  name: "videoEmbed",
  group: "block",
  atom: true,
  draggable: true,
  /* Tanlov chegarasi blokning oʻzida tugasin. */
  isolating: true,

  addAttributes() {
    return {
      provider: {
        default: "youtube",
        parseHTML: (el) => el.getAttribute("data-provider"),
        renderHTML: (attrs) => ({ "data-provider": attrs.provider }),
      },
      videoId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-video-id"),
        renderHTML: (attrs) => ({ "data-video-id": attrs.videoId }),
      },
      /* Instagram uchun yoʻl turi (`p` / `reel` / `tv`) — embed manzili
         shunga qarab quriladi. YouTube'da `null`. */
      kind: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-kind"),
        renderHTML: (attrs) => (attrs.kind ? { "data-kind": attrs.kind } : {}),
      },
      url: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-url"),
        renderHTML: (attrs) => ({ "data-url": attrs.url }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-video-embed]" }];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-video-embed": "", class: "video-embed" }),
      [
        "a",
        {
          href: node.attrs.url ?? "#",
          target: "_blank",
          rel: "noopener noreferrer",
          class: "video-embed-link",
        },
        node.attrs.url ?? "",
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoEmbedView);
  },

  addCommands() {
    return {
      setVideoEmbed:
        (url) =>
        ({ commands }) => {
          const parsed = parseVideoUrl(url);
          if (!parsed) return false;
          return commands.insertContent(nodeFrom(parsed));
        },
    };
  },

  addProseMirrorPlugins() {
    const type = this.type;
    return [
      new Plugin({
        key: new PluginKey("videoEmbedPaste"),
        props: {
          /* Notion naqshi: BOʻSH xatboshiga video havolasi qoʻyilsa u
             embed'ga aylanadi. «Boʻsh» sharti muhim — gap oʻrtasiga
             qoʻyilgan havola oddiy havola boʻlib qolishi kerak, aks holda
             matn kutilmaganda bloklarga boʻlinib ketardi. CTRL+Z bilan
             oddiy havolaga qaytariladi. */
          handlePaste: (view, event) => {
            const text = event.clipboardData?.getData("text/plain")?.trim();
            if (!text) return false;
            const parsed = parseVideoUrl(text);
            if (!parsed) return false;

            const { $from, empty } = view.state.selection;
            if (!empty) return false;
            if ($from.parent.type.name !== "paragraph" || $from.parent.content.size > 0) return false;

            const node = type.create(nodeFrom(parsed).attrs);
            view.dispatch(view.state.tr.replaceSelectionWith(node).scrollIntoView());
            return true;
          },
        },
      }),
    ];
  },
});

function nodeFrom(ref: VideoEmbedRef) {
  return {
    type: "videoEmbed",
    attrs: {
      provider: ref.provider,
      videoId: ref.videoId,
      kind: ref.kind ?? null,
      url: ref.url,
    },
  };
}
