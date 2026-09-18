import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/* Tipografika rollari (globals.css `@theme`) — tailwind-merge ularni
   bilmaydi va `text-caption` ni RANG deb oʻylaydi: `cn("text-caption
   text-foreground")` rolni butunlay tashlab yuborardi. Shu yerda
   font-size guruhiga qoʻshiladi. Yangi rol qoʻshilsa — bu roʻyxatga ham. */
const TEXT_ROLES = [
  "micro", "label", "caption", "body", "reading",
  "title-sm", "title", "headline",
]

const twMerge = extendTailwindMerge({
  extend: { theme: { text: TEXT_ROLES } },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
