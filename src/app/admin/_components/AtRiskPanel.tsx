"use client";

import * as React from "react";
import Link from "next/link";
import { Activity, UserRoundX } from "lucide-react";
import { Panel, PanelBody } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import type { AtRiskTeacher } from "@/server/dal/admin/stats";
import { activityLabel } from "@/lib/faollik";
import { AdminPanelHeader } from "./AdminPanelHeader";

/* «Eʼtibor talab qiladi» — sabab boʻyicha tablar va qisqa roʻyxat.

   Ilgari bitta uzun roʻyxat edi va uning chegarasi yoʻq edi: hisob
   koʻpaygan sari u sahifani pastga itarardi, «sinf yaratmaganlar
   nechta?» degan savolga javob olish uchun esa qatorlarni sanash
   kerak edi. Endi har sababning soni tab ustida, roʻyxat esa birinchi
   PREVIEW ta qator bilan boshlanadi. */

type Reason = AtRiskTeacher["reason"];

/* Qatordagi toʻliq yorliq — UsersTable.tsx dagi STATUS_LABELS bilan
   bir xil tilda («Kam ishlagan», «Toʻxtagan»). */
const REASON_LABEL: Record<Reason, string> = {
  no_class: "Sinf yaratmagan",
  no_students: "Oʻquvchi kiritmagan",
  no_activity: "Hech nima qilmagan",
  tried_once: "Kam ishlagan, davom etmagan",
  went_quiet: "Ishlagan, keyin toʻxtagan",
};

/* Tab yorligʻi — qisqa, bir-ikki soʻz. Tartib = eng erta toʻsiqdan
   eng kechigacha (DAL dagi `reason` tartibi bilan bir xil). */
const REASON_TAB: Record<Reason, string> = {
  no_class: "Sinfsiz",
  no_students: "Oʻquvchisiz",
  no_activity: "Ishlamagan",
  tried_once: "Kam ishlagan",
  went_quiet: "Toʻxtagan",
};
const REASON_ORDER: Reason[] = [
  "no_class",
  "no_students",
  "no_activity",
  "tried_once",
  "went_quiet",
];

const PREVIEW = 6;

function daysAgoLabel(d: Date | string | null): string {
  if (!d) return "hech qachon ishlamagan";
  const diff = Math.floor(
    (Date.now() - new Date(d).getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diff <= 0) return "bugun faol boʻlgan";
  if (diff === 1) return "kecha faol boʻlgan";
  return `${diff} kun oldin faol boʻlgan`;
}

export function AtRiskPanel({ rows }: { rows: AtRiskTeacher[] }) {
  const [tab, setTab] = React.useState<"all" | Reason>("all");
  const [expanded, setExpanded] = React.useState(false);

  const counts = React.useMemo(() => {
    const c = {} as Record<Reason, number>;
    for (const r of rows) c[r.reason] = (c[r.reason] ?? 0) + 1;
    return c;
  }, [rows]);

  /* Faqat bor sabablar tab boʻladi — boʻsh tab bosilib, boʻsh roʻyxat
     koʻrish maʼnosiz. */
  const options = [
    { value: "all" as const, label: `Hammasi · ${rows.length}` },
    ...REASON_ORDER.filter((r) => counts[r]).map((r) => ({
      value: r,
      label: `${REASON_TAB[r]} · ${counts[r]}`,
    })),
  ];

  const filtered = tab === "all" ? rows : rows.filter((r) => r.reason === tab);
  const visible = expanded ? filtered : filtered.slice(0, PREVIEW);
  const hidden = filtered.length - visible.length;

  return (
    <Panel>
      <AdminPanelHeader
        icon={<UserRoundX />}
        title="Eʼtibor talab qiladi"
        count={rows.length > 0 ? `${rows.length} ta` : undefined}
        description="Faollashmagan yoki 14+ kun jim — sababini soʻrash kerak"
      />
      {rows.length === 0 ? (
        <PanelBody inset>
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Activity />
              </EmptyMedia>
              <EmptyTitle>Hech kim tashlab ketmagan</EmptyTitle>
            </EmptyHeader>
          </Empty>
        </PanelBody>
      ) : (
        <PanelBody>
          <div className="overflow-x-auto border-b border-border px-5 py-3">
            <SegmentedToggle
              variant="pill"
              aria-label="Sabab boʻyicha"
              value={tab}
              onValueChange={(v) => {
                setTab(v);
                setExpanded(false);
              }}
              options={options}
            />
          </div>
          <ul className="divide-y divide-border">
            {visible.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  {/* Ism — foydalanuvchilar jadvaliga shu odam bilan
                      filtrlangan havola: u yerda uning hamma raqamlari
                      va amallari (rol, seanslar, sifatida kirish) bor. */}
                  <Link
                    href={`/admin/users?q=${encodeURIComponent(r.email)}`}
                    className="block truncate text-sm font-medium hover:underline"
                  >
                    {r.name || r.email}
                  </Link>
                  <p className="truncate text-caption text-muted-foreground">{r.email}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                  {tab === "all" && (
                    <Badge size="sm" variant="outline">
                      {REASON_LABEL[r.reason]}
                    </Badge>
                  )}
                  {/* Oxirgi ish QAYSI boʻlimda edi — «14 kun oldin faol
                      boʻlgan» oʻzi nima qilganini aytmasdi, va aynan shu
                      savol roʻyxatni ochishga sabab boʻladi.
                      `suppressHydrationWarning` — `Date.now()` serverda va
                      brauzerda boshqa lahzada hisoblanadi; kun chegarasida
                      «13» va «14» kun boʻlib ajralishi kutilgan farq. */}
                  <span
                    suppressHydrationWarning
                    className="text-caption whitespace-nowrap text-muted-foreground"
                  >
                    {r.lastArea ? `${activityLabel(r.lastAction, r.lastArea)} · ` : ""}
                    {daysAgoLabel(r.lastActiveAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          {(hidden > 0 || expanded) && filtered.length > PREVIEW && (
            <div className="border-t border-border px-5 py-3">
              <Button variant="ghost" size="sm" onClick={() => setExpanded((e) => !e)}>
                {expanded ? "Kamroq koʻrsatish" : `Yana ${hidden} tasini koʻrsatish`}
              </Button>
            </div>
          )}
        </PanelBody>
      )}
    </Panel>
  );
}
