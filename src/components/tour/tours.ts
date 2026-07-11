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

export type TourMock = "timetableDrag" | "timetablePick" | "lessonsCalendar" | "tasksCalendar";

export type TourStep = {
  title: string;
  body: string;
  /** '[data-tour="…"]' — yoʻq boʻlsa markaziy modal */
  target?: string;
  placement?: "top" | "bottom" | "left" | "right";
  /** Yon (cross-axis) tekislash — daf'atan "center"; nishon burchakka yaqin
      boʻlsa "start"/"end" bilan tooltipni pastdagi kontentdan uzoqlashtiring. */
  align?: "start" | "center" | "end";
  /** Tooltip/modal ichidagi illyustratsiya */
  mock?: TourMock;
  /** Sahifaga signal berish uchun barqaror kalit (useTourRequest.activeStepId) —
      masalan markaziy modal qadamida sahifa holatini vaqtincha almashtirish
      uchun (koʻrinishni "oy"ga oʻtkazish kabi). */
  id?: string;
};

export type TourDef = {
  id: string;
  /** Aynan shu pathname'da ishga tushadi */
  route: string;
  /** "Turlarni qayta koʻrish" panelida koʻrsatiladigan nom */
  label: string;
  steps: TourStep[];
};

/* Tartib QASDAN yon panel (`app-sidebar.tsx`ʼdagi `navItems`) bilan bir xil
   ketma-ketlikda — GuideHub "Boshlash" checklisti sidebar bilan mos
   navigatsiya taʼminlasin. Yangi sahifa qoʻshsangiz ikkalasiga ham xuddi
   shu joyga qoʻshing. */
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
    id: "classes",
    route: "/dashboard/classes",
    label: "Mening sinflarim",
    steps: [
      {
        title: "Hammasi shu yerdan boshlanadi",
        body: "Avval yangi sinf yarating: nomi, fani va ajratib turuvchi rangini kiriting. Tizimdagi boshqa barcha boʻlim (jadval, oʻquvchilar, jurnal, davomat) shu sinflarga bogʻlanadi.",
        target: '[data-tour="classes-add"]',
        placement: "bottom",
      },
      {
        title: "Sinf kartochkasi",
        body: "Har bir kartochkada oʻquvchilar, mavzular va topshiriqlar soni bir qarashda koʻrinadi. Kartochka ustiga bosib toʻliq sinf sahifasiga oʻtasiz.",
        target: '[data-tour="classes-list"]',
        placement: "left",
      },
      {
        title: "Koʻrinishni oʻzgartirish",
        body: "Sinflaringizni katakcha yoki roʻyxat shaklida koʻrish imkoniyati mavjud — oʻzingizga eng qulay koʻrinishni tanlang.",
        target: '[data-tour="classes-view-toggle"]',
        placement: "bottom",
      },
      {
        title: "Umumiy statistika",
        body: "Ushbu qismda barcha sinflar, oʻquvchilar, darslar va topshiriqlarning umumiy soni jamlangan. Yangi sinf qoʻshishingiz bilan bu koʻrsatkichlar oʻz-oʻzidan yangilanadi.",
        target: '[data-tour="classes-stats"]',
        placement: "left",
      },
    ],
  },
  {
    id: "students",
    route: "/dashboard/students",
    label: "Oʻquvchilar",
    steps: [
      {
        title: "Sinflaringiz",
        body: "Oʻquvchilarini koʻrish uchun chap tomondan biror sinfni tanlang. Har bir sinf nechta oʻquvchi borligini koʻrsatib turadi.",
        target: '[data-tour="students-classes"]',
        placement: "right",
      },
      {
        title: "Oʻquvchilar roʻyxati",
        body: "Sinfdagi barcha oʻquvchilarni bir vaqtning oʻzida koʻrasiz. Kartani bossangiz — oʻng tomonda profil ochiladi. Holat belgisini bossangiz — faol / taʼtilda orasida almashtirasiz (arxivga oʻtkazish uchun oʻng tugmani bosing).",
        target: '[data-tour="students-list"]',
        placement: "left",
      },
      {
        title: "Oʻquvchi maʼlumotlari",
        body: "Sahifadan chiqmagan holda oʻquvchining sinfi, bogʻlanish maʼlumotlari va tezkor amallari bilan tanishing. Toʻliq davomat, baholar, eslatmalar va shaxsiy toʻplami bilan tanishish uchun «Profilni koʻrish»ni bosing.",
        target: '[data-tour="students-preview"]',
        placement: "left",
      },
      {
        title: "Holat boʻyicha filtrlash",
        body: "Oʻquvchilarni holatiga qarab (faol, taʼtilda, arxivda) saralang — kerakli oʻquvchilarga eʼtibor qaratish uchun qulay.",
        target: '[data-tour="students-filter"]',
        placement: "bottom",
      },
    ],
  },
  {
    id: "timetable",
    route: "/dashboard/timetable",
    label: "Dars jadvali",
    steps: [
      {
        title: "Sinflaringiz",
        body: "Sinflaringizni avval shu yerda yarating. Taqvimda ularni osongina ajratib olishingiz uchun har biriga alohida rang beriladi.",
        target: '[data-tour="timetable-class-selector"]',
        placement: "right",
      },
      {
        title: "Haftalik jadval",
        body: "Doimiy dars jadvalingiz shu yerda saqlanadi. Jadvalingiz haftalar boʻyicha oʻzgarib tursa, rotatsiya siklini sozlang — shunda taqvim har bir kunni avtomatik belgilab beradi.",
        target: '[data-tour="timetable-grid"]',
        placement: "left",
      },
      {
        title: "Yon paneldan sudrab oʻtkazing",
        body: "Sinf kartochkasini yon paneldan ushlab, taqvimdagi boʻsh joyga sudrab oʻtkazing. Bu usul barcha koʻrinishlarda ishlaydi.",
        mock: "timetableDrag",
      },
      {
        title: "Yoki katak ustiga bosing",
        body: "«Jadval» koʻrinishida boʻsh katak ustiga bosib, roʻyxatdan kerakli sinfni tanlashingiz ham mumkin. Bu darslarni tez va aniq joylashtirish uchun juda qulay.",
        mock: "timetablePick",
      },
    ],
  },
  {
    id: "planner",
    route: "/dashboard/planner",
    label: "Rejalashtiruvchi",
    steps: [
      {
        title: "Boʻsh dars slotlari",
        body: "Har bir blok — jadvaldagi rejalashtirilgan dars. Ustiga sichqonchani olib boring: \"+\" tugmasi bilan yangi dars yarating yoki bogʻlash ikonkasi bilan mavjud darsni biriktiring.",
        target: '[data-tour="planner-empty-slot"]',
        placement: "right",
      },
      {
        title: "Bogʻlangan darslar",
        body: "Dars biriktirilgach, blok rangga toʻlib, dars nomini koʻrsatadi. Uni tahrirlash uchun ustiga bosing yoki boshqa slotga sudrab oʻtkazing.",
        target: '[data-tour="planner-lesson-block"]',
        placement: "right",
      },
      {
        title: "Kun sozlamalari",
        body: "Kun ustiga sichqonchani olib borsangiz shu tugma chiqadi — shu yerdan kunni bloklashingiz yoki jadvalni tahrirlashga oʻtishingiz mumkin.",
        target: '[data-tour="planner-day-settings"]',
        placement: "left",
      },
      {
        title: "Oylik koʻrinish",
        body: "Butun jadvalni bir qarashda koʻrish uchun Oy koʻrinishiga oʻting. Rangli chiziqlar rejalashtirilgan sinflarni, hujjat ikonkalari esa bogʻlangan darsli kunlarni belgilaydi.",
        id: "planner-month-preview",
      },
    ],
  },
  {
    id: "lessons",
    route: "/dashboard/lessons",
    label: "Darslar",
    steps: [
      {
        title: "Sinflaringiz",
        body: "Darslar va boʻlimlarni koʻrish uchun biror sinfni tanlang. Ularning har birida qancha boʻlim va dars borligini koʻrishingiz mumkin.",
        target: '[data-tour="lessons-classes"]',
        placement: "right",
      },
      {
        title: "Boʻlimlarga ajratish",
        body: "Boʻlimlar darslaringizni boblar yoki mavzularga ajratishga yordam beradi. Oʻquv rejangizni tartibga solish uchun boʻlimlar yarating — ularning oʻrnini almashtirish uchun shunchaki sudrab oʻtkazing.",
        target: '[data-tour="lessons-units"]',
        placement: "right",
      },
      {
        title: "Darslaringiz",
        body: "Har bir boʻlim ichida alohida darslar yarating. Har bir dars kartasi uning holati va sanasini koʻrsatib turadi.",
        target: '[data-tour="lessons-list"]',
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
        title: "Sinflaringiz",
        body: "Davomat jadvalini koʻrish uchun istalgan sinfni tanlang. Bu yerda butun sinfning kunlik davomatini belgilashingiz mumkin.",
        target: '[data-tour="attendance-classes"]',
        placement: "right",
      },
      {
        title: "Davomat jadvali",
        body: "Jadval oʻquvchilar va sanalar kesimida tuzilgan. Oʻquvchining davomatini (keldi, kelmadi, kechikdi yoki sababli) belgilash uchun tegishli katakchani bosing. Oʻzgarishlar darhol saqlanadi.",
        target: '[data-tour="attendance-heatmap"]',
        placement: "left",
      },
      {
        title: "Holatlarni sozlash",
        body: "Ushbu tugma Sozlamalar > Davomat boʻlimini ochadi. U yerdan davomat holatlarini yoqib-oʻchirishingiz hamda ularning umumiy davomat foiziga taʼsirini (ulushini) belgilashingiz mumkin.",
        target: '[data-tour="attendance-config"]',
        placement: "bottom",
      },
    ],
  },
  {
    id: "grades",
    route: "/dashboard/grades",
    label: "Jurnal",
    steps: [
      {
        title: "Sinflaringiz",
        body: "Baholar jurnalini ochish uchun biror sinfni tanlang. Har bir sinfda nechta oʻquvchi roʻyxatdan oʻtgani va nechta topshiriq yaratilgani koʻrsatiladi.",
        target: '[data-tour="grades-classes"]',
        placement: "right",
      },
      {
        title: "Baho mavzulari",
        body: "Mavzular topshiriqlaringizni guruhlab yakuniy bahoga ulushini belgilaydi. Yigʻindisi 100% boʻladigan ogʻirliklar oʻrnating, soʻng mavzuni bosib jadvalni filtrlang.",
        target: '[data-tour="grades-topics"]',
        placement: "bottom",
      },
      {
        title: "Baholar jurnalingiz",
        body: "Jurnalda har bir oʻquvchi va topshiriq jadval koʻrinishida aks etadi. Baho kiritish yoki tahrirlash uchun istalgan katakni bosing. Umumiy natija mavzularning ulushiga qarab avtomatik yangilanib boradi.",
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
        title: "Sinflaringiz",
        body: "Standartlar roʻyxatini koʻrish uchun istalgan sinfni tanlang. Har bir sinfning oʻz standartlar toʻplami boʻladi.",
        target: '[data-tour="standards-classes"]',
        placement: "right",
      },
      {
        title: "Oʻquv dasturi standartlarini qoʻshish",
        body: "Milliy va hududiy taʼlim andozalaridan standartlarni qoʻshishingiz mumkin. Sinfingizga mos keladigan toʻplamni topish uchun ularni mamlakat, hudud, fan va sinf darajasi boʻyicha saralang.",
        target: '[data-tour="standards-add"]',
        placement: "bottom",
        align: "end",
      },
      {
        title: "Qamrovni kuzatib boring",
        body: "Har bir standart oʻzlashtirish holatini koʻrsatadi — yashil rang dars biriktirilganini, kulrang esa hali dars biriktirilmaganini anglatadi. Standartlarni darsni tahrirlash oynasida belgilaysiz, biriktirilgan darslar esa bu yerda oʻz-oʻzidan aks etadi.",
        target: '[data-tour="standards-list"]',
        placement: "left",
      },
    ],
  },
  {
    id: "tasks",
    route: "/dashboard/tasks",
    label: "Vazifalar",
    steps: [
      {
        title: "Vazifalar paneli",
        body: "Chap panelda vazifalaringizni tezkor koʻzdan kechirishingiz mumkin. Bu yerda aqlli roʻyxatlar (Bugun, Muhim, Kechikkanlar...), sinflar boʻyicha saralash va tayyor shablonlar (bir marta bosish orqali vazifa yaratish) joylashgan.",
        target: '[data-tour="tasks-sidebar"]',
        placement: "right",
      },
      {
        title: "Ishlaringizni tartibga soling",
        body: "Baholash, darslarni rejalashtirish yoki ota-onalar bilan muloqot — nazorat qilmoqchi boʻlgan har bir ishingiz uchun vazifa yarating. Ularni rangli yorliqlar orqali guruhlang hamda holati, muhimlik darajasi yoki yorligʻiga qarab saralang.",
        target: '[data-tour="tasks-list"]',
        placement: "right",
      },
      {
        title: "Tezkor qoʻshish",
        body: "Vazifa matnini kiritish qatorining oʻzidayoq yozing: sana, muhimlik darajasi va tegishli sinfni uskunalar paneli tugmalari orqali biriktiring.",
        target: '[data-tour="tasks-composer"]',
        placement: "bottom",
      },
      {
        title: "Statistika paneli",
        body: "Oʻng panel tanlangan vaqt oraligʻiga koʻra oʻzgarishlar dinamikasi va ish yuklamasini koʻrsatadi.",
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
