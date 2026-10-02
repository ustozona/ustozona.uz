"use client";

import * as React from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ExternalLink, Globe, Plus, Trash2 } from "lucide-react";
import { Panel, PanelBody, PanelFooter } from "@/components/ui/panel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { saveStudioSitesAction } from "@/server/actions/admin/settings";
import {
  externalSearchUrl,
  externalSiteProblem,
  MAX_EXTERNAL_SITES,
  type ExternalSite,
} from "@/lib/studio-advice";
import { AdminPanelHeader } from "../../_components/AdminPanelHeader";

/* ════════════════════════════════════════════════════════════════════
   DARS STUDIYASI — TASHQI SAYTLAR

   Studiyaning «Tavsiyalar» ustunida Ustozona-Games mos oʻyin topmasa,
   shu saytlarda dars mavzusi boʻyicha qidiruv havolasi koʻrsatiladi.
   Qolip — saytning qidiruv manzili, mavzu oʻrniga `{q}`.

   «Sinash» — qolipni namunaviy mavzu bilan yangi tabda ochadi: qidiruv
   haqiqatan ishlashini saqlashdan oldin koʻrish uchun.
   ════════════════════════════════════════════════════════════════════ */

type Row = ExternalSite & { id: number };

const SOURCE_LABEL: Record<"db" | "env" | "none", string> = {
  db: "Bazada saqlangan",
  env: "Muhit sozlamasidan (hali saqlanmagan)",
  none: "Roʻyxat boʻsh",
};

const PROBLEM: Record<"name" | "query" | "url", string> = {
  name: "Nom kiritilmagan",
  query: "Qolipda {q} yoʻq — mavzu qayerga qoʻyilishi kerak",
  url: "Manzil https:// bilan boshlanishi kerak",
};

const SAMPLE_TOPIC = "fractions";

export default function StudioSitesForm({
  initial,
  source,
  updatedAt,
}: {
  initial: ExternalSite[];
  source: "db" | "env" | "none";
  updatedAt: string | null;
}) {
  const nextId = React.useRef(initial.length);
  const [rows, setRows] = React.useState<Row[]>(() => initial.map((s, i) => ({ ...s, id: i })));
  const [saving, startSaving] = React.useTransition();
  const [dirty, setDirty] = React.useState(false);

  const edit = (next: Row[]) => {
    setRows(next);
    setDirty(true);
  };
  const patch = (id: number, p: Partial<ExternalSite>) => edit(rows.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const move = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= rows.length) return;
    const next = [...rows];
    [next[index], next[to]] = [next[to], next[index]];
    edit(next);
  };
  const add = () => edit([...rows, { id: nextId.current++, name: "", search: "https://" }]);

  const save = () =>
    startSaving(async () => {
      const res = await saveStudioSitesAction(rows.map(({ name, search }) => ({ name, search })));
      if (res.ok) {
        setRows(res.sites.map((s) => ({ ...s, id: nextId.current++ })));
        setDirty(false);
        toast.success("Saqlandi — studiyada darhol koʻrinadi");
      } else if (res.index >= 0) {
        toast.error(`${res.index + 1}-qator: ${PROBLEM[res.reason as keyof typeof PROBLEM] ?? "notoʻgʻri"}`);
      } else {
        toast.error("Roʻyxat notoʻgʻri — nom 40, manzil 500 belgigacha");
      }
    });

  return (
    <Panel>
      <AdminPanelHeader
        icon={<Globe />}
        title="Dars studiyasi — tashqi saytlar"
        count={`${rows.length} / ${MAX_EXTERNAL_SITES}`}
        description="Ustozona-Games mos oʻyin topmasa, studiya shu saytlarda dars mavzusini qidirishni taklif qiladi"
      />
      <PanelBody inset className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
          <Badge size="sm" variant={source === "db" ? "default" : "secondary"}>
            {SOURCE_LABEL[source]}
          </Badge>
          {updatedAt && <span>Oxirgi oʻzgarish: {new Date(updatedAt).toLocaleString("uz-UZ")}</span>}
        </div>
        <p className="text-sm text-muted-foreground">
          Qidiruv qolipi — sayt qidiruvining manzili, mavzu oʻrniga <code className="font-mono">{"{q}"}</code>{" "}
          yozing. «Sinash» qolipni namunaviy mavzu bilan ochadi.
        </p>

        {rows.length === 0 && (
          <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Roʻyxat boʻsh — studiya faqat Ustozona-Games oʻyinlarini taklif qiladi.
          </p>
        )}

        {rows.map((r, i) => {
          const problem = externalSiteProblem(r.name, r.search);
          return (
            <div key={r.id} className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-start">
              <span className="w-6 pt-2 text-caption tabular-nums text-muted-foreground">{i + 1}.</span>
              <div className="flex min-w-0 flex-1 flex-col gap-2 md:flex-row">
                <Input
                  aria-label="Sayt nomi"
                  placeholder="Sayt nomi"
                  maxLength={40}
                  value={r.name}
                  onChange={(e) => patch(r.id, { name: e.target.value })}
                  className="md:w-48"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Input
                    aria-label="Qidiruv qolipi"
                    placeholder="https://…/search?q={q}"
                    maxLength={500}
                    value={r.search}
                    onChange={(e) => patch(r.id, { search: e.target.value })}
                    aria-invalid={!!problem}
                    className="font-mono text-xs"
                  />
                  {problem && <span className="text-caption text-destructive">{PROBLEM[problem]}</span>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Sinash"
                  title="Sinash"
                  disabled={!!problem}
                  onClick={() =>
                    window.open(externalSearchUrl(r, SAMPLE_TOPIC), "_blank", "noopener,noreferrer")
                  }
                >
                  <ExternalLink />
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label="Yuqoriga" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Pastga"
                  disabled={i === rows.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Oʻchirish"
                  onClick={() => edit(rows.filter((x) => x.id !== r.id))}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          );
        })}
      </PanelBody>
      <PanelFooter className="justify-between gap-2">
        <Button type="button" variant="outline" onClick={add} disabled={rows.length >= MAX_EXTERNAL_SITES}>
          <Plus /> Sayt qoʻshish
        </Button>
        <Button type="button" onClick={save} disabled={saving || (!dirty && source === "db")}>
          {saving ? "Saqlanmoqda…" : "Saqlash"}
        </Button>
      </PanelFooter>
    </Panel>
  );
}
