"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Link2, Send, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* Ulashish — havola HAR DOIM birinchi nashrdagi slug'da muzlaydi
   (docs/blog-nashr-modeli.md §6), shuning uchun ulashilgan havola
   keyin buzilmaydi. URL klientda `window.location.origin` dan quriladi —
   apex/www, dev/prod farqi oʻz-oʻzidan toʻgʻri boʻladi. */
export function ShareButton({ slug, title }: { slug: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const url = () => `${window.location.origin}/blog/${slug}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Havola nusxalandi");
    } catch {
      toast.error("Havolani nusxalab boʻlmadi");
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, url: url() });
    } catch {
      /* foydalanuvchi bekor qildi — jimgina */
    }
  };

  const telegram = () => {
    const share = `https://t.me/share/url?url=${encodeURIComponent(url())}&text=${encodeURIComponent(title)}`;
    window.open(share, "_blank", "noopener,noreferrer");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Share2 className="size-3.5" />
          Ulashish
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={copy}>
          {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
          Havolani nusxalash
        </DropdownMenuItem>
        <DropdownMenuItem onClick={telegram}>
          <Send className="size-4" />
          Telegramda ulashish
        </DropdownMenuItem>
        {canNativeShare && (
          <DropdownMenuItem onClick={nativeShare}>
            <Share2 className="size-4" />
            Boshqa ilovalar…
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
