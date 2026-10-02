"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CheckCircle2, ExternalLink, FileCheck2, Library, Lightbulb, Link2, Loader2, PenLine, Play, Search, Sparkles, Unlink,
  Timer, Users, Disc3, Volume2, Wand2, CircleSlash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Panel, PanelBody, PanelFooter, PanelHeader } from "@/components/ui/panel";
import { classTints } from "@/lib/class-colors";
import { findShell, shellAvailability } from "@/lib/baholash-shells";
import type { ClassEnvironment } from "@/lib/lesson-models";
import type { LaunchSetInfo } from "@/lib/launch-types";
import {
  blockReady, safeHttpUrl, type LessonStudio, type StudioBlock, type StudioGame,
} from "@/lib/lesson-studio";
import {
  adviseGames, adviseMethods, externalSearchUrl, type AdviceFit, type AdviceReason, type ExternalSite, type ShellFit,
} from "@/lib/studio-advice";
import { studioExternalSitesAction } from "@/server/actions/studio-sites";
import { BLOCK_META, METHOD_META } from "./studio-meta";
import { EnvSummary } from "./ClassEnvDialog";

/* ════════════════════════════════════════════════════════════════════
   3-USTUN — TAVSIYALAR va tanlangan blok sozlamasi.

   Tartib (loyiha egasining talabi): avval Ustozona ichidagi va natijasi
   jurnalga tushadigan yoʻl, keyin Ustozona-Games mashq oʻyinlari, oxirida
   tashqi saytlar. Har tavsiyada sabab — «nega aynan shu» yoki «nima
   yetishmayapti» (`lib/studio-advice.ts`).
   ════════════════════════════════════════════════════════════════════ */

const NEEDS_SET = new Set<StudioBlock["kind"]>(["warmup", "explain", "check", "exit", "homework"]);

/** Oʻyin nomi — blok kartasi va tavsiyada bir xil. */
export function useGameLabel() {
  const t = useTranslations("LessonStudio");
  return useCallback(
    (g: StudioGame) =>
      g.type === "shell" ? t(`game.${g.id}`) : g.type === "practice" ? t(`game.${g.file}`) : g.label,
    [t],
  );
}

function FitBadge({ fit }: { fit: AdviceFit }) {
  const t = useTranslations("LessonStudio");
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-tag font-medium",
        fit === "best" && "bg-success/10 text-success",
        fit === "ok" && "bg-muted text-muted-foreground",
        fit === "blocked" && "bg-muted text-muted-foreground line-through",
      )}
    >
      {t(`fit.${fit}`)}
    </span>
  );
}

function AdviceRow({
  icon: Icon,
  color,
  title,
  fit,
  reasons,
  selected,
  onPick,
}: {
  icon: typeof Play;
  color: Parameters<typeof classTints>[0];
  title: string;
  fit: AdviceFit;
  reasons: AdviceReason[];
  selected: boolean;
  onPick: () => void;
}) {
  const t = useTranslations("LessonStudio");
  const tints = classTints(color);
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={fit === "blocked"}
      onClick={onPick}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
        selected ? "border-foreground/40 bg-muted/50" : "border-border hover:bg-muted/40",
        fit === "blocked" && "cursor-not-allowed opacity-60 hover:bg-transparent",
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg" style={tints.gradientTile}>
        <Icon className="size-4 text-white" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{title}</span>
          {selected ? <CheckCircle2 className="size-4 shrink-0 text-success" /> : <FitBadge fit={fit} />}
        </span>
        <span className="text-caption text-muted-foreground">{reasons.map((r) => t(`reason.${r}`)).join(" · ")}</span>
      </span>
    </button>
  );
}

const DOSKA_TOOLS = [
  { key: "timer", icon: Timer },
  { key: "groups", icon: Users },
  { key: "wheel", icon: Disc3 },
  { key: "noise", icon: Volume2 },
] as const;

