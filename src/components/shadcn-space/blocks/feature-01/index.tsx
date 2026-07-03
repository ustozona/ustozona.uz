"use client";
import Feature from "@/components/shadcn-space/blocks/feature-01/feature";
import { ArrowDownUp, BellRing, TrendingUp, Tag } from "lucide-react"

const featureData = [
    {
      icon: ArrowDownUp,
      content: "Jurnal, davomat va jadval bogʻlangan — bir marta kiriting, hamma joyda yangilanadi.",
    },
    {
      icon: BellRing,
      content: "Topshiriq muddati va baholash kuni haqida oʻz vaqtida eslatma olasiz.",
    },
    {
      icon: TrendingUp,
      content: "Oʻzlashtirish dinamikasi va sinf oʻrtachasi avtomatik hisoblanadi.",
    },
    {
      icon: Tag,
      content: "Har sinf va mavzuga oʻz rangi — bir qarashda topasiz va ajratasiz.",
    },
];

const Feature01 = () => {
  return (
    <>
      <Feature featureData={featureData} />
    </>
  );
};

export default Feature01;
