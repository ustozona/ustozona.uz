import LessonsServerSync from "@/components/sync/LessonsServerSync";
import GradesServerSync from "@/components/sync/GradesServerSync";

/* Dars muharriri /dashboard tashqarisida — sync koʻpriklari shu yerda ham
   turishi shart: LessonsServerSync boʻlmasa muharrirdagi oʻzgarishlar
   serverga yetmaydi; GradesServerSync boʻlmasa useLiveClasses (sinf
   biriktirish) boʻsh qoladi — classDataMap hech qachon hidratsiya
   qilinmagani uchun. */
export default function LessonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LessonsServerSync />
      <GradesServerSync />
      {children}
    </>
  );
}
