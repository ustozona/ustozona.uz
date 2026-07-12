"use client";

import BehaviorView from "@/components/behavior/BehaviorView";
import type { ClassIdentity } from "@/lib/class-id";

/* ── Xulq boʻlimi — umumiy BehaviorView'ni sinf-detali ichida koʻrsatadi
   (M4'da mustaqil /dashboard/behavior sahifasi ham shu view'ni oladi).
   BehaviorView oʻzida mount-gate qiladi (SSR mismatch oldini olish). ── */
export function BehaviorSection({ identity }: { identity: ClassIdentity }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <BehaviorView classId={identity.id} />
    </div>
  );
}
