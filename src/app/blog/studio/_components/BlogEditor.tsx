"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { Mathematics } from "@tiptap/extension-mathematics";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Typography } from "@tiptap/extension-typography";
import { CharacterCount } from "@tiptap/extension-character-count";
import { TableKit } from "@tiptap/extension-table";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import "katex/dist/katex.min.css";
import { ArrowLeft, Check, ChevronDown, ImageIcon, Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { compressImageFile } from "@/lib/image-compress";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { initialsOf } from "@/store/useFeedbackStore";
import { Callout, CalloutTitle } from "@/components/lesson-editor/callout-extension";
import { NotionCallout, NotionCalloutTitle } from "@/components/lesson-editor/notion-callout-extension";
import { LeadingParagraph } from "@/components/lesson-editor/leading-paragraph-extension";
import { FigureImage } from "@/components/lesson-editor/figure-extension";
import { ImagePasteUpload } from "@/components/lesson-editor/image-paste-extension";
import { AppleEmojiDisplay } from "@/components/lesson-editor/apple-emoji-extension";
import { VideoEmbed } from "@/components/lesson-editor/video-embed-extension";
import EditorToolbar from "@/components/lesson-editor/EditorToolbar";
import BubbleToolbar from "@/components/lesson-editor/BubbleToolbar";
import { publishPostAction, savePostAction, unpublishPostAction } from "@/server/actions/blog";
import { uploadEditorImageAction } from "@/server/actions/uploads";
import type { BlogPostFull } from "@/server/dal/blog";

/* Xuddi dars muharriridagi Tiptap toʻplami (EditorToolbar/BubbleToolbar
   lesson-ga bogʻliq emas — toʻgʻridan-toʻgʻri qayta ishlatildi). AI panel,
   Tafsilotlar (sinf/jadval) va A4/chop qismi olinmadi — bular dars
   modeliga xos, blogga tegishli emas.

   Joylashuv — Substack uslubi: quti/kulrang fon yoʻq, matn sahifaning
   oʻzida oqadi; asboblar paneli toʻliq-kengliq panel emas, markazlashgan
   suzuvchi pilla (referens skrinshot). */
export function BlogEditor({ post }: { post: BlogPostFull }) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title);
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const [coverImageUrl, setCoverImageUrl] = useState(post.coverImageUrl ?? "");
  const [status, setStatus] = useState(post.status);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  /* «Nashr qilingan, lekin ishchi nusxa suratdan farq qiladi» — serverdan
     boshlangʻich qiymat, keyin klientda tahrir/nashr boʻyicha yangilanadi. */
  const [dirty, setDirty] = useState(post.hasUnpublishedChanges);
  const [publishing, setPublishing] = useState(false);
  const [coverEditorOpen, setCoverEditorOpen] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  /* Qoʻyilgan manzildan rasm yuklanmadi. Eng koʻp uchraydigan sabab —
     galereya SAHIFASINING havolasi qoʻyilgan (`.../nature-4k`), rasm
     faylining oʻzi emas (`.../nature.jpg`). Busiz preview shunchaki
     singan rasm ikonasini koʻrsatar, sababi esa aytilmasdi. */
  const [coverBroken, setCoverBroken] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const subtitleRef = useRef<HTMLTextAreaElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer" } },
      }),
      Placeholder.configure({
        includeChildren: true,
        placeholder: ({ node }) => (node.type.name === "paragraph" ? "Yozishni boshlang..." : ""),
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      /* `Image` — FAQAT eski kontent uchun (ilgari saqlangan yalangʻoch
         `<img>`). Yangi rasmlar `FigureImage` sifatida, izoh maydoni bilan
         birga qoʻyiladi. */
      Image.configure({ inline: false, allowBase64: true }),
      FigureImage.configure({ captionPlaceholder: "Rasm izohi (ixtiyoriy)" }),
      ImagePasteUpload.configure({ uploadFailedMessage: "Rasmni yuklab boʻlmadi" }),
      Callout,
      CalloutTitle,
      NotionCallout,
      NotionCalloutTitle,
      LeadingParagraph,
      Mathematics.configure({ katexOptions: { throwOnError: false } }),
      TableKit.configure({ table: { resizable: true } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextStyle,
      Color,
      Subscript,
      Superscript,
      Typography,
      CharacterCount,
      AppleEmojiDisplay,
      VideoEmbed,
    ],
    content: post.content,
    editorProps: { attributes: { class: "lesson-prose blog-prose focus:outline-none" } },
    onUpdate: () => {
      setSaving(true);
      setDirty(true);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => save({ silent: true }), 800);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  // Sarlavha/subtitle — Google Docs/Notion uslubi: avto-balandlik <textarea>.
  useEffect(() => {
    for (const el of [titleRef.current, subtitleRef.current]) {
      if (!el) continue;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [title, excerpt]);

  const scheduleSave = () => {
    setSaving(true);
    setDirty(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save({ silent: true }), 800);
  };

  /** Ishchi nusxani saqlaydi. `true` = muvaffaqiyat. Nashr oqimi buni
   *  kutadi — saqlanmagan matn suratga tushmasligi kerak. */
  const save = (opts?: { silent?: boolean }): Promise<boolean> => {
    if (!editor) return Promise.resolve(false);
    setSaving(true);
    /* base64 muqova jimgina tushirib qoldiriladi. U `savePostSchema` dagi
       2000-belgilik chegaradan oʻtmaydi (indeks sahifasini shishirmasligi
       uchun ataylab shunday) — tekshirmasak, ilgari base64 yozib qoʻyilgan
       post BUTUNLAY saqlanmaydigan boʻlib qolardi: har avto-saqlash zod
       xatosiga urilar, foydalanuvchi esa nima buzilganini bilmasdi. */
    const cover = coverImageUrl.trim();
    return savePostAction({
      id: post.id,
      title,
      excerpt,
      coverImageUrl: cover && !cover.startsWith("data:") ? cover : null,
      content: editor.getHTML(),
    })
      .then(() => {
        setSaving(false);
        setSaveError(false);
        if (!opts?.silent) toast.success("Saqlandi");
        return true;
      })
      .catch((err: unknown) => {
        setSaving(false);
        setSaveError(true);
        /* Sababi ham koʻrsatiladi. Ilgari xato jimgina yutilardi va
           «Saqlashda xatolik» dan nima buzilgani umuman bilinmasdi —
           rasm limitidan oshgani ham, tarmoq uzilgani ham bir xil
           koʻrinardi (aynan shu bir kunlik izlanishga sabab boʻlgan). */
        console.error("[blog] savePostAction:", err);
        toast.error("Saqlashda xatolik", {
          description: err instanceof Error ? err.message : undefined,
        });
        return false;
      });
  };

  /** Muqova rasmini yuklash — siqish → saqlagich → URL.
   *
   *  ⛔ Hujjat ichidagi rasmdan FARQLI oʻlaroq, muqova base64 fallback'ni
   *  QABUL QILMAYDI. Sabab: `/blog` indeks sahifasi har bir postning
   *  muqovasini yuklaydi (`listPublishedPosts`), yaʼni base64 muqova butun
   *  roʻyxatni megabaytlarga shishirardi. Saqlagich sozlanmagan boʻlsa
   *  sabab ochiq aytiladi — jimgina ogʻir maʼlumot yozib qoʻyilmaydi. */
  const onPickCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCoverUploading(true);
    try {
      const dataUrl = await compressImageFile(file);
      const { url, stored } = await uploadEditorImageAction(dataUrl);
      if (!stored) {
        toast.error("Muqova rasmini yuklab boʻlmadi", {
          description: "Fayl saqlagichi sozlanmagan. Hozircha tashqi rasm havolasini qoʻying.",
        });
        return;
      }
      setCoverImageUrl(url);
      setCoverBroken(false);
      scheduleSave();
    } catch {
      toast.error("Muqova rasmini yuklab boʻlmadi");
    } finally {
      setCoverUploading(false);
    }
  };

  /** «Nashr qilish» (qoralama) / «Yangilash» (nashr qilingan, oʻzgargan) /
   *  «Qayta nashr qilish» (arxiv) — hammasi bitta amal: ishchi nusxa →
   *  surat. Avval saqlanadi (kutiladi), xato boʻlsa nashr toʻxtaydi. */
  const publish = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setPublishing(true);
    try {
      const ok = await save({ silent: true });
      if (!ok) {
        toast.error("Avval saqlab boʻlmadi — nashr qilinmadi");
        return;
      }
      await publishPostAction(post.id);
      setStatus("published");
      setDirty(false);
      toast.success("Nashr qilindi");
      router.refresh();
    } finally {
      setPublishing(false);
    }
  };

  const unpublish = async () => {
    setPublishing(true);
    try {
      await unpublishPostAction(post.id);
      setStatus("archived");
      toast.success("Nashrdan olindi");
      router.refresh();
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex h-dvh w-full flex-col bg-background">
      {/* ── Top bar ── */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/blog/studio" aria-label="Mening maqolalarim">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              saveError ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
            )}
          >
            {saving ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Saqlanmoqda
              </>
            ) : saveError ? (
              <>
                <span className="size-1.5 rounded-full bg-destructive" />
                Saqlanmadi
              </>
            ) : (
              <>
                <span className="size-1.5 rounded-full bg-success" />
                Saqlandi
              </>
            )}
          </span>
          {status === "published" && dirty && (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              · nashr qilinmagan oʻzgarishlar
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Koʻrish — DOIM yoqilgan. Preview marshruti draftMode cookie'ni
              qoʻyadi va ommaviy sahifani ishchi nusxa bilan koʻrsatadi. */}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/blog/studio/${post.id}/preview`} target="_blank">
              Koʻrish
            </Link>
          </Button>

          {status === "published" && !dirty ? (
            <Button size="sm" variant="outline" disabled className="gap-1.5">
              <Check className="size-3.5" />
              Nashr qilingan
            </Button>
          ) : (
            <Button size="sm" disabled={publishing} onClick={publish}>
              {status === "draft"
                ? "Nashr qilish"
                : status === "archived"
                  ? "Qayta nashr qilish"
                  : "Yangilash"}
            </Button>
          )}

          {status === "published" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8" disabled={publishing}>
                  <ChevronDown className="size-4" />
                  <span className="sr-only">Boshqa amallar</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={unpublish}>Nashrdan olish</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* ── Asboblar paneli — bitta qatorda, alohida karta emas (dars
          muharriri bilan bir xil naqsh). ── */}
      <div className="no-print flex shrink-0 justify-center overflow-x-auto border-b border-border bg-card/80 px-3 py-1.5 backdrop-blur">
        <EditorToolbar editor={editor} />
      </div>

      {/* ── Kontent — quti/fon yoʻq, sahifaning oʻzida oqadi ── */}
      <div className="flex-1 min-h-0 scrollbar-hover overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-10 md:py-14">
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              scheduleSave();
            }}
            placeholder="Sarlavha"
            rows={1}
            className="w-full resize-none overflow-hidden bg-transparent text-4xl font-bold leading-tight text-foreground outline-none placeholder:text-muted-foreground/40 md:text-5xl"
          />
          <textarea
            ref={subtitleRef}
            value={excerpt}
            onChange={(e) => {
              setExcerpt(e.target.value);
              scheduleSave();
            }}
            placeholder="Subtitr qoʻshing..."
            rows={1}
            className="mt-2 w-full resize-none overflow-hidden bg-transparent text-xl text-muted-foreground outline-none placeholder:text-muted-foreground/40"
          />

          <div className="mt-5 flex items-center gap-2.5">
            <Avatar className="size-7">
              {post.authorAvatarUrl && <AvatarImage src={post.authorAvatarUrl} alt={post.authorName} />}
              <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
                {initialsOf(post.authorName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground">{post.authorName}</span>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground"
              onClick={() => setCoverEditorOpen((v) => !v)}
            >
              <ImageIcon className="size-3.5" />
              {coverImageUrl ? "Muqova rasmi" : "Muqova rasmi qoʻshish"}
            </Button>
          </div>

          {(coverEditorOpen || coverImageUrl) && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  value={coverImageUrl}
                  onChange={(e) => {
                    setCoverImageUrl(e.target.value);
                    setCoverBroken(false);
                    scheduleSave();
                  }}
                  placeholder="https://... .jpg"
                  className="h-8 flex-1 rounded-md border-0 bg-muted px-2.5 text-xs text-foreground outline-none placeholder:text-muted-foreground"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  disabled={coverUploading}
                  onClick={() => coverFileRef.current?.click()}
                >
                  {coverUploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                  Yuklash
                </Button>
                <input
                  ref={coverFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickCover}
                />
                {coverImageUrl && (
                  <button
                    type="button"
                    aria-label="Olib tashlash"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setCoverImageUrl("");
                      setCoverEditorOpen(false);
                      scheduleSave();
                    }}
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              {/* Preview — ilgari muqova rasmi FAQAT nashr qilingan sahifada
                  va /blog roʻyxatida koʻrinardi, muharrirda esa URL qoʻyilgach
                  hech qanday belgi yoʻq edi (toʻgʻri qoʻyilgan-qoʻyilmaganini
                  bilishning yagona yoʻli — nashr qilib koʻrish). */}
              {coverImageUrl &&
                (coverBroken ? (
                  <div className="rounded-lg bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                    Bu manzildan rasm yuklanmadi. Koʻpincha sabab — galereya{" "}
                    <b>sahifasining</b> havolasi qoʻyilgan. Rasm ustiga oʻng tugma bosib{" "}
                    <b>«Rasm manzilini nusxalash»</b> ni tanlang — u <code>.jpg</code>,{" "}
                    <code>.png</code> yoki <code>.webp</code> bilan tugaydi. Yoki{" "}
                    <b>Yuklash</b> tugmasi bilan oʻz faylingizni qoʻying.
                  </div>
                ) : (
                  <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverImageUrl}
                      alt=""
                      className="size-full object-cover"
                      onError={() => setCoverBroken(true)}
                    />
                  </div>
                ))}
            </div>
          )}

          <div className={cn("relative", coverImageUrl || coverEditorOpen ? "mt-6" : "mt-8")}>
            {editor && (
              <BubbleMenu editor={editor} className="no-print">
                <BubbleToolbar editor={editor} />
              </BubbleMenu>
            )}
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}
