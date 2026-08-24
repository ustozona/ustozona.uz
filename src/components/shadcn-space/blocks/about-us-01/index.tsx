"use client";
import { useTranslations } from "next-intl";
import AboutUs, { type StatItem } from "@/components/shadcn-space/blocks/about-us-01/about-us";

// Faqat tekshirib boʻladigan mahsulot faktlari — foydalanuvchi soni EMAS.
// Raqamlar oʻqituvchining ogʻrigʻi tilida: nechta bosish, nechta daqiqa.
const VALUES: { value?: number; display?: string }[] = [
  { value: 1 },
  { value: 0 },
  { value: 0 },
  { display: "∞" },
];

const AboutAndStats01 = () => {
  const t = useTranslations("Landing.stats");
  const items = t.raw("items") as { unit: string; title: string; descp: string }[];
  const stats: StatItem[] = items.map((item, i) => ({
    ...VALUES[i],
    unit: item.unit || undefined,
    title: item.title,
    descp: item.descp,
  }));
  return <AboutUs stats={stats} />;
};

export default AboutAndStats01;
