import * as React from "react"

import { cn } from "@/lib/utils"
import { SectionIcon } from "@/components/ui/section-icon"
import { CardTitle } from "@/components/ui/card"
import { TypographyMuted } from "@/components/ui/typography"

/**
 * Ustozona panel tili v1 — bitta yuza tili: `border` (chegara), soya YOʻQ.
 * Soya faqat koʻtarilgan qatlamlarga (modal, dropdown, drag) tegishli.
 * Qiymatlar shu komponent ichida qotirilgan — sahifalarda qoʻlda klass
 * yozish oʻrniga faqat slotlar toʻldiriladi.
 */
function Panel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="panel"
      className={cn(
        // Shakl 3-qatlam tokenlaridan keladi (src/styles/components.css):
        // ost-loyiha panelni fork qilmasdan chegara/radiusni oʻzgartiradi.
        "flex h-full min-h-0 flex-col overflow-hidden rounded-card border-card border-border bg-card text-card-foreground shadow-card",
        className
      )}
      {...props}
    />
  )
}

type PanelHeaderProps = Omit<React.ComponentProps<"div">, "title"> & {
  icon?: React.ReactNode
  title?: React.ReactNode
  count?: React.ReactNode
  /** Markazga joylashtiriladigan ixtiyoriy element (masalan koʻrinish toggle). */
  center?: React.ReactNode
  /** Oʻngdagi amallar (qidiruv, sort, CTA). */
  actions?: React.ReactNode
  /**
   * Header ostidagi ajratuvchi chiziq. Default `true`. `false` qiling FAQAT
   * agar kontent header ostida bevosita davom etsa va oʻzining tabiiy
   * chegarasi bilan ajralib tursin (mas. taqvim tarmogʻi, jadval grid
   * chizigʻi) — bunda header'ning oʻz border-b'si ortiqcha ikkinchi
   * chiziq boʻlib koʻrinadi (namuna: `TodayRail`, `timetable/page.tsx`
   * jadval paneli).
   */
  divider?: boolean
}

function PanelHeader({
  icon,
  title,
  count,
  center,
  actions,
  divider = true,
  className,
  children,
  ...props
}: PanelHeaderProps) {
  return (
    <div
      data-slot="panel-header"
      className={cn(
        "grid min-h-16 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 py-4",
        divider && "border-b border-border",
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          <div className="flex min-w-0 items-center gap-2.5 justify-self-start">
            {icon && <SectionIcon className="shrink-0">{icon}</SectionIcon>}
            <div className="flex min-w-0 items-baseline gap-1.5">
              <CardTitle className="truncate">{title}</CardTitle>
              {count != null && (
                <TypographyMuted className="shrink-0 text-sm">{count}</TypographyMuted>
              )}
            </div>
          </div>
          <div className="justify-self-center">{center}</div>
          <div className="flex items-center gap-2 justify-self-end">{actions}</div>
        </>
      )}
    </div>
  )
}

/** `inset` — ichki boʻshliqli (forma/boʻsh holat); default — `p-0` + scroll (jadval/roʻyxat). */
function PanelBody({
  inset,
  className,
  ...props
}: React.ComponentProps<"div"> & { inset?: boolean }) {
  return (
    <div
      data-slot="panel-body"
      className={cn(
        "min-h-0 flex-1 overflow-y-auto",
        inset ? "px-5 py-5" : "p-0",
        className
      )}
      {...props}
    />
  )
}

function PanelFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="panel-footer"
      className={cn(
        "flex shrink-0 items-center border-t border-border bg-muted/20 px-5 py-4",
        className
      )}
      {...props}
    />
  )
}

export { Panel, PanelHeader, PanelBody, PanelFooter }
