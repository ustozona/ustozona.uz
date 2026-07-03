import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { LucideIcon, Layers } from "lucide-react";
import { motion } from "motion/react";
import { LandingGlow } from "@/components/landing/LandingGlow";

type Features = {
  icon: LucideIcon;
  content: string;
}[];

const Feature = ({ featureData }: { featureData: Features }) => {
  return (
    <section className="relative">
      <LandingGlow className="left-1/2 top-24 -translate-x-1/2 w-[70%] h-[40%]" />
      <div className="lg:py-20 sm:py-16 py-8 ">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="flex flex-col gap-8 md:gap-12">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.8,
                ease: [0.21, 0.47, 0.32, 0.98],
              }}
              className="flex flex-col md:flex-row items-center md:items-end justify-center md:justify-between gap-4"
            >
              <div className="flex flex-col gap-4 max-w-full items-center md:items-start text-center md:text-left md:max-w-xl">
                <Badge
                  variant={"outline"}
                  className="px-3 py-1 h-auto text-sm font-normal"
                >
                  Nega Ustozona?
                </Badge>
                <h2 className="text-3xl md:text-4xl font-semibold">
                  Qogʻozbozlik emas, oʻqitish
                </h2>
                <p className="text-lg font-normal text-muted-foreground">
                  Jurnal, davomat va jadval bir-biriga bogʻlangan. Bir marta
                  kiritasiz — hamma joyda yangilanadi, qolgan vaqt oʻquvchilarga.
                </p>
              </div>
              <Button asChild className="rounded-full px-5 py-2.5 shadow-xs h-auto cursor-pointer">
                <a href="#">Bepul boshlang</a>
              </Button>
            </motion.div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.8,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="h-full w-full rounded-2xl bg-primary text-primary-foreground"
              >
                <Card className="flex h-full items-start gap-10 sm:gap-12 has-data-[slot=card-footer]:pb-6! sm:has-data-[slot=card-footer]:pb-10! pt-8 sm:py-12 border-none shadow-none ring-0 rounded-2xl bg-transparent">
                  <CardContent className="flex flex-col gap-6 px-6 sm:px-10">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary-foreground/15">
                      <Layers className="size-6" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-medium leading-snug">
                      Bir marta kiriting — jurnal, davomat va jadval oʻzaro
                      bogʻlanadi, qolgan hammasi avtomatik yangilanadi.
                    </h3>
                  </CardContent>
                  <CardFooter className="border-none w-full px-6 sm:px-10 py-0 flex flex-col items-start gap-0.5">
                    <p className="text-sm font-medium text-primary-foreground">
                      Bitta tizim
                    </p>
                    <span className="text-xs font-normal text-primary-foreground/70 uppercase">
                      Oʻqituvchining butun ish oqimi
                    </span>
                  </CardFooter>
                </Card>
              </motion.div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
                {featureData?.map((value, index) => {
                  return (
                    <motion.div
                      key={index}
                      initial={{ x: 100, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.8,
                        ease: [0.21, 0.47, 0.32, 0.98],
                      }}
                    >
                      <Card className="py-8 bg-muted ring-0 border-0 h-full">
                        <CardContent className="w-full h-full px-8 flex flex-col items-start gap-12 justify-between">
                          <value.icon
                            className="w-6 h-6 text-muted-foreground"
                            strokeWidth={1.5}
                          />
                          <p className="text-base text-primary font-normal">
                            {value?.content}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Feature;
