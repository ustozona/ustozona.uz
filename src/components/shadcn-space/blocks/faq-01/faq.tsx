import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQ_DATA = [
  {
    question: "Bu rasmiy elektron jurnallar oʻrniga oʻtadimi?",
    answer:
      "Yoʻq. Ustozona — sizning shaxsiy ishchi yordamchingiz. Rasmiy tizimlarga kiritish kerak boʻlgan choraklik ballarni, xulq hisobotlarini va davomat statistikasini shu yerda tayyorlab, tayyor raqamlarni koʻchirib qoʻyasiz.",
  },
  {
    question: "Direktorim yoki maktab maʼmuriyati maʼlumotlarimni koʻra oladimi?",
    answer:
      "Maʼlumotlaringiz sizniki — maxfiylik sozlamalari asosida boshqa hech kim sizning ruxsatingizsiz ularni koʻra olmaydi. Barchasini faqat oʻzingiz boshqarasiz.",
  },
  {
    question: "Telefonda ishlatsam boʻladimi?",
    answer:
      "Platforma hozircha asosan kompyuter va noutbuk brauzerida ishlashga moslashgan. Telefon ekranlari uchun qulay maxsus qism sentabrda ishga tushiriladi.",
  },
  {
    question: "Oʻtgan oʻquv yilidagi maʼlumotlar yangi yilda oʻchib ketadimi?",
    answer:
      "Yoʻq. Oʻtgan yillar arxivda saqlanadi. Sinflarni yangi oʻquv yiliga oʻtkazish uchun maxsus sehrgar bor.",
  },
  {
    question: "Dars jadvali oʻzgarib qolsa, avvalgi oylarning jurnali buzilmaydimi?",
    answer:
      "Tizim jadval versiyalarini tushunadi. «3-noyabrdan boshlab jadval oʻzgardi» deb kiritsangiz, undan oldingi oylarning baholar tarixi xuddi oʻzidek saqlanib qoladi.",
  },
  {
    question: "Men 100 ballik tizimda baholayman. Dastur menga toʻgʻri keladimi?",
    answer:
      "Albatta. Tizimda 10 dan ortiq baholash shkalasi bor — 5 ballik, foizli, harfli va boshqalar. Oʻzingizga mosini sozlab olasiz.",
  },
  {
    question: "Oʻquvchilar soniga chegara bormi?",
    answer:
      "Hech qanday chegara yoʻq. Istalgancha sinf va oʻquvchi qoʻshishingiz mumkin.",
  },
  {
    question: "Tizimdan foydalanishni qanday oʻrganaman?",
    answer:
      "Birinchi marta kirganingizda interaktiv qoʻllanma sizni qadam-baqadam yetaklaydi. Taklifingiz boʻlsa, fikr-mulohaza doskasiga yozasiz — boshqa ustozlar ovoz beradi, jamoa koʻrib chiqadi.",
  },
];

export default function Faq() {
  return (
    <section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:py-24 py-8 flex flex-col gap-16">
        <div className="flex flex-col gap-4 items-center animate-in fade-in slide-in-from-top-10 duration-1000 delay-100 ease-in-out fill-mode-both">
          <Badge
            variant="outline"
            className="text-sm h-auto py-1 px-3 border-0 outline outline-border"
          >
            Koʻp beriladigan savollar
          </Badge>
          <h2 className="text-4xl md:text-5xl font-medium text-center max-w-lg">
            Savollaringiz bormi? Bizda javoblar tayyor
          </h2>
        </div>
        <div>
          <Accordion type="single" collapsible className="w-full flex flex-col gap-6">
            {FAQ_DATA.map((faq, index) => (
              <AccordionItem
                key={`item-${index}`}
                value={`item-${index}`}
                className={cn(
                  "p-6 border border-border last:border-b rounded-2xl flex flex-col gap-3 group/item data-[open]:bg-accent transition-colors animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both",
                  index === 0 && "delay-100",
                  index === 1 && "delay-200",
                  index === 2 && "delay-300",
                  index === 3 && "delay-400",
                  index === 4 && "delay-500",
                )}
              >
                <AccordionTrigger className="p-0 text-xl font-medium hover:no-underline **:data-[slot=accordion-trigger-icon]:hidden cursor-pointer">
                  {faq.question}
                  <PlusIcon className="w-6 h-6 shrink-0 transition-transform duration-200 group-aria-expanded/accordion-trigger:rotate-45" />
                </AccordionTrigger>
                <AccordionContent className="p-0 text-muted-foreground text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
