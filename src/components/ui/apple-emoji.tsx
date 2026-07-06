import { cn } from "@/lib/utils";

/**
 * Apple uslubidagi emoji — `emoji-datasource-apple` sprite CDN'idan bitta PNG.
 * Native emoji OS'ga qarab har xil koʻrinadi; bu esa hamma platformada bir xil
 * Apple renderini beradi. `code` — unified kod fayl nomi (mas. "2600-fe0f").
 */
const EMOJI_CDN = "https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.2/img/apple/64/";

export function AppleEmoji({
  code,
  label,
  className,
}: {
  code: string;
  label: string;
  className?: string;
}) {
  return (
    <img
      src={`${EMOJI_CDN}${code}.png`}
      alt={label}
      draggable={false}
      loading="lazy"
      className={cn("inline-block size-[1.1em] align-[-0.15em] select-none", className)}
    />
  );
}
