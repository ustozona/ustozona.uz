/* ════════════════════════════════════════════════════════════════════
   IXCHAM SON — «1 234» → «1,2 ming», «2 500 000» → «2,5 mln».

   `Intl.NumberFormat("uz", { notation: "compact" })` oʻzbekcha uchun
   ishonchli qisqartma bermaydi (ba'zi muhitlarda inglizcha «K»/«M»
   qaytaradi), shuning uchun qoʻlda. Oʻnli ajratgich — vergul.
   ════════════════════════════════════════════════════════════════════ */

/** Manfiy boʻlmagan butun sonni ixcham oʻzbekcha koʻrinishga oʻgiradi. */
export function formatCountUz(n: number): string {
  const v = Math.max(0, Math.floor(n));
  if (v < 1000) return String(v);
  if (v < 1_000_000) {
    const k = v / 1000;
    const s = k < 10 ? k.toFixed(1) : Math.round(k).toString();
    return `${s.replace(".", ",").replace(",0", "")} ming`;
  }
  const m = v / 1_000_000;
  const s = m < 10 ? m.toFixed(1) : Math.round(m).toString();
  return `${s.replace(".", ",").replace(",0", "")} mln`;
}

/** "128 koʻrildi" / "1,2 ming koʻrildi" */
export function viewsLabelUz(n: number): string {
  return `${formatCountUz(n)} koʻrildi`;
}
