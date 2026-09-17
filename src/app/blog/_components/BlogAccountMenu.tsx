"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut, NotebookPen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import { initialsOf } from "@/store/useFeedbackStore";

/* Blog headeridagi avatar menyusi. Ilova ichidagi `HeaderAccountMenu`
   ishlatilmaydi: u `useSettingsStore` ga tayanadi, store esa faqat
   `/dashboard` ichida serverdan toʻldiriladi — blogda ism va avatar boʻsh
   chiqardi. Shu sababli maʼlumot server sessiyasidan prop sifatida keladi.
   Til/mavzu kabi ilova sozlamalari ham bu yerga kiritilmaydi — ommaviy
   oʻqish sahifasida ular ortiqcha. */
export function BlogAccountMenu({
  name,
  email,
  avatarUrl,
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
}) {
  const avatar = (
    <Avatar className="size-8 border border-border">
      {avatarUrl && <AvatarImage src={avatarUrl} alt={name} referrerPolicy="no-referrer" />}
      <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
        {initialsOf(name)}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex rounded-full transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-label="Hisob menyusi"
      >
        {avatar}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="flex items-center gap-2.5 px-2 py-2">
          {avatar}
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{name}</span>
            <span className="text-caption truncate text-muted-foreground">{email}</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/blog/studio">
            <NotebookPen />
            Mening maqolalarim
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutDashboard />
            Boshqaruv paneli
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={async () => {
            await authClient.signOut();
            // Blogda qolamiz — lekin toʻliq reload, sessiyaga bogʻliq
            // server qismlari (header, fikrlar) yangilansin.
            window.location.reload();
          }}
        >
          <LogOut />
          Chiqish
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

