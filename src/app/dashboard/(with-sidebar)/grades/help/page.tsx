import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Layers, Calculator, ListChecks, Scale, Sprout } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionIcon } from "@/components/ui/section-icon";
import { Separator } from "@/components/ui/separator";
import { TypographyLead } from "@/components/ui/typography";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import ArticleToc from "./ArticleToc";
import ShareActions from "./ShareActions";
import ArticleClosing from "./ArticleClosing";

const TITLE = "Zamonaviy raqamli jurnal: pedagogik inferensiya va oʻlchov mantiqi";

export const metadata: Metadata = {
  title: "Zamonaviy raqamli jurnal — pedagogik mantiq | Ustozona EMS",
};

type Section = {
  id: string;
  short: string; // mundarija (TOC) uchun qisqa yorliq
  icon: React.ReactNode;
  title: string;
  paragraphs: string[];
};

const INTRO =
  "Zamonaviy taʼlim jarayonida baholash shunchaki raqamlarni qayd etish emas, balki oʻquvchining bilim darajasi, yaʼni konstrukti haqida bilvosita xulosa chiqarish yoki inferensiya qilish jarayonidir. Ushbu jarayonni ilmiy asoslangan holda tashkil etish uchun raqamli jurnal oʻqituvchiga darsni toʻgʻrilash uchun “termostat” va natijani oʻlchash uchun “termometr” vazifasini bajaruvchi vositalarni taqdim etishi lozim. Jurnalning funksional imkoniyatlari, xususan, topshiriqlarni mavzular boʻyicha guruhlash, kiritish usullarini tanlash va vaznlarni taqsimlash, oʻquv rejasini amaliyotga koʻchirishning eng samarali usuli hisoblanadi.";

