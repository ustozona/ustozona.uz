"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const POLL_INTERVAL_MS = 5 * 60 * 1000;
const TOAST_ID = "new-version-available";

/**
 * Fon rejimida /api/version'ni poll qiladi; joriy build ID serverdagidan
 * farq qilsa, "yangi versiya bor" toast koʻrsatadi (reload + changelog link).
 */
export function VersionWatcher() {
  const router = useRouter();
  const currentBuildId = useRef<string | null>(null);
  const notified = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function checkVersion() {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const { buildId } = (await res.json()) as { buildId: string };
        if (cancelled) return;

        if (currentBuildId.current === null) {
          currentBuildId.current = buildId;
          return;
        }

        if (buildId !== currentBuildId.current && !notified.current) {
          notified.current = true;
          toast.custom(
            (id) => (
              <div className="bg-popover/95 backdrop-blur-md text-popover-foreground border-border rounded-2xl flex w-89 flex-col gap-3.5 border p-4 shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg flex size-10 shrink-0 items-center justify-center bg-[#FBC02D]/20 text-[#946800] dark:text-[#FBC02D]">
                    <Sparkles className="size-5" aria-hidden="true" />
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <p className="text-sm font-semibold tracking-tight">
                      Yangi versiya mavjud
                    </p>
                    <p className="text-muted-foreground/80 text-xs font-medium">
                      Sahifani yangilab, oʻzgarishlarni koʻring
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-teal-400/10 px-2 py-0.5 text-[10px] text-teal-400 font-semibold border border-teal-400/20 uppercase tracking-wider">
                    <span className="size-1 rounded-full bg-teal-400 animate-pulse" />
                    Yangi
                  </span>
                </div>
                <Separator className="bg-border/50" />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 cursor-pointer h-9 text-xs gap-1.5"
                    onClick={() => {
                      toast.dismiss(id);
                      router.push("/dashboard/changelog");
                    }}
                  >
                    Nima oʻzgardi?
                  </Button>
                  <Button
                    className="flex-1 cursor-pointer h-9 text-xs gap-1.5 hover:bg-primary/80"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw className="size-3.5" aria-hidden="true" />
                    Yangilash
                  </Button>
                </div>
              </div>
            ),
            { id: TOAST_ID, duration: Infinity },
          );
        }
      } catch {
        // tarmoq xatosi — indamay keyingi urinishni kutamiz
      }
    }

    checkVersion();
    const interval = setInterval(checkVersion, POLL_INTERVAL_MS);

    function onVisibilityChange() {
      if (document.visibilityState === "visible") checkVersion();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router]);

  return null;
}
