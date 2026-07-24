import { AppleEmojiSprite } from "@/components/ui/apple-emoji";

/** Emoji-belgilarni aniqlash uchun Unicode property regex (grafema darajasida). */
const EMOJI_RE = /\p{Extended_Pictographic}(?:️)?(?:‍\p{Extended_Pictographic}(?:️)?)*/gu;

/**
 * Foydalanuvchi yozgan erkin matnni (feedback, izoh, vazifa nomi va h.k.)
 * chizadi — matndagi HAR qanday unicode emoji Apple sprite'ga almashtiriladi,
 * shu bilan OS'ning native emoji shrifti hech qachon koʻrinmaydi.
 */
export function EmojiText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(EMOJI_RE);
  const matches = text.match(EMOJI_RE) ?? [];
  if (matches.length === 0) return <>{text}</>;
  const nodes: React.ReactNode[] = [];
  parts.forEach((part, i) => {
    if (part) nodes.push(<span key={`t${i}`}>{part}</span>);
    if (matches[i]) {
      nodes.push(
        <AppleEmojiSprite key={`e${i}`} emoji={matches[i]} className={className ?? "size-[1.1em] -translate-y-[0.1em]"} />
      );
    }
  });
  return <>{nodes}</>;
}
