import Link from "next/link";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmojiText } from "@/components/ui/emoji-text";
import { isWhitelistedInternalHref } from "@/lib/internal-links";
import { FEEDBACK_LINK_RE } from "@/lib/feedback-link-markup";

export { stripLinkMarkup } from "@/lib/feedback-link-markup";

/* Ikon inline matn ichida — xuddi shu vertikal-tekislash konvensiyasi
   `AppleEmoji`da ham ishlatiladi (apple-emoji.tsx: "align-[-0.15em]"),
   shu yerda ham TAKRORLANADI (yagona manba emas — sabab: bu yerdagi ikon
   `<svg>`, u yerdagi `<img>`; ikkalasi ham xuddi shu piksel offset kerak,
   lekin turli DOM elementiga qoʻllanadi, umumiy konstantaga chiqarish
   ortiqcha abstraksiya boʻlardi bitta className satri uchun). */
export const FEEDBACK_LINK_ICON_CLASS = "inline-block size-3.5 align-[-0.15em]";

/** Chip (composer va oʻqish rejimi) bir xil koʻrinishda boʻlishi uchun umumiy klass.
    Rang `text-foreground` (`text-primary` EMAS) — bu palitrada `--primary`
    (oklch 0.28) `--foreground`dan (oklch 0.145) sezilarli OCHROQ ("soft
    black" — tugma foni uchun moʻljallangan, matn uchun emas), shuning uchun
    havola tanadan "yuvilib ketgan" koʻrinardi.

    Default — nuqtali ostki chiziq (bu maxsus matn ekanini bildiradi, lekin
    tutash chiziqcha kuchli emas). Hover — `Button variant="ghost"`dagi naqsh
    (button.tsx: "hover:bg-accent hover:text-accent-foreground") ustiga
    qoʻshiladi: yumshoq fon paydo boʻladi, chiziq nuqtali holicha qoladi.
    `px-1 -mx-1` — fon uchun joy beradi, lekin default holatda matn
    joylashuviga taʼsir qilmaydi (negativ margin bilan kompensatsiya). */
export const FEEDBACK_LINK_CHIP_CLASS =
  "rounded-md px-1 -mx-1 py-0.5 -my-0.5 text-foreground underline decoration-dotted decoration-foreground/40 underline-offset-4 transition-colors duration-fast hover:bg-accent";

/* ════════════════════════════════════════════════════════════════════
   FEEDBACK MATNIDAGI ICHKI HAVOLA — `[Nom](/yoʻl)` sintaksisi.

   Bu markdown emas (faqat shu bitta naqsh tushuniladi). `/yoʻl` FAQAT
   `internal-links.ts` oq roʻyxatida boʻlsagina bosiladigan linkka
   aylanadi — aks holda xom matn sifatida chiqadi (xavfsiz fallback).
   ════════════════════════════════════════════════════════════════════ */

/** Feedback body/reply matnini chizadi — emoji + ichki havolalar. */
export function RichFeedbackText({ text, className }: { text: string; className?: string }) {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  const linkRe = new RegExp(FEEDBACK_LINK_RE);
  while ((m = linkRe.exec(text))) {
    const [full, label, href] = m;
    if (m.index > last) {
      nodes.push(<EmojiText key={key++} text={text.slice(last, m.index)} className={className} />);
    }
    if (isWhitelistedInternalHref(href)) {
      nodes.push(
        <Link key={key++} href={href} className={FEEDBACK_LINK_CHIP_CLASS}>
          <FileText className={cn(FEEDBACK_LINK_ICON_CLASS, "mr-0.5")} />
          {label}
        </Link>
      );
    } else {
      nodes.push(<span key={key++}>{full}</span>);
    }
    last = m.index + full.length;
  }
  if (last < text.length) {
    nodes.push(<EmojiText key={key++} text={text.slice(last)} className={className} />);
  }
  return <>{nodes}</>;
}
