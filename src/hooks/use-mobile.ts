import * as React from "react"

/** Tailwind breakpoint qiymatlari (px) — `hideBelow` va `max-lg:` klasslari
    bilan YAGONA manba. JS tekshiruvi CSS bilan bir xil chegarada boʻlishi
    shart: aks holda 768–1023px oraligʻida ustun CSS bilan yashirilib,
    mobil muqobili esa hali yoqilmagan "oʻlik zona" paydo boʻladi. */
const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280 } as const

export type Breakpoint = keyof typeof BREAKPOINTS

const MOBILE_BREAKPOINT = BREAKPOINTS.md

/**
 * Viewport berilgan breakpoint'dan tormi.
 *
 * ⚠️ SSR'da va birinchi klient renderida DOIM `false` (desktop) qaytadi —
 * haqiqiy qiymat effektда aniqlanadi. Bu ataylab: server kenglikni bilmaydi,
 * shuning uchun hydratsiya mosligini saqlash uchun ikkala tomon bir xil
 * "desktop" faraz bilan boshlaydi. Natijada telefonda bir kadr desktop maketi
 * koʻrinishi mumkin — `Sidebar` allaqachon shu naqshda ishlaydi.
 */
export function useIsBelow(breakpoint: Breakpoint): boolean {
  const px = BREAKPOINTS[breakpoint]
  const [below, setBelow] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${px - 1}px)`)
    const onChange = () => setBelow(mql.matches)
    onChange()
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [px])

  return below
}

/** `useIsBelow("md")` uchun nom — sidebar va mavjud chaqiruvchilar shu nomda. */
export function useIsMobile() {
  return useIsBelow("md")
}

export { MOBILE_BREAKPOINT }
