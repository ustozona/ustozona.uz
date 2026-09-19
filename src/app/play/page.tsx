import { redirect } from "next/navigation";
import { BrandWordmark } from "@/assets/logo/brand-wordmark";
import { Input } from "@/components/ui/input";
import { CYRILLIC_LOOKALIKES } from "@/lib/class-naming";
import PushButton from "./_components/PushButton";

export const metadata = {
  title: "Kodni kiritish",
  description:
    "Oʻqituvchi ekranda koʻrsatgan kodni kiriting va testga yoki taqdimotga qoʻshiling. Roʻyxatdan oʻtish shart emas.",
  alternates: { canonical: "/play" },
};

/* Oʻquvchining kirish eshigi. Oʻqituvchi kodni ekranga chiqaradi
   (Baholash `DeliveryPanel`, Doska taqdimot vidjeti), lekin ilgari
   uni yozadigan joy yoʻq edi — faqat toʻliq `/play/KOD` havolasi yoki
   QR ishlardi. ustozona.uz ni telefonda ochgan oʻquvchi faqat
   oʻqituvchi roʻyxatini koʻrardi.

   Oddiy GET forma, JS'siz: `?kod=abc 234` → shu yerda tozalanadi va
   `/play/ABC234` ga yoʻnaltiriladi. Kod toʻgʻri-notoʻgʻriligini bu
   sahifa tekshirmaydi — alifbo va uzunlik bitta joyda
   (`src/server/dal/assess/sessions.ts`), «Kod topilmadi» ni `PlayView`
   oʻzi aytadi. Bu yerda nusxa qilinsa, kod formati oʻzgarganda sahifa
   toʻgʻri kodni rad eta boshlaydi. */

/* Kirill harflari lotincha egizagiga oʻgiriladi. Telefonda klaviatura
   koʻpincha ruscha yoki oʻzbek kirillida turadi, oʻquvchi esa ekrandagi
   «BC7KM2» ni koʻrganicha yozadi — «ВС7КМ2». Oʻgirilmasa bu harflar tushib
   qolardi va toʻgʻri kod «72» boʻlib ketardi. */
function normalizeCode(raw: string): string {
  // Butun havola joylashtirilgan boʻlsa (`ustozona.uz/play/ABC234`) — kod
  // oxirgi boʻlakda.
  const tail = raw.includes("/play/") ? raw.slice(raw.lastIndexOf("/play/") + 6) : raw;
  return tail
    .toUpperCase()
    .replace(/./gu, (ch) => CYRILLIC_LOOKALIKES[ch] ?? ch)
    .replace(/[^A-Z0-9]/g, "");
}

export default async function JoinByCodePage({
  searchParams,
}: {
  searchParams: Promise<{ kod?: string | string[] }>;
}) {
  const { kod } = await searchParams;
  const raw = typeof kod === "string" ? kod : "";
  const code = normalizeCode(raw);
  if (code) redirect(`/play/${code}`);
  // Shu yerga yetgan boʻlsa, forma yuborilgan, lekin kodda birorta harf
  // yoki raqam yoʻq (faqat boʻshliq yoki belgi) — jim qaytarmaymiz.
  const invalid = typeof kod === "string";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 p-6">
      {/* Statik «Ustozona»: aylanuvchi mahsulot nomi landing uchun —
          bu yerda u oʻquvchini qayerda ekanidan adashtirardi
          (brand-wordmark.tsx, `word` izohi). */}
      <a href="/" aria-label="Ustozona — bosh sahifa">
        <BrandWordmark showRoller={false} shieldClassName="size-8" textClassName="text-lg" gapClassName="gap-2" />
      </a>

      <form action="/play" method="get" className="flex w-full max-w-sm flex-col gap-4">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="heading-page">Kodni kiriting</h1>
          <p className="text-body text-muted-foreground">
            Oʻqituvchi ekranda koʻrsatgan kod
          </p>
        </div>
        <Input
          name="kod"
          aria-label="Kod"
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? "kod-xato" : undefined}
          placeholder="ABC234"
          required
          autoFocus
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          className="h-12 text-center font-mono text-title uppercase tracking-widest md:text-title placeholder:text-muted-foreground/50"
        />
        {invalid && (
          <p id="kod-xato" className="text-center text-caption text-destructive">
            Kod harf va raqamlardan iborat — ekrandagini qayta yozing.
          </p>
        )}
        <PushButton type="submit">Qoʻshilish</PushButton>
      </form>

      <p className="text-caption text-muted-foreground">
        Oʻqituvchimisiz?{" "}
        <a href="/register" className="font-medium text-foreground underline underline-offset-4">
          Bepul roʻyxatdan oʻting
        </a>
      </p>
    </main>
  );
}
