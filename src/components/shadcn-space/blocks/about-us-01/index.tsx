"use client";
import AboutUs, { type StatItem } from "@/components/shadcn-space/blocks/about-us-01/about-us";

// Faqat tekshirib boʻladigan mahsulot faktlari — foydalanuvchi soni EMAS.
// Raqamlar oʻqituvchining ogʻrigʻi tilida: nechta bosish, nechta daqiqa.
const stats: StatItem[] = [
  {
    value: 1,
    unit: "bosish",
    title: "Davomat",
    descp: "Butun sinf kelgan boʻlsa — sana ustunini bosasiz, tamom.",
  },
  {
    value: 0,
    unit: "daqiqa",
    title: "Chorak hisoboti",
    descp: "Yakuniy baho kategoriya va vaznlar asosida oʻzi hisoblanadi.",
  },
  {
    value: 0,
    unit: "marta",
    title: "Kalkulyator",
    descp: "Oʻrtacha ballni qoʻlda hisoblash degan ish qolmaydi.",
  },
  {
    display: "∞",
    title: "Sinf va oʻquvchi",
    descp: "Hech qanday cheklov yoʻq — istalgancha qoʻshavering.",
  },
];

const AboutAndStats01 = () => {
  return <AboutUs stats={stats} />;
};

export default AboutAndStats01;
