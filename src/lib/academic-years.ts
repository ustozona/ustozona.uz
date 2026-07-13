import type { AcademicYearCalendar } from "@/lib/academic-calendar";

/* ════════════════════════════════════════════════════════════════════
   OʻQUV YILLARI — koʻp-yil qamrovi (1-bosqich)

   Har oʻquv yili ALOHIDA yozuv (`calendar` = bugungi shakldagi
   AcademicYearCalendar hujjati). Bitta yil `isActive` — planner/davomat/
   chorak statistikasi oʻqiydigan "faol" yil. useCalendarStore'dagi
   `calendar` maydoni ayni shu faol yilning KOʻZGUSI boʻlib qoladi, shu
   sabab mavjud `s.calendar` isteʼmolchilari oʻzgarmaydi.

   Bu fayl sof (React/server'siz) tip — store, DAL, actions va sync uni
   birdek import qiladi (academic-calendar.ts tegilmasin). */
export type AcademicYearEntry = {
  id: string;
  isActive: boolean;
  calendar: AcademicYearCalendar;
};

/** Faol yilni topadi (yoʻq boʻlsa birinchisi, u ham boʻlmasa undefined). */
export function activeYear(years: AcademicYearEntry[]): AcademicYearEntry | undefined {
  return years.find((y) => y.isActive) ?? years[0];
}
