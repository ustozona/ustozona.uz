import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/* Matndagi unicode emoji harakati (Extended_Pictographic, ZWJ ketma-ketlik
   va variation selector bilan) — src/components/ui/emoji-text.tsx dagi bilan
   bir xil qoida. */
const EMOJI_RE = /\p{Extended_Pictographic}(?:️)?(?:‍\p{Extended_Pictographic}(?:️)?)*/gu;
const EMOJI_CDN = "https://cdn.jsdelivr.net/npm/emoji-datasource-apple@16.0.0/img/apple/64/";

function toUnified(char: string): string {
  return [...char].map((c) => c.codePointAt(0)!.toString(16)).join("-");
}

/* Ayrim emoji (mas. ⭐ 2b50) sprite fayli VS16'siz, boshqalari (mas. ☀️
   2600-fe0f) VS16 bilan nomlangan — matnda yozilgan holat har doim toʻgʻri
   fayl nomiga mos kelmaydi. Shu sabab 404'da qarama-qarshi variant bilan
   bir marta qayta urinib koʻriladi (pastda onerror). */
function toggleFe0f(unified: string): string {
  const parts = unified.split("-");
  const idx = parts.indexOf("fe0f");
  if (idx !== -1) return parts.filter((_, i) => i !== idx).join("-");
  return [parts[0], "fe0f", ...parts.slice(1)].join("-");
}

/**
 * Dars muharririda yozilgan har qanday unicode emoji — OS shrifti oʻrniga
 * Apple sprite (PNG) bilan koʻrsatiladi (barcha platformada bir xil koʻrinish
 * uchun, [Illustration + Apple emoji system] xotira yozuviga mos).
 *
 * Haqiqiy matn (unicode belgi) hujjatda oʻzgarmaydi — faqat vizual decoration:
 * belgi `font-size: 0` bilan yashiriladi, yoniga rasm widget qoʻyiladi. Shu
 * bilan kursor/backspace/tanlash tabiiy ishlaydi (Slack/Discord uslubi).
 */
export const AppleEmojiDisplay = Extension.create({
  name: "appleEmojiDisplay",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("appleEmojiDisplay"),
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            state.doc.descendants((node, pos) => {
              if (!node.isText || !node.text) return;
              EMOJI_RE.lastIndex = 0;
              let m: RegExpExecArray | null;
              while ((m = EMOJI_RE.exec(node.text))) {
                const emoji = m[0];
                const from = pos + m.index;
                const to = from + emoji.length;
                decorations.push(Decoration.inline(from, to, { class: "apple-emoji-src" }));
                decorations.push(
                  Decoration.widget(
                    to,
                    () => {
                      const img = document.createElement("img");
                      const unified = toUnified(emoji);
                      img.src = `${EMOJI_CDN}${unified}.png`;
                      img.alt = emoji;
                      img.draggable = false;
                      img.loading = "lazy";
                      img.className = "apple-emoji-img";
                      img.onerror = () => {
                        if (img.dataset.retried) { img.remove(); return; }
                        img.dataset.retried = "1";
                        img.src = `${EMOJI_CDN}${toggleFe0f(unified)}.png`;
                      };
                      return img;
                    },
                    { side: 1, ignoreSelection: true }
                  )
                );
              }
            });
            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});
