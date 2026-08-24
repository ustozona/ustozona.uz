import { Instrument_Serif } from "next/font/google";
import { useTranslations } from "next-intl";
import ButtonWithIcon from "@/components/shadcn-space/button/button-01";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
});

function HeroSection() {
  const t = useTranslations("Landing");
  return (
    <section>
      <div className="w-full h-full relative">
        <div className="relative w-full pt-0 md:pt-20 pb-6 md:pb-10 before:absolute before:w-full before:h-full before:bg-linear-to-r before:from-sky-100 before:via-white before:to-amber-100 before:rounded-full before:top-24 before:blur-3xl before:-z-10 dark:before:from-slate-800 dark:before:via-black dark:before:to-stone-700 dark:before:rounded-full dark:before:blur-3xl dark:before:-z-10">
          <div className="container mx-auto relative z-10">
            <div className="flex flex-col max-w-5xl mx-auto gap-8">
              <div className="relative flex flex-col text-center items-center sm:gap-6 gap-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  {t("hero.badge")}
                </div>
                <h1 className="lg:text-8xl md:text-7xl text-5xl font-medium leading-14 md:leading-20 lg:leading-24">
                  {t("hero.titleLine1")}{" "}
                  <span
                    className={`${instrumentSerif.className} tracking-tight text-primary`}
                  >
                    {t("hero.titleHighlight")}
                  </span>
                </h1>
                <p className="text-base font-normal max-w-2xl text-muted-foreground">
                  {t("hero.subtitle")}
                </p>
              </div>
              <div className="flex items-center flex-col gap-3">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <ButtonWithIcon href="/register">{t("common.register")}</ButtonWithIcon>
                  <ButtonWithIcon href="#features" variant="outline">
                    {t("hero.ctaSecondary")}
                  </ButtonWithIcon>
                </div>
                <p className="text-sm font-normal text-muted-foreground">
                  {t("common.freeNote")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
