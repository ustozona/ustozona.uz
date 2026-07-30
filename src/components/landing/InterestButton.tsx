"use client";

import { track } from "@vercel/analytics";
import ButtonWithIcon from "@/components/shadcn-space/button/button-01";
import { TELEGRAM_URL, type Product } from "@/lib/landing-nav";

/**
 * Mahsulot sahifasidagi "Qiziqish bildirish" tugmasi — bosilganda
 * Telegram'ga oʻtadi. Asosiy oʻlchov sahifa koʻrishlari (Analytics bepul,
 * kod shart emas); `track` faqat ustiga qoʻshimcha signal.
 */
export function InterestButton({ product }: { product: Product["slug"] }) {
  return (
    <ButtonWithIcon
      href={TELEGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("product_interest", { product })}
    >
      Qiziqish bildirish
    </ButtonWithIcon>
  );
}

export default InterestButton;
