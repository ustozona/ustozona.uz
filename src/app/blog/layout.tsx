import { Source_Serif_4 } from "next/font/google";

/* Blog uchun serif shrift — FAQAT shu boʻlim ichida (CSS var bilan
   qamrovlangan), Ustozona ilovasining qolgan qismi DM Sans'da qoladi.
   Substack/Medium uslubidagi oʻqish tajribasi shu yerga xos, brend
   shriftini oʻzgartirmaydi. */
const serif = Source_Serif_4({
  variable: "--font-blog-serif",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <div className={serif.variable}>{children}</div>;
}
