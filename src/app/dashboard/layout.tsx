import Header from "@/components/Header";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import { AppSidebar } from "@/components/app-sidebar";
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
import BehaviorAutoReconciler from "@/components/behavior/BehaviorAutoReconciler";
import LegacyStorageCleanup from "@/components/sync/LegacyStorageCleanup";
import OnboardingGate from "@/components/onboarding/OnboardingGate";
import TourProvider from "@/components/tour/TourProvider";

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
      <BehaviorAutoReconciler />
      <LegacyStorageCleanup />
      <OnboardingGate />
      <TourProvider />
      <AppSidebar />
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
