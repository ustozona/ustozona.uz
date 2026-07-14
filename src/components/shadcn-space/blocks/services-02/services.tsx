"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import ButtonWithIcon from "@/components/shadcn-space/button/button-01";
import { SERVICE_PREVIEWS } from "@/components/shadcn-space/blocks/services-02/previews";

const BRAND_YELLOW = "#FBC02D";

export interface ServiceItem {
    /** SERVICE_PREVIEWS dagi mini-koʻrinish kaliti */
    id: keyof typeof SERVICE_PREVIEWS;
    heading: string;
    descp: string;
}

export interface ServicesProps {
    data?: ServiceItem[];
}

export const servicesData: ServiceItem[] = [
    {
        id: "jurnal",
        heading: "Elektron jurnal va baholash",
        descp: "Kategoriya va vaznlarni bir marta sozlaysiz («Uy vazifasi 20%, imtihon 50%») — tizim qolganini oʻzi qiladi. Past ball qizil, yuqori ball yashil boʻlib boʻyaladi: sinf holati bir qarashda koʻrinadi.",
    },
    {
        id: "davomat",
        heading: "Davomat — bir bosishda",
        descp: "Butun sinf kelgan boʻlsa, sana ustunini bosib «hammasi keldi» deb bir marta belgilaysiz. Har bir yozuvga alohida izoh qoldirish mumkin.",
    },
    {
        id: "xulq",
        heading: "Xulq-atvor bali — oʻzi hisoblanadi",
        descp: "Kechikish, dars qoldirish va topshiriqni kechiktirish asosida oʻquvchining xulq bali avtomatik shakllanib boradi. Eng zerikarli ish oʻz-oʻzidan bajariladi.",
    },
    {
        id: "jadval",
        heading: "Dars jadvali va rejalashtirish",
        descp: "Yil oʻrtasida jadval oʻzgarsa, eski oylarning tarixi va baholari buzilmaydi. Qoʻngʻiroq jadvali va darsni sudrab koʻchirish ham bor.",
    },
    {
        id: "muharrir",
        heading: "Dars muharriri va PDF",
        descp: "Toʻliq matn muharririda dars ishlanmangizni yozasiz va bir bosishda A4 formatda chop etishga tayyor PDF qilib olasiz.",
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
                            <h2 className="sm:text-5xl text-3xl text-foreground font-semibold">Nimalar qila olasiz?</h2>
                            <p className="max-w-2xl text-muted-foreground sm:text-lg text-base">
                                Oʻqituvchining kundalik ishi — jurnal, davomat, xulq, jadval va dars ishlanmasi — bitta tizimda. Nomi ustiga olib boring va koʻring.
                            </p>
                        </div>
                        <ButtonWithIcon
                            href="/register"
                            className="animate-in fade-in slide-in-from-right-10 duration-1000 delay-200 ease-in-out fill-mode-both"
                        >
                            Oʻzlashtirishni kuzatish
                        </ButtonWithIcon>
                    </div>
                    <div className="grid grid-cols-12 relative gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200 ease-in-out fill-mode-both">
                        <div className="w-full lg:col-span-4 col-span-12 flex items-start justify-center lg:sticky lg:top-28 lg:self-start">
                            {(() => {
                                const active = data?.[activeIndex];
                                if (!active) return null;
                                const Preview = SERVICE_PREVIEWS[active.id];
                                return (
                                    <div
                                        key={active.id}
                                        className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
                                    >
                                        <Preview />
                                    </div>
                                );
                            })()}
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
                                            style={activeIndex === index ? { color: BRAND_YELLOW } : undefined}
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
