import type { AppLanguage } from "@/store/useSettingsStore";

/** flagCode — AppleEmoji unified kod (bayroq emoji). Windows'da native
    bayroq emoji renderi yoʻq (RU/GB harflariga fallback boʻladi), shu
    sabab CDN sprite orqali chiziladi. Qoraqalpoqchada rasmiy bayroq
    emoji kodi yoʻq (ISO davlat kodi emas) — flagCode yoʻq, UI qoʻlda
    chizilgan <KarakalpakFlag>ga fallback qiladi. */
export const LANGUAGES: { value: AppLanguage; label: string; flagCode?: string; ready: boolean }[] = [
  { value: "uz", label: "Oʻzbekcha", flagCode: "1f1fa-1f1ff", ready: true },
  { value: "kaa", label: "Qoraqalpoqcha", ready: false },
  { value: "en", label: "Inglizcha", flagCode: "1f1ec-1f1e7", ready: false },
  { value: "ru", label: "Ruscha", flagCode: "1f1f7-1f1fa", ready: false },
];
