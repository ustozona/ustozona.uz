export default function WithSidebarLayout({ children }: { children: React.ReactNode }) {
  /* Balandlik siyosati — `DashboardPage.tsx` dagi bilan bir xil:
     `lg+` da ekranga mixlanadi (scroll panellar ichida); `< lg` da tabiiy
     balandlik, scroll `dashboard/layout.tsx` dagi oʻramga oʻtadi.
     ⛔ `h-full`/`overflow-hidden` ni prefikssiz yozmang: telefonda sahifa
     pastki qismi kesilib, umuman aylantirib boʻlmay qolardi (2026-09-27). */
  return (
    <div className="relative z-10 max-lg:min-h-full lg:h-full flex gap-6">
      {/* Sidebar is now explicitly rendered in each page */}
      <div className="flex-1 min-w-0 max-lg:min-h-full lg:h-full relative lg:overflow-hidden flex gap-6">
        {children}
      </div>
    </div>
  );
}
