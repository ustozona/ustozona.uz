import Logo from "@/assets/logo/logo";
import { Separator } from "@/components/ui/separator";
import {
  FOOTER_PAGE_LINKS,
  LEGAL_LINKS,
  TELEGRAM_HANDLE,
  TELEGRAM_URL,
} from "@/lib/landing-nav";

const TelegramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.94 4.292a1.27 1.27 0 0 0-1.29-.21L3.36 10.97c-.86.34-.84 1.57.03 1.88l4.27 1.5 1.65 5.05c.2.62.99.82 1.46.36l2.38-2.32 4.2 3.08c.55.4 1.33.1 1.48-.56l3.06-13.9c.1-.46-.06-.94-.42-1.25M9.86 14.2l-.27 3.62-1.15-3.5 7.9-5.2z" fill="currentColor" />
  </svg>
);

type FooterData = {
  title: string;
  links: { title: string; href: string }[];
};

// Nomlar va havolalar YAGONA manbadan (lib/landing-nav) — header bilan bir xil.
const footerSections: FooterData[] = [
  { title: "Sahifalar", links: FOOTER_PAGE_LINKS },
  { title: "Qoʻshimcha maʼlumot", links: LEGAL_LINKS },
];

const Footer = () => {
  return (
    <footer className="py-10">
      <div className="max-w-7xl xl:px-16 lg:px-8 px-4 mx-auto">
        <div className="flex flex-col gap-6 sm:gap-12">
          <div className="py-12 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-12 gap-x-8 gap-y-10 px-6 xl:px-0">
            <div className="col-span-full lg:col-span-4">
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 ease-in-out fill-mode-both">
                {/* Logo */}
                <a href="/">
                  <Logo />
                </a>

                <p className="text-base font-normal text-muted-foreground">
                  Oʻqituvchilar uchun taʼlim jarayonini boshqarish va sifatini oshirishga moʻljallangan raqamli platforma.
                </p>

                {/* social links */}
                <div className="flex items-center gap-4">
                  <a
                    href={TELEGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Telegram kanalimiz"
                    className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <TelegramIcon />
                    Telegram
                  </a>
                </div>
              </div>
            </div>

            <div className="col-span-1 lg:block hidden"></div>

            {footerSections.map(({ title, links }, index) => (
              <div key={index} className="col-span-2">
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 ease-in-out fill-mode-both">
                  <p className="text-base font-medium text-foreground">
                    {title}
                  </p>
                  <ul className="flex flex-col gap-3">
                    {links.map(({ title, href }) => (
                      <li key={title}>
                        <a
                          href={href}
                          className="text-base font-normal text-muted-foreground hover:text-foreground"
                        >
                          {title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}

            <div className="col-span-3">
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 ease-in-out fill-mode-both">
                <p className="text-base font-medium text-foreground">
                  Bogʻlanish uchun
                </p>
                <ul className="flex flex-col gap-3">
                  <li>
                    <a
                      href={TELEGRAM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-base font-normal text-muted-foreground hover:text-foreground"
                    >
                      <TelegramIcon />
                      {TELEGRAM_HANDLE}
                    </a>
                  </li>
                  <li>
                    <p className="text-base font-normal text-muted-foreground">
                      Savol va takliflar uchun Telegram orqali yozing.
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <Separator orientation="horizontal" />
          <p className="text-sm font-normal text-muted-foreground text-center animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 ease-in-out fill-mode-both">
            © {new Date().getFullYear()} Ustozona. Barcha huquqlar himoyalangan.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