export function StudioAdviceColumn({
  studio,
  block,
  env,
  envDefault,
  subject,
  topic,
  setInfo,
  checkSet,
  busy,
  onUpdate,
  onGenerate,
  onTemplate,
  onAttach,
  onOpenSet,
  onRun,
  onOpenEnv,
  onOpenUrl,
}: {
  studio: LessonStudio | null;
  block: StudioBlock | null;
  env: ClassEnvironment;
  envDefault: boolean;
  subject: string;
  topic: string;
  setInfo: LaunchSetInfo | null;
  checkSet: { id: string; title: string } | null;
  busy: boolean;
  onUpdate: (blockId: string, patch: Partial<StudioBlock>) => void;
  onGenerate: (block: StudioBlock) => void;
  onTemplate: (block: StudioBlock) => void;
  onAttach: (block: StudioBlock) => void;
  onOpenSet: (block: StudioBlock) => void;
  onRun: (block: StudioBlock) => void;
  onOpenEnv: () => void;
  onOpenUrl: (url: string) => void;
}) {
  const t = useTranslations("LessonStudio");
  const gameLabel = useGameLabel();
  const [sites, setSites] = useState<ExternalSite[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");

  useEffect(() => {
    let alive = true;
    studioExternalSitesAction()
      .then((list) => alive && setSites(list))
      .catch(() => {
        /* tashqi saytlar ixtiyoriy — kelmasa boʻlim chiqmaydi */
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    setLinkUrl("");
    setLinkLabel("");
  }, [block?.id]);

  const header = <PanelHeader icon={<Lightbulb />} title={t("advice.title")} />;

  if (!studio || !block) {
    return (
      <Panel className="flex min-h-[40svh] flex-col lg:h-full lg:min-h-0">
        {header}
        <PanelBody inset className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          <EnvSummary env={env} isDefault={envDefault} onEdit={onOpenEnv} />
          <p className="text-caption text-muted-foreground">{studio ? t("advice.pickBlock") : t("advice.intro")}</p>
          <ol className="flex flex-col gap-2">
            {(["layer1", "layer2", "layer3"] as const).map((k, i) => (
              <li key={k} className="flex gap-3 text-caption text-muted-foreground">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">{i + 1}</span>
                {t(`advice.${k}`)}
              </li>
            ))}
          </ol>
        </PanelBody>
      </Panel>
    );
  }

  const meta = BLOCK_META[block.kind];
  const KindIcon = meta.icon;
  const ready = blockReady(block);
  const shellFit: ShellFit = {
    arqon: setInfo ? (shellAvailability(findShell("arqon")!, setInfo.content).ok ? true : reasonOf("arqon", setInfo)) : null,
    poyga: setInfo ? (shellAvailability(findShell("poyga")!, setInfo.content).ok ? true : reasonOf("poyga", setInfo)) : null,
  };
  const needsSet = NEEDS_SET.has(block.kind) || (block.kind === "game" && block.game?.type === "shell");

  return (
    <Panel className="flex min-h-[60svh] flex-col lg:h-full lg:min-h-0">
      <PanelHeader
        icon={<KindIcon />}
        title={t(`kind.${block.kind}`)}
        description={t(`kindHint.${block.kind}`)}
      />
      <PanelBody inset className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
        {/* Blok matni — oʻqituvchi yoʻriqnomasi */}
        <section className="flex flex-col gap-2">
          <Input
            key={`${block.id}-title`}
            defaultValue={block.title ?? ""}
            placeholder={t(`kind.${block.kind}`)}
            maxLength={120}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v !== (block.title ?? "")) onUpdate(block.id, { title: v || undefined });
            }}
          />
          <Textarea
            key={`${block.id}-brief`}
            defaultValue={block.brief ?? ""}
            placeholder={t("advice.briefPlaceholder")}
            rows={3}
            maxLength={600}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v !== (block.brief ?? "")) onUpdate(block.id, { brief: v || undefined });
            }}
          />
        </section>

        {/* Material */}
        {needsSet && (
          <section className="flex flex-col gap-2">
            <span className="text-label text-muted-foreground">{t("advice.material")}</span>
            {block.setId ? (
              <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <FileCheck2 className="size-4 shrink-0 text-success" />
                  <span className="min-w-0 truncate">{block.setTitle || t("advice.materialReady")}</span>
                </span>
                {setInfo && (
                  <span className="text-caption text-muted-foreground">
                    {t("advice.setStats", { items: setInfo.itemCount, mcq: setInfo.mcqCount })}
                  </span>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 shadow-none" onClick={() => onOpenSet(block)}>
                    <PenLine className="size-3.5" /> {t("advice.openSet")}
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => onAttach(block)}>
                    <Library className="size-3.5" /> {t("advice.replaceSet")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground"
                    onClick={() => onUpdate(block.id, { setId: null, setTitle: undefined })}
                  >
                    <Unlink className="size-3.5" /> {t("advice.unlinkSet")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {block.kind === "game" && checkSet && (
                  <Button
                    variant="outline"
                    className="justify-start gap-2 shadow-none"
                    onClick={() => onUpdate(block.id, { setId: checkSet.id, setTitle: checkSet.title })}
                  >
                    <FileCheck2 className="size-4" /> {t("advice.useCheckSet")}
                  </Button>
                )}
                {(block.kind === "warmup" || block.kind === "exit") && (
                  <Button variant="outline" className="justify-start gap-2 shadow-none" onClick={() => onTemplate(block)}>
                    <Wand2 className="size-4" /> {t("advice.template")}
                  </Button>
                )}
                {block.kind !== "warmup" && block.kind !== "exit" && (
                  <Button className="justify-start gap-2" disabled={busy} onClick={() => onGenerate(block)}>
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    {busy ? t("advice.generating") : t(`advice.ai.${block.kind === "explain" ? "slides" : block.kind === "check" ? "check" : "test"}`)}
                  </Button>
                )}
                <Button variant="outline" className="justify-start gap-2 shadow-none" onClick={() => onAttach(block)}>
                  <Library className="size-4" /> {t("advice.attach")}
                </Button>
              </div>
            )}
          </section>
        )}

        {/* Tekshirish usuli */}
        {block.kind === "check" && (
          <section className="flex flex-col gap-2" role="radiogroup" aria-label={t("advice.method")}>
            <span className="text-label text-muted-foreground">{t("advice.method")}</span>
            {adviseMethods(env, setInfo ? setInfo.mcqCount : null).map((a) => (
              <AdviceRow
                key={a.method}
                icon={METHOD_META[a.method].icon}
                color={METHOD_META[a.method].color}
                title={t(`method.${a.method}`)}
                fit={a.fit}
                reasons={a.reasons}
                selected={block.method === a.method}
                onPick={() => onUpdate(block.id, { method: a.method })}
              />
            ))}
            {envDefault && <EnvSummary env={env} isDefault onEdit={onOpenEnv} />}
          </section>
        )}

        {/* Oʻyin */}
        {block.kind === "game" && (
          <>
            <section className="flex flex-col gap-2" role="radiogroup" aria-label={t("advice.games")}>
              <span className="text-label text-muted-foreground">{t("advice.games")}</span>
              {adviseGames(env, { subject, shellFit }).map((a) => {
                const key = a.game.type === "shell" ? a.game.id : a.game.type === "practice" ? a.game.file : "link";
                const selected =
                  !!block.game &&
                  ((block.game.type === "shell" && a.game.type === "shell" && block.game.id === a.game.id) ||
                    (block.game.type === "practice" && a.game.type === "practice" && block.game.file === a.game.file));
                return (
                  <AdviceRow
                    key={key}
                    icon={BLOCK_META.game.icon}
                    color={a.game.type === "shell" ? "orange" : "amber"}
                    title={gameLabel(a.game)}
                    fit={a.fit}
                    reasons={a.reasons}
                    selected={selected}
                    onPick={() => onUpdate(block.id, { game: a.game })}
                  />
                );
              })}
              {block.game?.type === "shell" && typeof shellFit[block.game.id] === "string" && (
                <p className="text-caption text-warning">{shellFit[block.game.id] as string}</p>
              )}
            </section>

            <section className="flex flex-col gap-2">
              <span className="text-label text-muted-foreground">{t("advice.external")}</span>
              {!env.internet ? (
                <p className="text-caption text-muted-foreground">{t("reason.noInternet")}</p>
              ) : (
                <>
                  {sites.map((site) => (
                    <button
                      key={site.name}
                      type="button"
                      onClick={() => onOpenUrl(externalSearchUrl(site, topic))}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/40"
                    >
                      <Search className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{t("advice.searchOn", { site: site.name })}</span>
                      <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                  {block.game?.type === "link" && (
                    <div className="flex items-center gap-2 rounded-lg border border-foreground/40 bg-muted/50 p-3">
                      <Link2 className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{block.game.label}</span>
                      <CheckCircle2 className="size-4 shrink-0 text-success" />
                    </div>
                  )}
                  <form
                    className="flex flex-col gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const url = safeHttpUrl(linkUrl);
                      if (!url) return;
                      onUpdate(block.id, {
                        game: { type: "link", url, label: linkLabel.trim() || new URL(url).hostname },
                      });
                      setLinkUrl("");
                      setLinkLabel("");
                    }}
                  >
                    <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder={t("advice.linkUrl")} inputMode="url" />
                    <div className="flex gap-2">
                      <Input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder={t("advice.linkLabel")} maxLength={80} />
                      <Button type="submit" variant="outline" className="shrink-0 shadow-none" disabled={!safeHttpUrl(linkUrl)}>
                        {t("advice.linkAdd")}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </section>
          </>
        )}

        {/* Faoliyat — Doska vositalari */}
        {block.kind === "activity" && (
          <section className="flex flex-col gap-2">
            <span className="text-label text-muted-foreground">{t("advice.doskaTools")}</span>
            {env.smartboard || env.projector ? (
              <div className="grid grid-cols-2 gap-2">
                {DOSKA_TOOLS.map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onOpenUrl("/doska")}
                    className="flex items-center gap-2 rounded-lg border border-border p-3 text-left text-sm text-foreground transition-colors hover:bg-muted/40"
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" /> {t(`tool.${key}`)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="flex gap-2 text-caption text-muted-foreground">
                <CircleSlash className="mt-0.5 size-3.5 shrink-0" /> {t("advice.noScreenActivity")}
              </p>
            )}
            <p className="text-caption text-muted-foreground">{t("advice.activityHint")}</p>
          </section>
        )}

        {block.kind === "homework" && (
          <p className="rounded-lg bg-muted/50 px-3 py-2 text-caption text-muted-foreground">{t("advice.homeworkHint")}</p>
        )}
      </PanelBody>
      <PanelFooter>
        <Button className="w-full gap-1.5" disabled={!ready} onClick={() => onRun(block)}>
          <Play className="size-4" /> {block.kind === "homework" ? t("advice.giveHomework") : t("flow.runNow")}
        </Button>
      </PanelFooter>
    </Panel>
  );
}

/** Qobiq mos kelmasa — sabab matni (`shellAvailability` dan). */
function reasonOf(id: "arqon" | "poyga", info: LaunchSetInfo): string {
  const r = shellAvailability(findShell(id)!, info.content);
  return r.ok ? "" : r.reason;
}
