import { addDays } from "date-fns";

/**
 * Extracts mentions, class tags, and dates from natural language text.
 * Example: "Ertaga soat 14:00 da majlis #8-a @Aliyev"
 */
export function parseTaskNLP(text: string) {
  const mentions: string[] = [];
  const classIds: string[] = [];
  let dueDate: string | null = null;

  // 1. Mentions (@username) ni qidirish
  const mentionRegex = /@(\w+)/g;
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  
  // 2. Classes (#class-id) ni qidirish
  const classRegex = /#([\w-]+)/g;
  while ((match = classRegex.exec(text)) !== null) {
    classIds.push(match[1].toLowerCase());
  }

  // 3. Sanalarni (NLP) aniqlash
  const lowerText = text.toLowerCase();
  const today = new Date();
  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  if (lowerText.includes("bugun")) {
    dueDate = formatDate(today);
  } else if (lowerText.includes("ertaga")) {
    dueDate = formatDate(addDays(today, 1));
  } else if (lowerText.includes("indinga")) {
    dueDate = formatDate(addDays(today, 2));
  } else if (lowerText.includes("dushanba")) {
    // Eng yaqin dushanbani topish
    const d = new Date(today);
    d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
    dueDate = formatDate(d);
  } else if (lowerText.includes("juma")) {
    const d = new Date(today);
    d.setDate(d.getDate() + ((5 + 7 - d.getDay()) % 7 || 7));
    dueDate = formatDate(d);
  }

  // Tozalangan title (taglar va mentionlarni olib tashlash)
  let cleanTitle = text
    .replace(mentionRegex, "")
    .replace(classRegex, "")
    // Vaqt so'zlarini tozalash ixtiyoriy, hozircha qoldiramiz (kontekst uchun yaxshi)
    .trim()
    .replace(/\s+/g, " ");

  return {
    title: cleanTitle,
    mentions,
    classIds,
    dueDate
  };
}
