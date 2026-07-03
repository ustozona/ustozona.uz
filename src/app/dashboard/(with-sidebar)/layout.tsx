export default function WithSidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 h-full flex gap-6">
      {/* Sidebar is now explicitly rendered in each page */}
      <div className="flex-1 min-w-0 h-full relative overflow-hidden flex gap-6">
        {children}
      </div>
    </div>
  );
}
