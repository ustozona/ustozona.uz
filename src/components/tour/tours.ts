/* ════════════════════════════════════════════════════════════════════
   BOʻLIM TURʼLARI — coach-mark onboarding reyestri (sof maʼlumot).

   Pull modeli: turlar foydalanuvchi Yoʻl-yoʻriq markazidan (GuideHub)
   soʻraganda ishga tushadi; faqat "home" sehrgardan keyin bir marta
   avtomatik (TourProvider boshqaradi). `id` — koʻrilgan turʼlar
   roʻyxatiga (useSettingsStore.completedTours) yoziladigan kalit.

   Kontent qoidasi: qadam ekranda koʻrinib turgan narsani takrorlamasin —
   faqat koʻrinmas imkoniyat (drag, rotatsiya, vazn, status almashtirish)
   haqida gapirsin.

   Bosqich `target` — `[data-tour="…"]` selektori; boʻlmasa yoki `mock`
   berilsa markazlashgan modal koʻrsatiladi (boʻsh hisobda real region
   oʻrniga mustaqil illyustratsiya).
   ════════════════════════════════════════════════════════════════════ */

export type TourMock = "timetableDrag" | "lessonsCalendar" | "tasksCalendar";

export type TourStep = {
  title: string;
  body: string;
  /** '[data-tour="…"]' — yoʻq boʻlsa markaziy modal */
  target?: string;
  placement?: "top" | "bottom" | "left" | "right";
  /** Tooltip/modal ichidagi illyustratsiya */
  mock?: TourMock;
};

export type TourDef = {
  id: string;
  /** Aynan shu pathname'da ishga tushadi */
  route: string;
  /** "Turlarni qayta koʻrish" panelida koʻrsatiladigan nom */
  label: string;
  steps: TourStep[];
};

