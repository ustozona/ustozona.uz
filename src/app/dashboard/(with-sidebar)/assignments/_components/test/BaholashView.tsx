"use client";

import { useEffect, useState, useTransition } from "react";
import { Layers, Pencil, Plus, Trash2, Users } from "lucide-react";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { deleteSetAction, listSetsAction } from "@/server/actions/assess";
import type { ActivitySetRow } from "@/server/db/schema";
import SetBuilderOverlay from "./SetBuilderOverlay";
import SessionPanelModal from "./SessionPanelModal";

/* Sinfning testlari — kirish nuqtasi. Savollar alohida roʻyxat emas:
   ular toʻplam ichida yashaydi va SetBuilderOverlay'da tahrirlanadi. */

type Props = {
  classId: string;
  className: string;
  /** Topshiriqlar → "Test" tanlanganda darhol yangi test muharririni ochadi. */
  autoOpenNewSet?: boolean;
  /** Mavjud topshiriqdan "Ochish" — oʻsha toʻplamning sessiya panelini ochadi. */
  autoOpenSetId?: string;
  /** `autoOpenNewSet` bilan birga — yangi testning boshlangʻich nomi
      (topshiriq nomi bilan bir xil boʻlishi uchun). */
  autoOpenTitle?: string;
};

type BuilderState = { setId?: string } | null;

export default function BaholashView({
  classId,
  className,
  autoOpenNewSet,
  autoOpenSetId,
  autoOpenTitle,
}: Props) {
  const [sets, setSets] = useState<ActivitySetRow[]>([]);
  const [builder, setBuilder] = useState<BuilderState>(autoOpenNewSet ? {} : null);
  const [sessionPanelSet, setSessionPanelSet] = useState<ActivitySetRow | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    listSetsAction(classId).then(setSets);
  }, [classId]);

  useEffect(() => {
    if (!autoOpenSetId) return;
    const target = sets.find((s) => s.id === autoOpenSetId);
    if (target) setSessionPanelSet(target);
  }, [sets, autoOpenSetId]);

  function handleSaved(saved: ActivitySetRow) {
    setSets((prev) =>
      prev.some((s) => s.id === saved.id)
        ? prev.map((s) => (s.id === saved.id ? saved : s))
        : [saved, ...prev]
    );
  }

  function handleDelete(id: string) {
    if (!confirm("Testni oʻchirishga ishonchingiz komilmi?")) return;
    startTransition(async () => {
      await deleteSetAction(id);
      setSets((prev) => prev.filter((s) => s.id !== id));
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 md:p-6">
      <Panel>
        <PanelHeader
          title={className ? `Testlar (${className})` : "Testlar"}
          count={sets.length}
          actions={
            <Button size="sm" onClick={() => setBuilder({})}>
              <Plus className="size-4" /> Yangi test
            </Button>
          }
        />
        <PanelBody inset={sets.length === 0}>
          {sets.length === 0 ? (
            <Empty className="h-full border-0">
              <EmptyHeader>
                <EmptyMedia>
                  <Illustration name="2" className="h-32 text-black dark:text-white" />
                </EmptyMedia>
                <EmptyTitle>Hali test yoʻq</EmptyTitle>
                <EmptyDescription>
                  Birinchi testni yarating — savollar shu testning ichida tahrirlanadi va
                  jonli kviz yoki uy vazifasi sifatida ishlatiladi.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="divide-y divide-border">
              {sets.map((set) => (
                <li key={set.id} className="flex items-center gap-3 px-5 py-3">
                  <Layers className="size-4 shrink-0 text-muted-foreground" />
                  <button
                    type="button"
                    onClick={() => setBuilder({ setId: set.id })}
                    className="min-w-0 flex-1 truncate text-left text-sm hover:underline"
                  >
                    {set.title}
                  </button>
                  <Badge variant="outline" className="shrink-0 text-[10px] text-muted-foreground">
                    {set.purpose === "summative" ? "Summativ" : "Formativ"}
                  </Badge>
                  <Badge variant="outline" className="shrink-0 text-[10px] text-muted-foreground">
                    {set.items.length} savol
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Tahrirlash"
                    onClick={() => setBuilder({ setId: set.id })}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSessionPanelSet(set)}>
                    <Users className="size-3.5" /> Sessiya
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Oʻchirish"
                    disabled={isPending}
                    onClick={() => handleDelete(set.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </PanelBody>
      </Panel>

      {builder && (
        <SetBuilderOverlay
          classId={classId}
          className={className}
          setId={builder.setId}
          initialTitle={builder.setId ? undefined : autoOpenTitle}
          onClose={() => setBuilder(null)}
          onSaved={handleSaved}
        />
      )}

      {sessionPanelSet && (
        <SessionPanelModal set={sessionPanelSet} onClose={() => setSessionPanelSet(null)} />
      )}
    </div>
  );
}
