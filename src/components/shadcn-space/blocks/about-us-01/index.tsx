"use client";
import AboutUs from "@/components/shadcn-space/blocks/about-us-01/about-us";
import { Target, WandSparkles, Zap } from "lucide-react";

import type { ClassColor } from "@/lib/class-colors";

const aboutusData: { icon: typeof Target; title: string; color: ClassColor }[] = [
    {
      icon: WandSparkles,
      title: "Qulaylik",
      color: "blue",
    },
    {
      icon: Zap,
      title: "Tezkorlik",
      color: "teal",
    },
    {
      icon: Target,
      title: "Sifat",
      color: "orange",
    }
];

const AboutAndStats01 = () => {
  return (
    <>
      <AboutUs aboutusData={aboutusData} />
    </>
  );
};

export default AboutAndStats01;
