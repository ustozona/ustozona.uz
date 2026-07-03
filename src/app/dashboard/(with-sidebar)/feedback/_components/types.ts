import type { FeedbackCategory } from "@/store/useFeedbackStore";

/** Inline kompozer yuboradigan yangi fikr qiymati. */
export type NewFeedbackFormValue = {
  body: string;
  category: FeedbackCategory;
  /** Biriktirilgan rasmlar (kichraytirilgan data URL). */
  images: string[];
};
