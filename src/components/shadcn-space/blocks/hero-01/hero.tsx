import type { ComponentType } from "react";
import { Instrument_Serif } from "next/font/google";
import { useTranslations } from "next-intl";
import { ArrowRight, ListChecks, Presentation, Sparkles, UserCheck } from "lucide-react";
import ButtonWithIcon from "@/components/shadcn-space/button/button-01";
import { IconTimer, IconTrafficLight } from "@/components/doska/icons";
import { LANDING_TONES, type LandingTone } from "@/components/landing/landing-tones";
import { cn } from "@/lib/utils";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
});

/**
 * «Bugun darsda nima qilasiz?» — vazifa tugmalari. Matn tarjimada
 * (`Landing.hero.tasks`, tartib shu massiv bilan bir xil), manzil, rang
 * va ikonka shu yerda.
 *
 * Hero — foydali vosita, vaʼda emas: oʻqituvchi oʻz vazifasini tanlaydi
 * va darhol kerakli joyga tushadi. Doska'ga oid ikkitasi roʻyxatdan
 * oʻtmasdan ishlaydi — shuning uchun birinchi turadi.
 */
const TASKS: { href: string; tone: LandingTone; Icon: ComponentType<{ className?: string }> }[] = [
  { href: "/doska", tone: "doska", Icon: IconTimer },
  { href: "/doska", tone: "doska", Icon: IconTrafficLight },
  { href: "/baholash", tone: "baholash", Icon: ListChecks },
  { href: "/baholash", tone: "taqdimot", Icon: Presentation },
  { href: "#jurnal", tone: "jurnal", Icon: UserCheck },
  { href: "#jurnal", tone: "jurnal", Icon: Sparkles },
];

function HeroSection() {
  const t = useTranslations("Landing");
  const tasks = t.raw("hero.tasks") as { label: string; hint: string }[];
  return (
    <section>
      <div className="relative w-full pt-6 md:pt-14 pb-12 md:pb-16 before:absolute before:w-full before:h-full before:bg-linear-to-r before:from-sky-100 before:via-white before:to-amber-100 before:rounded-full before:top-24 before:blur-3xl before:-z-10 dark:before:from-slate-800 dark:before:via-black dark:before:to-stone-700 dark:before:rounded-full dark:before:blur-3xl dark:before:-z-10">
        {/* Chet boʻshligʻi boshqa bloklar bilan bir xil. Ilgari `container`
            edi — Tailwind v4 da unda padding yoʻq, telefonda sarlavha
            ekran chetiga tegib turardi. */}
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 relative z-10">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              {t("hero.badge")}
            </div>
            {/* `text-balance` — qatorlar teng boʻladi, oxirida bitta
                yolgʻiz soʻz qolmaydi; `wrap-break-word` — juda tor ekranda
                ham gorizontal skroll chiqmasin. */}
            <h1 className="text-landing-6 font-semibold text-balance wrap-break-word">
              {t("hero.titleLine1")}{" "}
              <span className={`${instrumentSerif.className} font-normal text-primary`}>
                {t("hero.titleHighlight")}
              </span>
            </h1>
            <p className="max-w-2xl text-base md:text-lg text-muted-foreground">
              {t("hero.subtitle")}
            </p>
          </div>

          {/* Vazifa paneli */}
          <div className="mx-auto mt-8 md:mt-10 max-w-4xl rounded-2xl border border-border bg-card p-4 md:p-6">
            <p className="mb-4 text-sm font-medium text-muted-foreground">
              {t("hero.taskPrompt")}
            </p>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tasks.map((task, i) => {
                const meta = TASKS[i] ?? TASKS[0];
                const tone = LANDING_TONES[meta.tone];
                return (
                  <li key={task.label}>
                    <a
                      href={meta.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl border border-border p-3 transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        tone.hoverBorder,
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-lg",
                          tone.soft,
                        )}
                      >
                        <meta.Icon className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-foreground">
                          {task.label}
                        </span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {task.hint}
                        </span>
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-fast ease-standard group-hover:translate-x-0.5" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Ikki rol — landingga aynan shu ikki odam keladi: roʻyxatdan
              oʻtadigan oʻqituvchi va darsda kod yozmoqchi boʻlgan
              oʻquvchi. Oʻquvchi uchun boshqa kirish eshigi yoʻq edi. */}
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("hero.roleTeacher")}
                </span>
                <ButtonWithIcon href="/register">{t("common.register")}</ButtonWithIcon>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("hero.roleStudent")}
                </span>
                <ButtonWithIcon href="/play" variant="outline">
                  {t("nav.enterCode")}
                </ButtonWithIcon>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">{t("common.freeNote")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
