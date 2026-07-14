import { Badge } from "@/components/ui/badge";
import ButtonWithIcon from "@/components/shadcn-space/button/button-01";
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
                  Vaqtni qogʻozbozlikka emas, oʻqitishga sarflang
                </h2>
                <p className="text-lg font-normal text-muted-foreground">
                  Har bir darsning 5–10 daqiqasi davomatga ketadi. Kechikkanlarni,
                  uy vazifasi qilmaganlarni alohida daftarga yozasiz. Chorak
                  yakunida esa kalkulyator koʻtarib tungacha oʻrtacha ballni
                  hisoblaysiz.
                </p>
              </div>
              <ButtonWithIcon href="/register">Jurnalni yaratish</ButtonWithIcon>
            </motion.div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
              <motion.div
                initial={{ y: 24, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{
                  duration: 0.5,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="h-full w-full rounded-2xl text-neutral-900"
                style={{ backgroundColor: "#FBC02D" }}
              >
                <Card className="flex h-full items-start gap-10 sm:gap-12 has-data-[slot=card-footer]:pb-6! sm:has-data-[slot=card-footer]:pb-10! pt-8 sm:py-12 border-none shadow-none ring-0 rounded-2xl bg-transparent">
                  <CardContent className="flex flex-col gap-6 px-6 sm:px-10">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-neutral-900/10 ring-1 ring-neutral-900/15">
                      <Layers
                        className="size-6 text-neutral-900"
                        strokeWidth={1.5}
                      />
                    </div>
                    {/* Rang MAJBURIY: fon endi brend sarigʻi (#FBC02D) —
                        matn qora (text-neutral-900) boʻlmasa oʻqilmaydi. */}
                    <h3 className="text-2xl sm:text-3xl font-medium leading-snug text-neutral-900">
                      Ustozonada davomat bir bosishda belgilanadi. Kechikkanlarning
                      xulq bali oʻzi pasayadi, yakuniy baho esa soniyalar ichida
                      hisoblanadi.
                    </h3>
                  </CardContent>
                  <CardFooter className="border-none w-full px-6 sm:px-10 py-0 flex flex-col items-start gap-0.5">
                    <p className="text-sm font-medium text-neutral-900">
                      Bitta tizim
                    </p>
                    <span className="text-xs font-normal text-neutral-900/70 uppercase">
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
                      initial={{ y: 24, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      viewport={{ once: true, amount: 0.1 }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.06,
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
