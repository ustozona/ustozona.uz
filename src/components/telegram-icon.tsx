/**
 * Telegram logotipi — inline SVG.
 *
 * `google-icon.tsx` bilan bir xil sabab: tashqi rasm yuklanmaydi, auth
 * sahifasi begona serverga bogʻlanmaydi.
 *
 * Yoʻl `blocks/footer-01/footer.tsx` dagi ikonaning aynan oʻzi — u yerda
 * lokal (eksport qilinmagan) komponent boʻlib qolgan. Bu yerda umumiy
 * qilib chiqarildi: ikkinchi nusxa chizish rangi/oʻlchami ajralib
 * ketishiga olib kelardi.
 */
export function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path
        d="M21.94 4.292a1.27 1.27 0 0 0-1.29-.21L3.36 10.97c-.86.34-.84 1.57.03 1.88l4.27 1.5 1.65 5.05c.2.62.99.82 1.46.36l2.38-2.32 4.2 3.08c.55.4 1.33.1 1.48-.56l3.06-13.9c.1-.46-.06-.94-.42-1.25M9.86 14.2l-.27 3.62-1.15-3.5 7.9-5.2z"
        fill="currentColor"
      />
    </svg>
  );
}

export default TelegramIcon;
