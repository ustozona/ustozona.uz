"use client";
import Image from "next/image";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { CLASS_COLOR_BASE } from "@/lib/class-colors";

export interface ServiceItem {
    heading: string;
    descp: string;
    image: string;
}

export interface ServicesProps {
    data?: ServiceItem[];
}

export const servicesData: ServiceItem[] = [
    {
        heading: "Elektron jurnal",
        descp: "Formativ va summativ baholarni sozlanadigan shkala asosida yuriting; sinf oʻrtachasi va oʻzlashtirish dinamikasi avtomatik hisoblanadi.",
        image: "/screens/grades.png"
    },
    {
        heading: "Dars jadvali",
        descp: "Sinflarni jadvalga sudrab tashlang, dars soatlarini belgilang — har sinf oʻz rangida, bir qarashda koʻrinadi.",
        image: "/screens/timetable.png"
    },
    {
        heading: "Dars rejalashtirish",
        descp: "Haftalik va oylik rejalashtiruvchi: keyingi darslar, topshiriqlar va baholash kunlarini bitta kalendarda boshqaring.",
        image: "/screens/planner.png"
    },
    {
        heading: "Davomat",
        descp: "Davomatni tez belgilang, sababli/sababsiz qoldirilgan kunlarni kuzating — natija oʻzlashtirishga bogʻlanadi.",
        image: "/screens/attendance.png"
    }
];

function Services({ data = servicesData }: ServicesProps) {
    const [activeIndex, setActiveIndex] = useState<number>(0);

    const handleMouseEnter = (index: number) => {
        setActiveIndex(index);
    };

    return (
        <section className="bg-background">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 lg:py-20 sm:py-16 py-8">
                <div className="flex flex-col sm:gap-16 gap-8">
                    <div className="flex md:flex-row flex-col justify-between md:items-end items-start gap-4">
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-left-10 duration-1000 delay-200 ease-in-out fill-mode-both">
                            <Badge variant="outline" className="py-1 px-3 h-auto text-sm font-normal border-0 outline outline-border">
                                Tizim ichidan
                            </Badge>
                            <h2 className="sm:text-5xl text-3xl text-foreground font-semibold">Nimalar qila olasiz</h2>
                            <p className="max-w-2xl text-muted-foreground sm:text-lg text-base">
                                Oʻqituvchining kundalik ishi — jurnal, jadval, rejalashtirish va davomat — bitta tizimda. Nomi ustiga olib boring va koʻring.
                            </p>
                        </div>
                        <Button
                            className={"group p-1 bg-primary hover:bg-primary/80 text-white font-medium flex gap-2 lg:gap-3 justify-between items-center rounded-full w-fit ps-5 h-auto border-0 animate-in fade-in slide-in-from-right-10 duration-1000 delay-200 ease-in-out fill-mode-both"}
                        >
                            <a href="/register" className="flex items-center gap-3 text-primary-foreground text-sm font-medium">
                                Bepul boshlang
                                <div className="p-2 bg-background rounded-full group-hover:rotate-45 transition-transform duration-300 ease-in-out">
                                    <Icon
                                        className="text-foreground"
                                        icon="lucide:arrow-up-right"
                                        width={16}
                                        height={16}
                                    />
                                </div>
                            </a>
                        </Button>
                    </div>
                    <div className="grid grid-cols-12 relative gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200 ease-in-out fill-mode-both">
                        <div className="w-full lg:col-span-4 col-span-12 flex items-center justify-center">
                            <div className={`transition-all duration-300 z-10 w-full`} >
                                {data?.[activeIndex]?.image && (
                                    <Image
                                        key={data[activeIndex].image}
                                        src={data[activeIndex].image}
                                        alt={data[activeIndex].heading}
                                        width={1440}
                                        height={900}
                                        className="w-full h-auto object-contain rounded-xl border border-border shadow-sm animate-in fade-in duration-500"
                                    />
                                )}
                            </div>
                        </div>
                        <div className="lg:col-span-1" />
                        <div className="w-full flex flex-col gap-16 lg:col-span-7 col-span-12">
                            <div>
                                {data?.map((value, index) => (
                                    <div
                                        key={index}
                                        onMouseEnter={(e) => handleMouseEnter(index)}
                                        className="group py-6 xl:py-10 border-t border-border cursor-pointer flex xl:flex-row flex-col xl:items-center items-start justify-between xl:gap-10 gap-1 relative">
                                        <h3
                                            className="py-1 text-2xl md:text-3xl font-semibold text-foreground max-w-2xs w-full transition-colors"
                                            style={activeIndex === index ? { color: CLASS_COLOR_BASE.teal } : undefined}
                                        >
                                            {value.heading}
                                        </h3>
                                        {activeIndex === index && (
                                            <p className="text-muted-foreground text-base transition-all duration-300 flex-1">
                                                {value.descp}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Services;
