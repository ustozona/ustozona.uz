import type { Metadata } from "next";
import { headers } from "next/headers";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import {
  PRODUCT_HEADER,
  SURFACE_HEADER,
  toProduct,
  toSurface,
} from "@/lib/product-scope";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ProductScopeSync } from "@/components/product-scope-sync";
import { MotionProvider } from "@/components/providers/motion-provider";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const siteUrl = "https://www.ustozona.uz";
const title = "Ustozona — Oʻqituvchi boshqaruv tizimi";
const description =
  "Ustozona — oʻqituvchilar uchun toʻliq boshqaruv tizimi. Sinflar, oʻquvchilar, darslar, baholar va davomatni bir joyda boshqaring.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s — Ustozona",
  },
  description,
  keywords: [
    "Ustozona",
    "oʻqituvchi boshqaruv tizimi",
    "elektron jurnal",
    "davomat tizimi",
    "baholash tizimi",
    "maktab boshqaruv tizimi",
    "sinf jurnali",
  ],
  applicationName: "Ustozona",
  authors: [{ name: "Ustozona" }],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Ustozona",
    title,
    description,
    locale: "uz_UZ",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  verification: {
    yandex: "68a7b34ec38b727a",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();

  /* Dizayn tizimi qamrovi — proxy.ts qoʻygan sarlavhadan.
     `<html>` da boʻlishi SHART: Radix Dialog/Popover/Select
     `document.body` ga portal qiladi, ichkaridagi <div> qamrovi ularni
     ushlab qola olmaydi. Sarlavha yetib kelmasa toSurface/toProduct
     standartga qaytaradi — yaʼni hozirgi panel koʻrinishi saqlanadi. */
  const requestHeaders = await headers();
  const surface = toSurface(requestHeaders.get(SURFACE_HEADER));
  const product = toProduct(requestHeaders.get(PRODUCT_HEADER));

  return (
    <html
      lang={locale}
      data-surface={surface}
      data-product={product}
      suppressHydrationWarning
      className={`${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <MotionProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </MotionProvider>
            <ProductScopeSync />
            <Toaster richColors position="bottom-center" />
          </ThemeProvider>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
