"use client";

import { cn } from "@/lib/utils";

/**
 * Doska vidjetidagi «qaysi sinf?» roʻyxati — sarlavha, yuklanish, xato,
 * boʻsh holat va sinf tugmalari.
 *
 * Ikki vidjet ishlatadi: taqdimot (jonli sessiyani boshlash) va gʻildirak
 * (sinf roʻyxatini ulash). Idish (popover yoki ichki blok) chaqiruvchida —
 * bu faqat MAZMUN. Matnlar ham chaqiruvchidan keladi.
 */
export function ClassList({
  title,
  classes,
  error,
  busy = false,
  busyId,
  preferredId,
  loadingText,
  emptyText,
  onPick,
}: {
  title: string;
  /** `null` — hali yuklanmoqda. */
  classes: { id: string; name: string }[] | null;
  error?: string | null;
  /** Amal bajarilmoqda — hamma tugma oʻchadi. */
  busy?: boolean;
  /** Qaysi sinf bosilgani — oʻsha tugmada yuklanish matni chiqadi. */
  busyId?: string | null;
  /** Oldindan tanlangan sinf — qalin yoziladi. */
  preferredId?: string;
  loadingText: string;
  emptyText: string;
  onPick: (classId: string) => void;
}) {
  return (
    <>
      <p className="text-caption text-muted-foreground px-2 py-1">{title}</p>
      {error && (
        <p role="alert" className="text-caption text-destructive px-2">
          {error}
        </p>
      )}
      {classes === null && !error && <p className="px-2 text-sm opacity-70">{loadingText}</p>}
      {classes?.length === 0 && <p className="px-2 text-sm opacity-70">{emptyText}</p>}
      {classes?.map((c) => (
        <button
          key={c.id}
          type="button"
          disabled={busy || Boolean(busyId)}
          onClick={() => onPick(c.id)}
          className={cn(
            "hover:bg-muted rounded-md px-2 py-1.5 text-left text-sm disabled:opacity-50",
            c.id === preferredId && "font-semibold",
          )}
        >
          {busyId === c.id ? loadingText : c.name}
        </button>
      ))}
    </>
  );
}
