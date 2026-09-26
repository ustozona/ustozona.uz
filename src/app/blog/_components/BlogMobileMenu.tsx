"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, LogOut, MenuIcon, NotebookPen, PenLine } from "lucide-react";
import { BrandWordmark } from "@/assets/logo/brand-wordmark";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { initialsOf } from "@/store/useFeedbackStore";
import { BLOG_NAV } from "./blog-nav";

export type BlogViewer = { name: string; email: string; avatarUrl: string | null } | null;

/* Planshet va mobil menyu (`lg` dan kichik). Headerga sigʻmagan hamma
   narsa shu yerga yigʻiladi: navigatsiya, hisob havolalari va pastda
   katta asosiy tugma («Yozish» yoki mehmon uchun «Bepul boshlash»). */
export function BlogMobileMenu({
  viewer,
  writeAction,
}: {
  viewer: BlogViewer;
  writeAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="size-9 lg:hidden" aria-label="Menyu">
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-sm">
        <div className="flex h-14 shrink-0 items-center border-b border-border px-6">
          <BrandWordmark shieldClassName="size-[26px]" textClassName="text-base" gapClassName="gap-2" word="blog" />
        </div>
        <SheetTitle className="sr-only">Blog menyusi</SheetTitle>
        <SheetDescription className="sr-only">Navigatsiya va hisob</SheetDescription>

        <nav className="flex flex-col p-3">
          {BLOG_NAV.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className={cn(
                "rounded-md px-3 py-3 text-base transition-colors hover:bg-muted",
                i === 0 ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {viewer && (
          <div className="flex flex-col border-t border-border p-3">
            <div className="flex items-center gap-3 px-3 py-3">
              <Avatar className="size-9 border border-border">
                {viewer.avatarUrl && (
                  <AvatarImage src={viewer.avatarUrl} alt={viewer.name} referrerPolicy="no-referrer" />
                )}
                <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
                  {initialsOf(viewer.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-foreground">{viewer.name}</span>
                <span className="text-caption truncate text-muted-foreground">{viewer.email}</span>
              </div>
            </div>
            <Link
              href="/blog/studio"
              onClick={close}
              className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <NotebookPen className="size-4" />
              Mening maqolalarim
            </Link>
            <Link
              href="/dashboard"
              onClick={close}
              className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LayoutDashboard className="size-4" />
              Boshqaruv paneli
            </Link>
            <button
              type="button"
              onClick={async () => {
                await authClient.signOut();
                window.location.reload();
              }}
              className="flex items-center gap-3 rounded-md px-3 py-3 text-left text-sm text-destructive transition-colors hover:bg-muted"
            >
              <LogOut className="size-4" />
              Chiqish
            </button>
          </div>
        )}

        <div className="mt-auto border-t border-border p-4">
          {viewer ? (
            <form action={writeAction}>
              <Button type="submit" className="h-10 w-full">
                <PenLine className="size-4" />
                Yozish
              </Button>
            </form>
          ) : (
            <div className="flex flex-col gap-2">
              <Button asChild className="h-10 w-full">
                <Link href="/register">Bepul boshlash</Link>
              </Button>
              <Button asChild variant="outline" className="h-10 w-full">
                <Link href="/login">Kirish</Link>
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
