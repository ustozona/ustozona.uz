import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
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

  return (
    <html
      lang={locale}
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
            <Toaster richColors position="bottom-center" />
          </ThemeProvider>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