export const TOURS: readonly TourDef[] = [
  {
    id: "home",
    route: "/dashboard",
    label: "Bosh sahifa",
    steps: [
      {
        title: "Ish maydoningiz bilan tanishing",
        body: "Har bir sahifa — jadval, darslar, baholar, davomat — shu yon panelda. Koʻproq joy kerak boʻlsa, yuqoridagi tugma bilan panelni yigʻib qoʻying.",
        target: '[data-tour="sidebar-nav"]',
        placement: "right",
      },
      {
        title: "Kunlik umumiy koʻrinish",
        body: "Har kuni ertalab shu yerdan kunni boshlang: salomlashuv kartasida bugungi darslar va vazifalar soni, pastda esa kelgusi darslar. Darsni bossangiz — toʻgʻridan-toʻgʻri tahrirga oʻtasiz.",
        target: '[data-tour="home-overview"]',
        placement: "right",
      },
      {
        title: "Kun jadvali",
        body: "Tanlangan kunning dars jadvali soatma-soat shu yerda. Joriy vaqt chizigʻi qaysi dars ketayotganini koʻrsatib turadi.",
        target: '[data-tour="home-schedule"]',
        placement: "left",
      },
      {
        title: "Taqvim va vazifalar",
        body: "Haftalik taqvimdan kunni tanlasangiz, jadval va vazifalar oʻsha kunga moslashadi. Pastda muddati yaqin vazifalaringiz turadi.",
        target: '[data-tour="home-week"]',
        placement: "left",
      },
      {
        title: "Yoʻl-yoʻriq markazi",
        body: "Biror boʻlim qanday ishlashini unutsangiz, shu tugmani bosing — har bir sahifaning qoʻllanmasini istalgan vaqt qayta koʻrasiz.",
        target: '[data-tour="header-guide"]',
        placement: "bottom",
      },
      {
        title: "Fikringiz biz uchun muhim",
        body: "Xato topdingizmi yoki taklif bormi? Shu yerdan jamoaga toʻgʻridan-toʻgʻri yozing — skrinshot ham biriktirsa boʻladi.",
        target: '[data-tour="header-feedback"]',
        placement: "bottom",
      },
    ],
  },
  {
    id: "timetable",
    route: "/dashboard/timetable",
    label: "Jadval",
    steps: [
      {
        title: "Sinflaringiz",
        body: "Sinflaringizni shu yerda yaratasiz. Har biriga rang beriladi — kalendarda ularni ajratib turadi.",
        target: '[data-tour="timetable-class-selector"]',
        placement: "right",
      },
      {
        title: "Haftalik jadval",
        body: "Takrorlanadigan jadvalingiz shu yerda. Jadval haftama-hafta almashsa, rotatsiya siklini sozlang — kalendar har kunni avtomatik belgilaydi.",
        target: '[data-tour="timetable-grid"]',
        placement: "left",
      },
      {
        title: "Jadvalga sinf qoʻshish",
        body: "Sinfni yon paneldan kalendardagi boʻsh katakka torting yoki katakni bosib tanlang.",
        mock: "timetableDrag",
      },
    ],
  },
  {
    id: "planner",
    route: "/dashboard/planner",
    label: "Rejalashtiruvchi",
    steps: [
      {
        title: "Dars slotlari",
        body: "Har blok — rejalashtirilgan dars. Ustiga borganda + tugmasi bilan yangi dars yarating yoki bogʻlash ikonkasi bilan mavjudini biriktiring; bogʻlangan blok rangga toʻladi va boshqa slotga tortish mumkin.",
        target: '[data-tour="planner-grid"]',
        placement: "left",
      },
      {
        title: "Oylik koʻrinish",
        body: "Butun jadvalni bir qarashda koʻrish uchun Oy koʻrinishiga oʻting. Rangli chiziqlar rejalashtirilgan sinflarni, hujjat ikonkalari bogʻlangan darsli kunlarni belgilaydi.",
        target: '[data-tour="planner-view-toggle"]',
        placement: "bottom",
      },
      {
        title: "Kun paneli",
        body: "Istalgan kunni bosib bu panelni oching. Bu yerdan oʻsha kun uchun dars yaratasiz, bogʻlaysiz va qayta joylaysiz.",
        target: '[data-tour="planner-day-cell"]',
        placement: "right",
      },
    ],
  },
  {
    id: "lessons",
    route: "/dashboard/lessons",
    label: "Darslar",
    steps: [
      {
        title: "Boʻlimlar bilan tartiblang",
        body: "Boʻlimlar darslaringizni boblar yoki mavzularga guruhlaydi. Oʻquv rejasini tartiblash uchun boʻlim yarating — tartibini oʻzgartirish uchun torting.",
        target: '[data-tour="lessons-units"]',
        placement: "right",
      },
      {
        title: "Darslaringiz",
        body: "Har boʻlim ichida dars yarating. Har dars kartasi holati, sanasi va bogʻlangan standartlarini koʻrsatadi.",
        target: '[data-tour="lessons-list"]',
        placement: "left",
      },
      {
        title: "Kalendarga rejalashtirish",
        body: "Kalendar koʻrinishiga oʻting. Darslarni yon paneldan boʻsh dars slotlariga torting.",
        mock: "lessonsCalendar",
      },
    ],
  },
  {
    id: "students",
    route: "/dashboard/students",
    label: "Oʻquvchilar",
    steps: [
      {
        title: "Oʻquvchilar roʻyxati",
        body: "Status belgisini bosib faol / uzoqda / arxiv orasida almashtiring. Kartani bossangiz — sahifadan chiqmay profil: toʻliq davomat, baho, eslatma va portfolio uchun «Profilni koʻrish»ni bosing.",
        target: '[data-tour="students-list"]',
        placement: "left",
      },
      {
        title: "Teglar boʻyicha filtr",
        body: "Teglar bilan oʻquvchilarni guruhlang — oʻqish darajasi, xatti-harakat rejasi, iqtidor yoki oʻzingizga kerakli har qanday belgi. Muayyan oʻquvchilarga fokuslash uchun status yoki teg boʻyicha filtrlang.",
        target: '[data-tour="students-filter"]',
        placement: "bottom",
      },
    ],
  },
  {
    id: "grades",
    route: "/dashboard/grades",
    label: "Baholar",
    steps: [
      {
        title: "Baho mavzulari",
        body: "Mavzular topshiriqlaringizni guruhlab yakuniy bahoni tortadi. Yigʻindisi 100% boʻladigan ogʻirliklar belgilang, soʻng mavzuni bosib jurnalni filtrlang.",
        target: '[data-tour="grades-grid"]',
        placement: "left",
      },
      {
        title: "Jurnalingiz",
        body: "Jurnal har bir oʻquvchi va topshiriqni jadval koʻrinishida koʻrsatadi. Baho kiritish yoki tahrirlash uchun katakni bosing. Jami mavzu ogʻirliklariga qarab avtomatik yangilanadi.",
        target: '[data-tour="grades-grid"]',
        placement: "left",
      },
    ],
  },
  {
    id: "standards",
    route: "/dashboard/standards",
    label: "Standartlar",
    steps: [
      {
        title: "Oʻquv dasturi standartlarini qoʻshish",
        body: "Milliy va mintaqaviy freymvorklardan standartlar qoʻshing. Sinfingizga mos toʻplamni topish uchun mamlakat, mintaqa, fan va sinf darajasi boʻyicha filtrlang.",
        target: '[data-tour="standards-add"]',
        placement: "left",
      },
      {
        title: "Qamrovni kuzatib boring",
        body: "Har standart qamrov holatini koʻrsatadi — yashil: dars bogʻlangan, kulrang: hali kerak. Standartlarni dars muharriridan belgilaysiz, bogʻlangan darslar shu yerda avtomatik paydo boʻladi.",
        target: '[data-tour="standards-list"]',
        placement: "left",
      },
    ],
  },
  {
    id: "attendance",
    route: "/dashboard/attendance",
    label: "Davomat",
    steps: [
      {
        title: "Davomat jadvali",
        body: "Oʻquvchi × kun jadvali. Katakni bosib holatni (bor / yoʻq / kech / sababli) belgilang; oʻzgarish darrov saqlanadi.",
        target: '[data-tour="attendance-heatmap"]',
        placement: "left",
      },
      {
        title: "Statuslarni sozlash",
        body: "Bu tugma Sozlamalar > Davomat boʻlimini ochadi: statuslarni yoqing/oʻchiring va davomat foizidagi vaznini belgilang.",
        target: '[data-tour="attendance-config"]',
        placement: "bottom",
      },
    ],
  },
  {
    id: "tasks",
    route: "/dashboard/tasks",
    label: "Vazifalar",
    steps: [
      {
        title: "Ishlaringizni tartiblang",
        body: "Baholash, rejalashtirish, ota-onalarga xat — kuzatmoqchi boʻlgan har narsa uchun vazifa yarating. Rangli teglar bilan guruhlab, holat, ustuvorlik yoki teg boʻyicha filtrlang.",
        target: '[data-tour="tasks-list"]',
        placement: "right",
      },
      {
        title: "Tez qoʻshish",
        body: "Vazifa qatorini bir joyda yozing: sana, ustuvorlik va sinfni toolbar tugmalari bilan biriktiring.",
        target: '[data-tour="tasks-composer"]',
        placement: "bottom",
      },
      {
        title: "Statistika paneli",
        body: "Oʻng panel tanlangan koʻlam boʻyicha trend va sinf yukini koʻrsatadi.",
        target: '[data-tour="tasks-stats"]',
        placement: "left",
      },
    ],
  },
] as const;

/** Berilgan pathname uchun boshlanadigan tur (aniq moslik). */
export function tourForRoute(pathname: string): TourDef | undefined {
  return TOURS.find((t) => t.route === pathname);
}