const SECTIONS: Section[] = [
  {
    id: "mavzular",
    short: "Mavzular",
    icon: <Layers />,
    title: "Mavzular (Classwork Topics): domenlarni guruhlash va nazorat qilish",
    paragraphs: [
      "Mavzular (Classwork Topics) funksiyasi oʻquv dasturidagi turli kompetensiya sohalarini yoki domenlarni alohida mantiqiy “savat”larga ajratish imkonini beradi. Bu testologiyadagi “validlik” (asoslilik) prinsipiga tayanib, oʻqituvchiga oʻquvchi aynan qaysi yoʻnalishda zaif ekanligini aniq diagnostika qilishga yordam beradi. Har bir fan oʻzining maxsus konstruktiga ega, masalan, tarix fanida faktlarni eslab qolish darajasi ularni tahlil qilish mahoratidan butunlay farq qilishi mumkin.",
      "Tarix fani oʻqituvchisi “Manbalar tahlili”, “Xronologiya” va “Insho” kabi alohida mavzularni ochib, oʻquvchining rivojlanishini har bir yoʻnalishda mustaqil ravishda kuzatishi mumkin. Agar oʻquvchi xronologiyada yuqori natija koʻrsatib, manbalar tahlilida oqsasa, bu oʻqituvchiga oʻquv rejasidagi boʻshliqlarni aniq koʻrsatib beruvchi signal boʻladi. Bunday tizimli yondashuv oʻqituvchini shunchaki umumiy ball qoʻyishdan qutqarib, taʼlim standartlarida belgilangan har bir maqsad qanchalik egallanganini chuqur tahlil qilish imkonini yaratadi.",
    ],
  },
  {
    id: "ball",
    short: "Ball (Score)",
    icon: <Calculator />,
    title: "Ball (Score): uzluksiz oʻlchov va statistik ishonchlilik",
    paragraphs: [
      "Kiritish usuli sifatida ball (Score) rejimining tanlanishi oʻquvchi bilimining uzluksiz tabiatiga toʻliq mos keladi. Ilmiy tadqiqotlar shuni koʻrsatadiki, inson bilimi keskin “jagged” (tishli) qadamlar bilan emas, balki silliq chiziq kabi rivojlanadi, shuning uchun raqamli ballar (masalan, 23/25) bilim darajasini eng aniq aks ettiruvchi koʻrsatkichdir. Tizim bu xom ballarni avtomatik ravishda normallashtirib, umumiy foiz yoki scaled score (shkalalangan ball) koʻrinishiga oʻgiradi. Bu oʻqituvchiga 10 ballik qisqa matematika quizini 100 ballik yakuniy imtihon bilan yagona statistika va “attainment” (erishilgan natija) chizigʻi doirasida solishtirish imkonini beradi.",
      "Shuningdek, ballar orqali tizim oʻlchashning standart xatosini (SEM — har qanday oʻlchovdagi tabiiy shovqin va noaniqlik) hisoblab boradi. Inson miyasi mutlaq ballarni belgilashdan koʻra, qiyosiy oʻlchashlarda aniqroq natija beradi. Shuning uchun scaled score koʻrinishidagi natijalar oʻquvchini “Expected Standard” (kutilgan standart) kabi keng va noaniq toifalarga joylashdan koʻra, uning haqiqiy oʻsish dinamikasini aniqroq koʻrsatadi.",
    ],
  },
  {
    id: "tanlash",
    short: "Tanlash (Select)",
    icon: <ListChecks />,
    title: "Tanlash (Select): mezonga moʻljallangan baholash va sifat nazorati",
    paragraphs: [
      "“Tanlash” (Select) usuli raqam yozmasdan, oʻquvchini oldindan belgilangan sifat yorliqlaridan biri bilan (masalan, Oʻtdi/Oʻtmadi) belgilashga moʻljallangan. Bu usul mezonga moʻljallangan baholashni (criterion-referencing) amalga oshirish uchun eng toʻgʻri vositadir, chunki bunda oʻquvchi natijasi boshqalar bilan emas, balki faqatgina aniq bir standart bilan taqqoslanadi. Bu rejim aynan maʼlum bir “cut score” (oʻtish bali) boʻsagʻasidan oʻtilganligini qayd etishda qoʻl keladi.",
      "Amaliyotda, masalan, jismoniy tarbiya darsida “Xavfsizlik texnikasiga rioya qilish” yoki sanʼat darsida “Loyiha topshirildi” kabi holatlar uchun ball qoʻyish statistik validlikni buzishi mumkin, chunki bu koʻrsatkichlar bilim darajasini emas, koʻproq harakat yoki ishtirokni ifodalaydi. Shuning uchun bunday vaziyatlarda “Select” usulidan foydalanish oʻquvchining akademik “attainment” (erishilgan natija) koʻrsatkichini sunʼiy ravishda oshirish yoki pasaytirishdan saqlaydi.",
    ],
  },
  {
    id: "vaznli",
    short: "Vaznli (Weighted)",
    icon: <Scale />,
    title: "Vaznli (Weighted): summativ baholash va “termometr” funksiyasi",
    paragraphs: [
      "Baholashning validligini taʼminlashda vaznli (Weighted) topshiriqlar fundamental ahamiyatga ega boʻlib, ular summativ (xulosalovchi) xarakterga egadir. Bunday topshiriqlar taʼlimning maʼlum bir muhim bosqichida erishilgan yakuniy natijani oʻlchashga xizmat qiluvchi “termometr” vazifasini bajaradi. Nazorat ishlari, yirik loyihalar yoki insholar odatda yuqori vaznga ega boʻladi, chunki ularning natijalari oʻquvchining kelajakdagi taʼlim yoʻnalishini belgilovchi “ishonchli dalillar” boʻlib xizmat qiladi.",
      "Masalan, fizika fanidan yakuniy laboratoriya ishi 20% yoki 40% vazn (Weighted) bilan umumiy bahoga taʼsir qilishi mumkin. Bu ushbu topshiriqning qimmati kundalik uy vazifalaridan ancha yuqori ekanligini va natijaning “reliability” (barqarorligi) oʻta muhimligini anglatadi. Vaznli tizim oʻqituvchiga oʻquv rejasidagi eng asosiy va murakkab mavzularga koʻproq eʼtibor qaratish hamda ularning yakuniy bahodagi oʻrnini adolatli taqsimlash imkonini beradi.",
    ],
  },
  {
    id: "vaznsiz",
    short: "Vaznsiz (No Weight)",
    icon: <Sprout />,
    title: "Vaznsiz (No Weight): formativ baholash va “termostat” funksiyasi",
    paragraphs: [
      "Vaznsiz (No Weight) funksiyasi natijani jurnalda saqlaydi va tahlil qiladi, lekin uni yakuniy oʻrtacha ballga qoʻshmaydi. Bu shakllantiruvchi (formativ) baholashning asosiy asbobi boʻlib, u “termostat” kabi oʻrganish jarayonini dars davomida toʻgʻrilashga xizmat qiladi. Uning maqsadi oʻquvchiga yakuniy “hukm” chiqarish emas, balki unga va oʻqituvchiga keyingi qadamlar uchun “recipe for future action” (kelajakdagi harakatlar uchun retsept) koʻrinishidagi fidbek berishdir.",
      "Ona tili darsidagi kundalik mashq darslari yoki yangi mavzu boʻyicha olingan qisqa quizlarni “vaznsiz” qilish oʻquvchida “xato qilishdan qoʻrqmaslik” muhitini yaratadi. Bu oʻquvchiga oʻzining kuchli va zaif tomonlarini hech qanday “baho xavfi”siz tushunib olishga va ishini redraft qilishga (qayta ishlashga) imkon beradi. Formativ natijalarni summativ oʻrtachaga aralashtirmaslik oʻquvchining haqiqiy bilimi haqida notoʻgʻri xulosalar chiqarishdan (cramming yoki banking effect) asraydi va bilimning valid oʻsishini taʼminlaydi.",
    ],
  },
];

