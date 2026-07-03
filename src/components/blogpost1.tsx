import { format } from "date-fns";
import { Lightbulb } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Blogpost1Props {
  className?: string;
  title?: string;
  author?: {
    name: string;
    website: string;
    websiteName: string;
    image: string;
  };
  image?: string;
  pubDate?: Date;
  description?: string;
}

const Blogpost1 = ({
  className,
  title = "Formativ va summativ baholash: farqi nimada?",
  author = {
    name: "Ustozona jamoasi",
    website: "https://ustozona.uz",
    websiteName: "Ustozona",
    image:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-2.webp",
  },
  image = "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-1.svg",
  pubDate = new Date(),
  description = "Ikki baholash turining maqsadi, vaqti va oʻquvchi oʻzlashtirishiga taʼsiri.",
}: Blogpost1Props) => {
  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center">
          <h1 className="max-w-3xl text-5xl font-semibold text-pretty md:text-6xl">
            {title}
          </h1>
          <h3 className="max-w-3xl text-lg text-muted-foreground md:text-xl">
            {description}
          </h3>
          <div className="flex flex-col items-center gap-1 text-sm md:flex-row md:gap-2 md:text-base">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border">
                <AvatarImage src={author.image} />
                <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-semibold">{author.name}</span>
            </div>
            <span className="text-muted-foreground">
              <a
                href={author.website}
                className="font-semibold text-foreground hover:underline"
              >
                {author.websiteName}
              </a>
            </span>
            <span className="text-muted-foreground">
              {format(pubDate, "d-MMMM, yyyy")} • eʼlon qilindi
            </span>
          </div>
          <img
            src={image}
            alt="placeholder"
            className="mt-4 mb-8 aspect-video w-full rounded-lg border object-cover"
          />
        </div>
      </div>
      <div className="container">
        <div className="mx-auto prose max-w-3xl dark:prose-invert">
          <h2 className="text-3xl font-extrabold">Baholash nima uchun kerak?</h2>
          <p className="mt-2 text-lg text-muted-foreground">
            Baholash — bu shunchaki baho qoʻyish emas, balki oʻquvchining qayerda
            turgani va keyin nima qilish kerakligini koʻrsatadigan vosita.
            Toʻgʻri tanlangan baholash turi oʻqitishni yoʻnaltiradi.
          </p>

          <h2>Formativ baholash</h2>
          <p>
            Formativ baholash oʻquv jarayoni davomida oʻtkaziladi. Uning maqsadi
            — baho qoʻyish emas, balki oʻquvchiga va oʻqituvchiga teskari aloqa
            berish: nima oʻzlashtirildi, nimani takrorlash kerak.
          </p>
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Maslahat</AlertTitle>
            <AlertDescription>
              Formativ baholashni jurnalda alohida belgilang — u yakuniy bahoga
              taʼsir qilmasligi, lekin dinamikani koʻrsatishi kerak.
            </AlertDescription>
          </Alert>
          <h2>Summativ baholash</h2>
          <p>
            Summativ baholash bobning yoki chorakning oxirida oʻtkaziladi va
            oʻzlashtirish darajasini yakuniy qayd etadi. U koʻpincha rasmiy bahoga
            aylanadi.
          </p>
          <div>
            <table>
              <thead>
                <tr>
                  <th>Formativ</th>
                  <th>Summativ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Jarayon davomida</td>
                  <td>Bosqich oxirida</td>
                </tr>
                <tr className="m-0 border-t p-0 even:bg-muted">
                  <td>Teskari aloqa uchun</td>
                  <td>Natijani qayd etish uchun</td>
                </tr>
                <tr className="m-0 border-t p-0 even:bg-muted">
                  <td>Past xavf</td>
                  <td>Yuqori ahamiyat</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Eng yaxshi natija ikkalasini muvozanatda ishlatishdan keladi:
            formativ baholash bilan kuzating, summativ baholash bilan yakunlang.
          </p>

          <h2>Amaliyotda qanday qoʻllash mumkin</h2>

          <img
            src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-1.svg"
            alt="placeholder"
            className="my-8 aspect-video w-full rounded-md object-cover"
          />
          <p>
            Ustozona jurnalida har bir baholashni turi boʻyicha ajratib qoʻyish
            mumkin. Bu oʻzlashtirish dinamikasini aniq koʻrsatadi.
          </p>
          <blockquote>
            “Baholashning maqsadi — tartibga solish emas, balki oʻquvchini
            keyingi qadamga yoʻnaltirish.”
          </blockquote>
          <p>Amaliy tartib quyidagicha boʻlishi mumkin:</p>
          <ul>
            <li>Mavzu davomida 2–3 formativ baholash</li>
            <li>Bob oxirida 1 ta summativ baholash</li>
            <li>Chorak yakunida umumiy oʻzlashtirish tahlili</li>
          </ul>
          <p>
            Shu tartib oʻquvchining haqiqiy oʻzlashtirishini koʻrsatadi va
            yakuniy bahoni adolatli qiladi.
          </p>
        </div>
      </div>
    </section>
  );
};

export { Blogpost1 };
