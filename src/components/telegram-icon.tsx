/**
 * Telegram logotipi — inline SVG, rasmiy brend belgisi (koʻk doira +
 * qogʻoz-samolyot), `google-icon.tsx`dagi kabi toʻliq rangli original.
 *
 * Tashqi rasm emas — auth sahifasi begona serverga bogʻlanmaydi.
 */
export function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 240 240" aria-hidden focusable="false">
      <defs>
        <linearGradient id="telegram-icon-bg" x1="53.6" x2="187" y1="45.2" y2="176.3" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#37aee2" />
          <stop offset="1" stopColor="#1e96c8" />
        </linearGradient>
      </defs>
      <circle cx="120" cy="120" r="120" fill="url(#telegram-icon-bg)" />
      <path
        d="m98 175c-3.9 0-3.2-1.5-4.6-5.2l-11.4-37.6 88-52.2"
        fill="#c8daea"
      />
      <path d="m98 175c3 0 4.3-1.4 6-3l16-15.6-20-12" fill="#a9c9dd" />
      <path
        d="m100 144.4 48.4 35.8c5.5 3 9.5 1.5 10.9-5.1l19.7-92.8c2-8.1-3.1-11.8-8.4-9.3l-115.6 44.6c-7.9 3.2-7.8 7.6-1.4 9.5l29.6 9.3 68.4-43.1c3.2-2 6.2-.9 3.8 1.3z"
        fill="#fff"
      />
    </svg>
  );
}

export default TelegramIcon;
