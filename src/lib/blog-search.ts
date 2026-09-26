/* Blog qidiruvi — server (indeks sahifasi, `?q=`) va klient (Ctrl K oynasi)
   bir xil qoidada ishlashi uchun umumiy modul. */

export type BlogSearchable = { title: string; excerpt: string; authorName: string };

/* Oʻzbekcha matnda apostrof turli shaklda yoziladi (ʻ ʼ ' ` ‘ ’) —
   ularni bitta belgiga keltiramiz, aks holda «o'qituvchi» «oʻqituvchi» ni
   topmaydi. */
function normalize(s: string): string {
  return s.toLocaleLowerCase("uz").replace(/[ʻʼ'`‘’]/g, "'");
}

/** Soʻrovdagi HAR BIR soʻz sarlavha, subtitr yoki muallif ismida boʻlishi kerak. */
export function matchesBlogQuery(post: BlogSearchable, q: string): boolean {
  const hay = normalize(`${post.title} ${post.excerpt} ${post.authorName}`);
  return normalize(q)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => hay.includes(word));
}
