"use client";

import { useTranslations } from "next-intl";
import {
  ArrowDown, ArrowUp, CheckCircle2, CircleDashed, ListOrdered, Loader2, MoreHorizontal, Play, Plus, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Panel, PanelBody, PanelFooter, PanelHeader } from "@/components/ui/panel";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { classTints } from "@/lib/class-colors";
import {
  STUDIO_BLOCK_KINDS, addBlock, blockReady, moveBlock, removeBlock, studioReadiness,
  type LessonStudio, type StudioBlock, type StudioEnvHint,
} from "@/lib/lesson-studio";
import { BLOCK_META, METHOD_META } from "./studio-meta";
import { useGameLabel } from "./StudioAdviceColumn";

/* ════════════════════════════════════════════════════════════════════
   2-USTUN — DARS SSENARIYSI.

   Reja bosqichlari boʻyicha bloklar: har blok — darsda bitta qadam
   (Doskada bitta ekran). Karta bosilsa oʻng ustunda shu blokning
   sozlamasi va tavsiyalari ochiladi; ▶ — shu blokni hozir oʻtkazish.

   Holat ochiq yoziladi: «Tayyor» yoki «Tayyorlash kerak». Oʻqituvchi
   darsdan oldin nima qolganini bir qarashda koʻrsin.
   ════════════════════════════════════════════════════════════════════ */

export function StudioFlowColumn({
  studio,
  selectedId,
  busyBlockId,
  env,
  onSelect,
  onChange,
  onRun,
  onStart,
}: {
  studio: LessonStudio | null;
  selectedId: string | null;
  busyBlockId: string | null;
  env: StudioEnvHint;
  onSelect: (id: string) => void;
  onChange: (next: LessonStudio) => void;
  onRun: (block: StudioBlock) => void;
  onStart: () => void;
}) {
  const t = useTranslations("LessonStudio");
  const gameLabel = useGameLabel();

  if (!studio) {
    return (
      <Panel className="flex min-h-[40svh] flex-col lg:h-full lg:min-h-0">
        <PanelHeader icon={<ListOrdered />} title={t("flow.title")} />
        <Empty className="flex-1 border-0">
          <EmptyHeader>
            <EmptyMedia><ListOrdered className="size-10 text-muted-foreground" /></EmptyMedia>
            <EmptyTitle>{t("flow.emptyTitle")}</EmptyTitle>
            <EmptyDescription>{t("flow.emptyDescription")}</EmptyDescription>
          </EmptyHeader>
          <ol className="mx-auto flex max-w-sm flex-col gap-2 text-left">
            {(["step1", "step2", "step3"] as const).map((k, i) => (
              <li key={k} className="flex gap-3 text-caption text-muted-foreground">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">{i + 1}</span>
                {t(`flow.${k}`)}
              </li>
            ))}
          </ol>
        </Empty>
      </Panel>
    );
  }

  const { ready, total } = studioReadiness(studio);

  return (
    <Panel className="flex min-h-[60svh] flex-col lg:h-full lg:min-h-0">
      <PanelHeader
        icon={<ListOrdered />}
        title={t("flow.title")}
        description={t("readiness", { ready, total })}
      />
      <PanelBody inset className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
        {studio.stages.map((stage, si) => (
          <section key={stage.id} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-label text-muted-foreground">
                {si + 1} · {stage.name}
              </span>
              <span className="text-caption tabular-nums text-muted-foreground">{t("minutes", { count: stage.minutes })}</span>
              <span className="flex-1" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-muted-foreground">
                    <Plus className="size-3.5" /> {t("flow.addBlock")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {STUDIO_BLOCK_KINDS.filter((k) => k !== "homework").map((kind) => {
                    const Icon = BLOCK_META[kind].icon;
                    return (
                      <DropdownMenuItem key={kind} className="gap-2" onSelect={() => onChange(addBlock(studio, stage.id, kind, env))}>
                        <Icon className="size-4" /> {t(`kind.${kind}`)}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {stage.blocks.length === 0 && (
              <p className="rounded-lg border border-dashed border-border px-3 py-2 text-caption text-muted-foreground">
                {t("flow.stageEmpty")}
              </p>
            )}
            {stage.blocks.map((block, bi) => {
              const meta = BLOCK_META[block.kind];
              const Icon = meta.icon;
              const tints = classTints(meta.color);
              const isReady = blockReady(block);
              const isSelected = block.id === selectedId;
              const busy = busyBlockId === block.id;
              const MethodIcon = block.method ? METHOD_META[block.method].icon : null;
              return (
                <div
                  key={block.id}
                  className={cn(
                    "list-card group flex items-start gap-2 pr-2",
                    isSelected && "border-foreground/40 bg-muted/40",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(block.id)}
                    aria-pressed={isSelected}
                    className="flex min-w-0 flex-1 items-start gap-3 py-3 pl-3 text-left"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg" style={tints.gradientTile}>
                      {busy ? <Loader2 className="size-4 animate-spin text-white" /> : <Icon className="size-4 text-white" />}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate text-sm font-medium text-foreground">{block.title || t(`kind.${block.kind}`)}</span>
                      {block.brief && <span className="line-clamp-2 text-caption text-muted-foreground">{block.brief}</span>}
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-tag font-medium",
                            isReady ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
                          )}
                        >
                          {isReady ? <CheckCircle2 className="size-3" /> : <CircleDashed className="size-3" />}
                          {isReady ? t("flow.ready") : t("flow.notReady")}
                        </span>
                        {MethodIcon && block.kind === "check" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-tag text-foreground">
                            <MethodIcon className="size-3" /> {t(`method.${block.method}`)}
                          </span>
                        )}
                        {block.kind === "game" && block.game && (
                          <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-muted px-2 py-0.5 text-tag text-foreground">
                            {gameLabel(block.game)}
                          </span>
                        )}
                        {block.setTitle && (
                          <span className="max-w-full truncate rounded-full bg-muted px-2 py-0.5 text-tag text-muted-foreground">
                            {block.setTitle}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                  <div className="flex shrink-0 items-center gap-1 pt-3">
                    {isReady && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground"
                        aria-label={t("flow.runNow")}
                        title={t("flow.runNow")}
                        onClick={() => onRun(block)}
                      >
                        <Play className="size-4" />
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label={t("flow.blockMenu")}>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2" disabled={bi === 0} onSelect={() => onChange(moveBlock(studio, block.id, -1))}>
                          <ArrowUp className="size-4" /> {t("flow.moveUp")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2"
                          disabled={bi === stage.blocks.length - 1}
                          onSelect={() => onChange(moveBlock(studio, block.id, 1))}
                        >
                          <ArrowDown className="size-4" /> {t("flow.moveDown")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" className="gap-2" onSelect={() => onChange(removeBlock(studio, block.id))}>
                          <Trash2 className="size-4" /> {t("flow.remove")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </section>
        ))}
      </PanelBody>
      <PanelFooter>
        <Button className="w-full gap-1.5" onClick={onStart}>
          <Play className="size-4" /> {t("startLesson")}
        </Button>
      </PanelFooter>
    </Panel>
  );
}
