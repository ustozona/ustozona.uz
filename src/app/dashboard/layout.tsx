import Header from "@/components/Header";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import AppSidebarServer from "@/components/app-sidebar-server";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import DashboardShellWrapper from "@/components/DashboardShellWrapper";
import WorkspaceBackground from "@/components/WorkspaceBackground";
import SettingsServerSync from "@/components/sync/SettingsServerSync";
import GradesServerSync from "@/components/sync/GradesServerSync";
import AttendanceServerSync from "@/components/sync/AttendanceServerSync";
import LessonsServerSync from "@/components/sync/LessonsServerSync";
import TimetableServerSync from "@/components/sync/TimetableServerSync";
import CalendarServerSync from "@/components/sync/CalendarServerSync";
import StandardsServerSync from "@/components/sync/StandardsServerSync";
import ClassNotesServerSync from "@/components/sync/ClassNotesServerSync";
import RelationsServerSync from "@/components/sync/RelationsServerSync";
import ClassPrefsServerSync from "@/components/sync/ClassPrefsServerSync";
import NotificationsServerSync from "@/components/sync/NotificationsServerSync";
import FeedbackServerSync from "@/components/sync/FeedbackServerSync";
import BehaviorServerSync from "@/components/sync/BehaviorServerSync";
import StudentNotesServerSync from "@/components/sync/StudentNotesServerSync";
import TasksServerSync from "@/components/sync/TasksServerSync";
import TasksAutoReconciler from "@/components/tasks/TasksAutoReconciler";
import FocusEngine from "@/components/tasks/FocusEngine";
import BehaviorAutoReconciler from "@/components/behavior/BehaviorAutoReconciler";
import LegacyStorageCleanup from "@/components/sync/LegacyStorageCleanup";
import OnboardingGate from "@/components/onboarding/OnboardingGate";
import TourProvider from "@/components/tour/TourProvider";
import AssignmentEditorHost from "@/components/assignments/AssignmentEditorHost";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider
      className="h-svh min-h-[600px]"
      style={{ "--top-header-height": "3.8rem" } as React.CSSProperties}
    >
      <SettingsServerSync />
      <GradesServerSync />
      <AttendanceServerSync />
      <LessonsServerSync />
      <TimetableServerSync />
      <CalendarServerSync />
      <StandardsServerSync />
      <ClassNotesServerSync />
      <RelationsServerSync />
      <ClassPrefsServerSync />
      <NotificationsServerSync />
      <FeedbackServerSync />
      <BehaviorServerSync />
      <StudentNotesServerSync />
      <TasksServerSync />
      <TasksAutoReconciler />
      <FocusEngine />
      <BehaviorAutoReconciler />
      <LegacyStorageCleanup />
      <OnboardingGate />
      {/* ⛔ `LessonLabLinkGate` BU YERDA EDI — OLIB TASHLANDI (2026-08-10)

          U kirish bilan butun dashboard ustiga yopib bo'lmaydigan modal
          qo'yardi: «Telegram akkauntingizni bog'lang». Sabab 2026-08-08
          da o'rinli edi — o'sha paytdagi NUSXA modelida bot ma'lumoti
          Ustozonaga ko'chirilardi va kimlik oldindan mixlanmasa dublikat
          tug'ilardi (2026-08-05: 8 sinf, 94 o'quvchi).

          Lekin arxitektura o'sha haftaning o'zida XIZMAT modeliga o'tdi
          va asos yo'qoldi — `docs/baholash-integratsiya.md`:
            §2 «LessonLabga bizning ma'lumot ko'chmaydi... shu sababli
                dublikat muammosi tug'ilmaydi»
            §7 «Ustozona o'qituvchisida LessonLab akkaunti yo'q va
                bo'lishi ham shart emas»

          O'yin qobig'i, OMR skaneri va javob varag'i PDF — uchalasi ham
          hamkor imzosi (`LESSONLAB_PARTNER_KEY`) bilan ishlaydi va
          `user_telegram` ni UMUMAN o'qimaydi. Bog'lanish faqat BOTDAN
          IMPORT uchun kerak (`importRoster` / `importTests`), ya'ni
          faqat botda haqiqatan ma'lumoti bor o'qituvchi uchun.

          To'g'ridan Ustozonaga kelgan odam esa LessonLabni bilmaydi —
          undan birinchi qadamda begona tizimga ulanishni talab qilish
          ro'yxatdan o'tish voronkasini bekorga uzardi.

          O'RNIGA: bog'lash o'zi kerak bo'lgan joyda so'raladi —
            · Sozlamalar > LessonLab / Profil  (`LessonLabLinkPanel`)
            · «Sinflarni sinxronlash»          (`BaholashWorkspace`,
              `not_linked` bo'lsa jimgina bog'lash yo'liga yuboradi)
          Bu naqsh allaqachon yozilgan va ishlaydi. */}
      <TourProvider />
      <AssignmentEditorHost />
      <AppSidebarServer />
      <SidebarInset className="min-h-0 overflow-hidden">
        <ImpersonationBanner />
        <Header />
        <div className="relative flex-1 min-w-0 min-h-0 overflow-hidden">
          <WorkspaceBackground />
          <DashboardShellWrapper>{children}</DashboardShellWrapper>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
