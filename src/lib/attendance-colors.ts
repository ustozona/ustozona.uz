/** Davomat holatlarining kanonik ranglari.

    Bular ilgari `students/[id]/_components/charts.tsx` da edi, lekin
    u fayl diagramma kutubxonasini (~330 kB) olib keladi — natijada
    Davomat sahifasi toʻrtta rang uchun butun kutubxonani yuklardi.
    Rang — maʼlumot, diagramma emas; shuning uchun shu yerda. */
export const ATT_COLORS = {
  present: "#22c55e",
  absent: "#ef4444",
  late: "#f59e0b",
  excused: "#0ea5e9",
} as const;
