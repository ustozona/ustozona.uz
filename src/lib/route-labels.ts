/* Marshrut → tarjima kaliti xaritasi (messages/*.json "RouteLabels" nomspeysi).
   Sidebar (app-sidebar.tsx) navItems/footerItems bilan yagona manba sifatida
   ishlatiladi (breadcrumb ham shu yerdan o'qiydi). */
export const ROUTE_LABEL_KEYS: Record<string, string> = {
  "/dashboard": "home",
  "/dashboard/classes": "myClasses",
  "/dashboard/students": "students",
  "/dashboard/timetable": "timetable",
  "/dashboard/planner": "planner",
  "/dashboard/tasks": "tasks",
  "/dashboard/lessons": "lessons",
  "/dashboard/resources": "resources",
  "/dashboard/attendance": "attendance",
  "/dashboard/behavior": "behavior",
  "/dashboard/grades": "grades",
  "/dashboard/grades/help": "gradesHelp",
  "/dashboard/statistics": "statistics",
  "/dashboard/standards": "standards",
  "/dashboard/changelog": "changelog",
  "/dashboard/feedback": "feedback",
  "/dashboard/settings": "settings",
  "/admin": "admin",
  "/admin/users": "adminUsers",
  "/admin/schools": "adminSchools",
  "/admin/feedback": "adminFeedback",
  "/admin/audit": "adminAudit",
};
