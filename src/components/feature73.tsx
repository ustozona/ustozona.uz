import { ArrowRight, CalendarDays, ClipboardList, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

interface FeatureCardListItem {
  title: string;
  description: string;
  image: Image;
  href?: string;
  icon?: React.ReactNode;
  label?: string;
}
interface Image {
  src: string;
  alt: string;
  srcDark?: string;
}
interface Button {
  text: string;
  url: string;
  icon?: React.ReactNode;
}
interface Buttons {
  primary?: Button;
  secondary?: Button;
}

interface FeatureCardListProps {
  heading: string;
  description?: string;
  features?: FeatureCardListItem[];
  buttons?: Buttons;
  className?: string;
}

interface Feature73Props extends FeatureCardListProps {}
type Props = Partial<Feature73Props>;

const defaultProps: Feature73Props = {
  heading: "Butun sinf boshqaruvi — bitta tizimda",
  description:
    "Jurnal, baholash, davomat va rejalashtirish bir joyda. Har bir modul oʻqituvchining kundalik ishini tezlashtirish uchun yaratilgan.",
  features: [
    {
      icon: <ClipboardList className="size-5" />,
      title: "Elektron jurnal va baholash",
      description:
        "Formativ va summativ baholarni bitta jadvalda yuriting, oʻzlashtirish dinamikasini avtomatik koʻring.",
      image: {
        src: "/screens/grades.png",
        alt: "Elektron jurnal va baholash",
      },
      href: "/dashboard/grades",
    },
    {
      icon: <CalendarDays className="size-5" />,
      title: "Dars va mavzu rejalashtirish",
      description:
        "Kalendar-rejani standartlarga bogʻlab tuzing, darslarni bir necha daqiqada tayyorlang.",
      image: {
        src: "/screens/planner.png",
        alt: "Dars va mavzu rejalashtirish",
      },
      href: "/dashboard/planner",
    },
    {
      icon: <UserCheck className="size-5" />,
      title: "Davomat nazorati",
      description:
        "Kunlik davomatni belgilang, sabablarni kuzating va hisobotni bir tugma bilan oling.",
      image: {
        src: "/screens/attendance.png",
        alt: "Davomat nazorati",
      },
      href: "/dashboard/attendance",
    },
  ],
  buttons: {
    primary: {
      text: "Barcha imkoniyatlar",
      url: "#features",
    },
  },
};

const Feature73 = (props: Props) => {
  const { heading, description, buttons, features, className } = {
    ...defaultProps,
    ...props,
  };

  return (
    <section className={cn("py-32", className)}>
      <div className="container mx-auto">
        <div className="mb-9 lg:mb-14 lg:max-w-3xl">
          <h2 className="mb-3 text-3xl font-semibold tracking-tight text-balance md:mb-4 md:text-4xl lg:mb-6">
            {heading}
          </h2>
          {description && (
            <p className="mb-8 text-muted-foreground lg:text-lg">
              {description}
            </p>
          )}
          {buttons?.primary && (
            <Button variant="link" asChild>
              <a
                href={buttons.primary.url}
                className="group flex items-center font-medium md:text-base lg:text-lg"
              >
                {buttons.primary.text}
                <ArrowRight />
              </a>
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features?.slice(0, 3).map((feature, i) => (
            <div
              key={i}
              className="flex flex-col overflow-clip rounded-xl border border-border"
            >
              <a href={feature.href}>
                <img
                  src={feature.image.src}
                  alt={feature.image.alt}
                  className="aspect-4/3 h-full w-full object-cover object-top transition-opacity hover:opacity-80"
                />
              </a>
              <div className="px-5 pt-6 pb-6 md:px-6 md:pb-7 lg:px-8 lg:pb-8">
                <h3 className="mb-2 text-base font-semibold md:text-lg">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground md:text-base lg:text-lg">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { Feature73 };