// Taxminiy oʻqish vaqti — barcha matn boʻyicha (~180 soʻz/daqiqa).
const WORD_COUNT = [INTRO, ...SECTIONS.flatMap((s) => [s.title, ...s.paragraphs])]
  .join(" ")
  .trim()
  .split(/\s+/).length;
const READING_MIN = Math.max(1, Math.round(WORD_COUNT / 180));

const TOC_ITEMS_BASE = SECTIONS.map((s) => ({ id: s.id, short: s.short }));

export default async function GradesHelpPage() {
  const t = await getTranslations("GradesHelpPage");
  const TOC_ITEMS = [{ id: "kirish", short: t("introTocLabel") }, ...TOC_ITEMS_BASE];
  return (
    <div className="flex-1 min-w-0 h-full py-4">
      <article className="bg-card rounded-xl card-elevation flex flex-col overflow-hidden h-full">
        <ScrollArea className="h-full">
          <div className="mx-auto w-full max-w-[1080px] px-6 py-8 md:px-10 md:py-12">
            <div className="lg:grid lg:grid-cols-[1fr_240px] lg:gap-12">
              {/* Asosiy ustun — barcha matn shu kenglikda */}
              <div className="min-w-0">
                <Link
                  href="/dashboard/grades"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="size-4" />
                  {t("backToGrades")}
                </Link>

                <header id="kirish" className="scroll-mt-8">
                  <p className="text-label mt-6 text-primary">{t("guideLabel")}</p>
                  <h1 className="heading-page mt-2 text-balance">{TITLE}</h1>

                  {/* Meta panel */}
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage src="" alt="Otabek Abdusattorov" />
                        <AvatarFallback>OA</AvatarFallback>
                        <AvatarBadge className="bg-success" />
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">
                          Otabek Abdusattorov
                        </span>
                        <span className="text-caption">
                          {t("authorRole")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-caption hidden sm:inline">
                        {t("publishedMeta", { minutes: READING_MIN })}
                      </span>
                      <Separator orientation="vertical" className="hidden h-5 sm:block" />
                      <ShareActions title={TITLE} />
                    </div>
                  </div>

                  <TypographyLead className="mt-6 leading-7">{INTRO}</TypographyLead>
                </header>

                <div className="mt-10 space-y-10">
                  {SECTIONS.map((s) => (
                    <section key={s.id} id={s.id} className="scroll-mt-8 space-y-3">
                      <div className="flex items-start gap-3">
                        <SectionIcon className="mt-0.5 shrink-0">{s.icon}</SectionIcon>
                        <h2 className="heading-section pt-1">{s.title}</h2>
                      </div>
                      <div className="space-y-3.5 pl-[3.25rem]">
                        {s.paragraphs.map((p, i) => (
                          <p key={i} className="text-body leading-7">
                            {p}
                          </p>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>

                <ArticleClosing />
              </div>

              {/* Mundarija (TOC) */}
              <ArticleToc items={TOC_ITEMS} />
            </div>
          </div>
        </ScrollArea>
      </article>
    </div>
  );
}
