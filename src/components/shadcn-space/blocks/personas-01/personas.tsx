"use client";

import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";
import { School, GraduationCap, BookOpen, Users } from "lucide-react";

type Persona = {
  icon: typeof School;
  title: string;
  descp: string;
};

const personas: Persona[] = [
  {
    icon: School,
    title: "Maktab oʻqituvchisi",
    descp: "Bir nechta sinf, jurnal, davomat va jadval — hammasi bitta joyda.",
  },
  {
    icon: GraduationCap,
    title: "Repetitor",
    descp: "Shaxsiy oʻquvchilar bilan rejalashtirish va oʻzlashtirishni kuzating.",
  },
  {
    icon: BookOpen,
    title: "Kurs oʻqituvchisi",
    descp: "Oʻquv markazi guruhlari uchun baholash va hisobotni soddalashtiring.",
  },
  {
    icon: Users,
    title: "Oʻquv markazi",
    descp: "Koʻp oʻqituvchili boshqaruv — tez orada qoʻshiladi.",
  },
];

const Personas = () => {
  return (
    <section className="bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:py-20 sm:py-16 py-8">
        <div className="flex flex-col gap-8 md:gap-12">
          <div className="flex flex-col gap-4 max-w-2xl">
            <Badge
              variant="outline"
              className="py-1 px-3 h-auto text-sm font-normal w-fit"
            >
              Kimlar uchun
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-semibold text-foreground">
              Qanday dars bersangiz ham, sizga moslashadi
            </h2>
            <p className="text-muted-foreground sm:text-lg">
              Maktab, repetitorlik yoki oʻquv markazi — Ustozona oʻqituvchining
              kundalik ishiga moslashadi.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {personas.map((persona, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: "easeInOut" }}
                className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 h-full transition-colors hover:bg-accent"
              >
                <div className="w-fit rounded-lg bg-muted p-3 text-foreground">
                  <persona.icon className="h-6 w-6" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-semibold text-foreground">
                    {persona.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {persona.descp}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Personas;
