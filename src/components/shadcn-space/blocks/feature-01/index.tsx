"use client";
import { useTranslations } from "next-intl";
import Feature from "@/components/shadcn-space/blocks/feature-01/feature";
import { ArrowDownUp, BellRing, TrendingUp, Tag } from "lucide-react"

const ICONS = [ArrowDownUp, BellRing, TrendingUp, Tag];

const Feature01 = () => {
  const t = useTranslations("Landing.feature");
  const items = t.raw("items") as string[];
  // `ICONS[i] ?? ICONS[0]` — tarjima massivi uzunligi mos kelmasa ikona
  // undefined boʻlib qolmasin.
  const featureData = items.map((content, i) => ({ icon: ICONS[i] ?? ICONS[0], content }));
  return (
    <>
      <Feature featureData={featureData} />
    </>
  );
};

export default Feature01;
