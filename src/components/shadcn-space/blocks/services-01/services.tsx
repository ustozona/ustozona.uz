"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { LandingGlow } from "@/components/landing/LandingGlow";
import {
  LucideIcon,
  NotebookPen,
  CalendarCheck,
  Target,
  CalendarRange,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";

type ServiceData = {
  service_icon: LucideIcon;
  service_title: string;
};

const serviceData: ServiceData[] = [
  {
    service_icon: NotebookPen,
    service_title: "Elektron jurnal",
  },
  {
    service_icon: CalendarCheck,
    service_title: "Davomat nazorati",
  },
  {
    service_icon: Target,
    service_title: "Standartlar va oʻzlashtirish",
  },
  {
    service_icon: CalendarRange,
    service_title: "Dars rejalashtirish",
  },
  {
    service_icon: BarChart3,
    service_title: "Hisobot va tahlil",
  },
];

const Services = () => {
  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 80,
    },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.3,
        duration: 0.6,
        ease: "easeInOut" as const,
      },
    }),
  };

  return (
    <section className="relative bg-background py-10">
      <LandingGlow className="left-1/2 top-24 -translate-x-1/2 w-[70%] h-[40%]" />
      <div className="max-w-7xl mx-auto px-4 lg:px-8 xl:px-16">
        <div className="flex flex-col gap-8 sm:gap-16 justify-center items-center w-full">
          {/* Heading */}
          <div className="flex flex-col gap-4 justify-center items-center animate-in fade-in slide-in-from-top-10 duration-1000 delay-200 ease-in-out fill-mode-both">
            {/* Badge */}
            <Badge
              variant={"outline"}
              className="text-sm font-normal py-1 px-3 h-7"
            >
              Xususiyatlar
            </Badge>
            {/* Heading */}
            <div className="max-w-3xs sm:max-w-lg mx-auto text-center">
              <h2 className="text-foreground text-3xl sm:text-5xl font-medium">
                Barcha imkoniyatlar bir joyda
              </h2>
            </div>
          </div>
          <div className="flex flex-col gap-8 sm:gap-12 justify-center items-center">
            {/* services */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6 w-full">
              {serviceData.map((service, index) => (
                <motion.div
                  key={index}
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={index}
                >
                  <Card className="ring-0 p-8 border-0 shadow-none bg-muted h-full transition-colors hover:bg-accent">
                    <CardContent className="p-0 flex flex-col items-start justify-between gap-12 sm:gap-16">
                      <service.service_icon
                        size={32}
                        className="text-foreground"
                      />
                      <p className="text-2xl font-medium max-w-36 text-foreground">
                        {service.service_title}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            {/* cta */}
            <div className="bg-primary rounded-2xl p-8 flex flex-col lg:flex-row items-center justify-between gap-12 w-full animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200 ease-in-out fill-mode-both">
              <div className="text-center md:text-start">
                <p className="text-2xl font-medium text-primary-foreground">
                  Tizimni amalda koʻring.{" "}
                </p>
                <p className="text-2xl font-medium text-primary-foreground">
                  Bepul sinab koʻrishni hoziroq boshlang!
                </p>
              </div>
              <div className="flex md:flex-row flex-col items-center gap-4">
                <Button asChild className="group text-sm font-medium text-primary bg-background hover:bg-background/90 rounded-full flex items-center gap-4 p-1 ps-5 w-fit h-12 cursor-pointer">
                  <a href="#">
                    <span>Bepul sinab koʻrish</span>
                    <div className="p-3 bg-primary text-primary-foreground rounded-full group-hover:rotate-45 transition-transform duration-300 ease-in-out shrink-0">
                      <ArrowUpRight size={16} />
                    </div>
                  </a>
                </Button>
                <Button asChild className="group text-sm font-medium text-primary-foreground bg-transparent hover:bg-primary-foreground/10 rounded-full border border-primary-foreground/30 flex items-center gap-4 p-1 ps-5 w-fit h-12 cursor-pointer">
                  <a href="#">
                    <span>Batafsil maʼlumot</span>
                    <div className="p-3 bg-primary-foreground text-primary rounded-full group-hover:rotate-45 transition-transform duration-300 ease-in-out shrink-0">
                      <ArrowUpRight size={16} />
                    </div>
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
