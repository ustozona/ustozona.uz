import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/components/sidebar-context";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div
        className="flex flex-col h-dvh min-h-[600px] w-full"
        style={{ "--top-header-height": "3.8rem" } as React.CSSProperties}
      >
        <Header />
        <div className="flex flex-1 min-h-0">
          <Sidebar />
          <main className="relative flex-1 min-w-0 overflow-y-auto scrollbar-thin bg-neutral-50/50 dark:bg-black">
            {/* Grid background */}
            <div
              className={cn(
                "absolute inset-0 opacity-[0.24]",
                "[background-size:40px_40px]",
                "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
                "dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]"
              )}
              style={{ maskImage: "radial-gradient(ellipse at center, white 60%, transparent 100%)" }}
            />
            <div className="relative z-10 h-full">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
