import type { AppLanguage } from "@/store/useSettingsStore";

/** flagCode — AppleEmoji unified kod (bayroq emoji). Windows'da native
    bayroq emoji renderi yoʻq (RU/GB harflariga fallback boʻladi), shu
    sabab CDN sprite orqali chiziladi. Qoraqalpoqchada rasmiy bayroq
    emoji kodi yoʻq (ISO davlat kodi emas) — flagCode yoʻq, UI qoʻlda
    chizilgan <KarakalpakFlag>ga fallback qiladi. */
export const LANGUAGES: { value: AppLanguage; label: string; flagCode?: string; ready: boolean }[] = [
  { value: "uz", label: "Oʻzbekcha", flagCode: "1f1fa-1f1ff", ready: true },
  { value: "en", label: "Inglizcha", flagCode: "1f1ec-1f1e7", ready: true },
  { value: "ru", label: "Ruscha", flagCode: "1f1f7-1f1fa", ready: true },
  { value: "kaa", label: "Qoraqalpoqcha", ready: true },
  { value: "ky", label: "Qirgʻizcha", flagCode: "1f1f0-1f1ec", ready: true },
  { value: "kk", label: "Qozoqcha", flagCode: "1f1f0-1f1ff", ready: true },
];
