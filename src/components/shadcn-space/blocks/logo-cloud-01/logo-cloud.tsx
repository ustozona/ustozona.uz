import { Sparkles, ShieldCheck, Gift } from "lucide-react";

// Pre-launch: mahsulot hali yangi, real foydalanuvchi statistikasi yoʻq.
// Soxta "ishonadi 50,000+" oʻrniga halol takliflarni koʻrsatamiz.
// Real raqamlar foydalanuvchilar paydo boʻlgach qoʻshiladi.
type Highlight = {
  icon: typeof Sparkles;
  title: string;
  descp: string;
};

const highlights: Highlight[] = [
  {
    icon: Gift,
    title: "Hozircha mutlaqo bepul",
    descp: "Barcha asosiy imkoniyatlar — bank kartasisiz.",
  },
  {
    icon: Sparkles,
    title: "Birinchilardan boʻling",
    descp: "Platformani biz bilan birga rivojlantiring.",
  },
  {
    icon: ShieldCheck,
    title: "Maʼlumotlaringiz xavfsiz",
    descp: "Sinf va oʻquvchi maʼlumotlari faqat sizniki.",
  },
];

const LogoCloud = () => {
  return (
    <div className="lg:py-16 sm:py-12 py-8 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-normal text-muted-foreground mb-8">
          Oʻzbek oʻqituvchilari uchun yangi platforma
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {highlights.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-xl border border-border bg-card/50 px-5 py-4"
            >
              <div className="shrink-0 rounded-lg bg-muted p-2 text-foreground">
                <item.icon className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {item.title}
                </span>
                <span className="text-sm text-muted-foreground">
                  {item.descp}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LogoCloud;
