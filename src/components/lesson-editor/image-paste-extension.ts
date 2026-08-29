"use client";

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";
import { toast } from "sonner";
import { compressImageFile } from "@/lib/image-compress";
import { uploadEditorImageAction } from "@/server/actions/uploads";

/**
 * CTRL+V va sudrab tashlash (drag & drop) orqali qoʻyilgan RASMLARNI ushlab,
 * toolbar'dagi rasm tugmasi bilan AYNAN BIR XIL zanjirdan oʻtkazadi:
 * siqish (1280px/q0.8) → Supabase Storage → hujjatga qisqa URL.
 *
 * ⛔ Busiz nima boʻlardi
 * Tiptap/ProseMirror standart holda clipboard'dagi rasm FAYLINI umuman
 * bilmaydi — ekran surati CTRL+V qilinsa hech narsa qoʻyilmasdi. Veb
 * sahifadan koʻchirilgan rasm esa HTML sifatida kelib, `<img>` tegi tashqi
 * manzil bilan oʻz holicha qolardi (hotlink): rasm boshqa saytda turadi,
 * u yerdan oʻchirilsa bizning maqolada ham yoʻqoladi.
 *
 * ℹ️ Tashqi URL bilan kelgan `<img>` ATAYLAB oʻz holicha qoldiriladi —
 * uni oʻz serverimizga koʻchirish server tomonidan ixtiyoriy manzilga
 * soʻrov yuborishni talab qiladi (SSRF yuzasi). Faqat foydalanuvchining
 * oʻz qurilmasidan kelgan FAYL yuklanadi.
 *
 * ── POZITSIYA: nega dekoratsiya kerak ────────────────────────────────────
 * Yuklash asinxron, hujjat esa shu orada oʻzgarishi mumkin (foydalanuvchi
 * yozishda davom etadi). Pozitsiyani oddiy songa saqlash ikki xatoga olib
 * kelardi: (1) matn yozilsa rasm notoʻgʻri joyga tushardi yoki pozitsiya
 * oraliqdan chiqib `insertContentAt` yiqilardi; (2) bir necha rasm bitta
 * songa ketma-ket qoʻyilib, TESKARI tartibda chiqardi.
 *
 * ProseMirror'ning standart yechimi — pozitsiyani widget dekoratsiyasi
 * sifatida saqlash: `DecorationSet.map()` uni har tranzaksiyada avtomatik
 * suradi. Yuklash tugagach dekoratsiya qayerda boʻlsa, rasm oʻsha yerga
 * tushadi. Bonus sifatida yuklash davomida koʻrinadigan belgi ham bor.
 */
export interface ImagePasteUploadOptions {
  /** Yuklash muvaffaqiyatsiz boʻlganda koʻrsatiladigan xabar (i18n
   *  chaqiruvchi tomondan beriladi — kengaytma React konteksti emas). */
  uploadFailedMessage: string;
}

type UploadMeta = { add: { id: object; pos: number } } | { remove: { id: object } };

const uploadKey = new PluginKey<DecorationSet>("imagePasteUpload");

/** Yuklanayotgan rasm oʻrnini bildiruvchi xira belgi. */
function createUploadWidget(doc: Document): HTMLElement {
  const el = doc.createElement("span");
  el.className = "editor-image-uploading";
  el.setAttribute("aria-hidden", "true");
  return el;
}

function findUploadPos(view: EditorView, id: object): number | null {
  const set = uploadKey.getState(view.state);
  const found = set?.find(undefined, undefined, (spec) => spec.id === id);
  return found && found.length > 0 ? found[0].from : null;
}

export const ImagePasteUpload = Extension.create<ImagePasteUploadOptions>({
  name: "imagePasteUpload",

  addOptions() {
    return { uploadFailedMessage: "Rasmni yuklab boʻlmadi" };
  },

  addProseMirrorPlugins() {
    const editor = this.editor;
    const { uploadFailedMessage } = this.options;

    const imageFilesOf = (list: FileList | null | undefined): File[] =>
      Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));

    const startUpload = (view: EditorView, files: File[], pos: number) => {
      const id = {};
      view.dispatch(view.state.tr.setMeta(uploadKey, { add: { id, pos } } satisfies UploadMeta));

      const clear = () =>
        view.dispatch(view.state.tr.setMeta(uploadKey, { remove: { id } } satisfies UploadMeta));

      /* Fayllar PARALLEL yuklanadi — ular bir-biriga bogʻliq emas, ketma-ket
         kutish sarf vaqtni yigʻindiga aylantirardi. Tartib `Promise.all`
         tufayli saqlanadi, joylash esa bitta amalda boʻladi. */
      Promise.all(
        files.map(async (file) => {
          const dataUrl = await compressImageFile(file);
          const { url } = await uploadEditorImageAction(dataUrl);
          return url;
        })
      )
        .then((urls) => {
          const at = findUploadPos(view, id);
          clear();
          if (at === null) return; // joy oʻchirib yuborilgan
          editor
            .chain()
            .focus()
            .insertContentAt(
              at,
              urls.map((src) => ({ type: "figureImage", attrs: { src } }))
            )
            .run();
        })
        .catch(() => {
          clear();
          toast.error(uploadFailedMessage);
        });
    };

    return [
      new Plugin({
        key: uploadKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, set) {
            // Hujjat oʻzgarishi bilan pozitsiya oʻz-oʻzidan suriladi.
            let next = set.map(tr.mapping, tr.doc);
            const meta = tr.getMeta(uploadKey) as UploadMeta | undefined;
            if (meta && "add" in meta) {
              const widget = Decoration.widget(
                meta.add.pos,
                createUploadWidget(document),
                { id: meta.add.id }
              );
              next = next.add(tr.doc, [widget]);
            } else if (meta && "remove" in meta) {
              next = next.remove(
                next.find(undefined, undefined, (spec) => spec.id === meta.remove.id)
              );
            }
            return next;
          },
        },
        props: {
          decorations: (state) => uploadKey.getState(state),
          handlePaste(view, event) {
            if (!view.editable) return false;
            const files = imageFilesOf(event.clipboardData?.files);
            if (files.length === 0) return false;
            event.preventDefault();
            startUpload(view, files, view.state.selection.from);
            return true;
          },
          handleDrop(view, event) {
            if (!view.editable) return false;
            const files = imageFilesOf((event as DragEvent).dataTransfer?.files);
            if (files.length === 0) return false;
            event.preventDefault();
            const coords = view.posAtCoords({
              left: (event as DragEvent).clientX,
              top: (event as DragEvent).clientY,
            });
            startUpload(view, files, coords?.pos ?? view.state.selection.from);
            return true;
          },
        },
      }),
    ];
  },
});
