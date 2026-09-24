/* Admin roʻyxatlari uchun URL quruvchi — foydalanuvchilar, fikrlar va
   audit jurnali filtr/sahifa holatini URLʼda saqlaydi.

   Qoida hamma joyda bir xil: boʻsh qiymat URLʼga yozilmaydi, 1-sahifa
   ham yozilmaydi — havola qisqa qoladi va «tozalangan» filtr bilan
   filtrsiz sahifa bitta URL boʻladi. */
export function adminHref(
  path: string,
  params: Record<string, string | undefined>,
  page = 1,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const qs = search.toString();
  return `${path}${qs ? `?${qs}` : ""}`;
}
