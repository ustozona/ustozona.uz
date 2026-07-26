"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

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
          toast("Yangi versiya mavjud", {
            id: TOAST_ID,
            icon: <Sparkles className="size-4" />,
            description: "Sahifani yangilab, oʻzgarishlarni koʻring.",
            duration: Infinity,
            action: {
              label: "Yangilash",
              onClick: () => window.location.reload(),
            },
            cancel: {
              label: "Nima oʻzgardi?",
              onClick: () => router.push("/dashboard/changelog"),
            },
          });
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
