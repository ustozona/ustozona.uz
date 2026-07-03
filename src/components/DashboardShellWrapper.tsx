"use client";

export default function DashboardShellWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 h-full w-full flex flex-col min-h-0 min-w-0">
      {children}
    </div>
  );
}
