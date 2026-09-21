"use client";

import { useHydrateStore } from "@/hooks/useHydrateStore";
import { useFeedbackStore } from "@/store/useFeedbackStore";
import { bootstrapSlice } from "@/lib/sync/bootstrap-client";

/* Feedback store ← server (renderi yoʻq). Umumiy doska (2-bosqich):
   har amal oʻzining targetli server action'i orqali serverga boradi
   (bu komponent faqat mount'da toʻliq roʻyxatni yuklaydi — whole-store
   diff+push endi yoʻq, chunki u boshqa oʻqituvchining postini
   "egallab olishi" mumkin edi). */

/** Mount hydration umumiy bootstrap javobidan oʻqiladi (bitta soʻrov). */
const fetchSlice = bootstrapSlice("feedback");

export default function FeedbackServerSync() {
  useHydrateStore(useFeedbackStore, fetchSlice);
  return null;
}
