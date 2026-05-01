export type ClassColor =
  | "red"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "green"
  | "emerald"
  | "teal"
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "fuchsia"
  | "pink"
  | "rose"
  | "gray";

export const CLASS_COLORS: ClassColor[] = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
];

type ColorTokens = {
  gradient: string;
  iconBg: string;
  iconText: string;
  badgeBg: string;
  badgeText: string;
  ring: string;
  dot: string;
};

export const CLASS_COLOR_TOKENS: Record<ClassColor, ColorTokens> = {
  red: {
    gradient: "from-red-100 via-red-50 to-red-100/40",
    iconBg: "bg-red-200/70",
    iconText: "text-red-600",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
    ring: "ring-red-200",
    dot: "bg-red-400",
  },
  orange: {
    gradient: "from-orange-100 via-orange-50 to-orange-100/40",
    iconBg: "bg-orange-200/70",
    iconText: "text-orange-600",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-700",
    ring: "ring-orange-200",
    dot: "bg-orange-400",
  },
  amber: {
    gradient: "from-amber-100 via-amber-50 to-amber-100/40",
    iconBg: "bg-amber-200/70",
    iconText: "text-amber-600",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
    ring: "ring-amber-200",
    dot: "bg-amber-400",
  },
  yellow: {
    gradient: "from-yellow-100 via-yellow-50 to-yellow-100/40",
    iconBg: "bg-yellow-200/70",
    iconText: "text-yellow-600",
    badgeBg: "bg-yellow-100",
    badgeText: "text-yellow-700",
    ring: "ring-yellow-200",
    dot: "bg-yellow-400",
  },
  lime: {
    gradient: "from-lime-100 via-lime-50 to-lime-100/40",
    iconBg: "bg-lime-200/70",
    iconText: "text-lime-600",
    badgeBg: "bg-lime-100",
    badgeText: "text-lime-700",
    ring: "ring-lime-200",
    dot: "bg-lime-400",
  },
  green: {
    gradient: "from-green-100 via-green-50 to-green-100/40",
    iconBg: "bg-green-200/70",
    iconText: "text-green-600",
    badgeBg: "bg-green-100",
    badgeText: "text-green-700",
    ring: "ring-green-200",
    dot: "bg-green-400",
  },
  emerald: {
    gradient: "from-emerald-100 via-emerald-50 to-emerald-100/40",
    iconBg: "bg-emerald-200/70",
    iconText: "text-emerald-600",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
    ring: "ring-emerald-200",
    dot: "bg-emerald-400",
  },
  teal: {
    gradient: "from-teal-100 via-teal-50 to-teal-100/40",
    iconBg: "bg-teal-200/70",
    iconText: "text-teal-600",
    badgeBg: "bg-teal-100",
    badgeText: "text-teal-700",
    ring: "ring-teal-200",
    dot: "bg-teal-400",
  },
  cyan: {
    gradient: "from-cyan-100 via-cyan-50 to-cyan-100/40",
    iconBg: "bg-cyan-200/70",
    iconText: "text-cyan-600",
    badgeBg: "bg-cyan-100",
    badgeText: "text-cyan-700",
    ring: "ring-cyan-200",
    dot: "bg-cyan-400",
  },
  sky: {
    gradient: "from-sky-100 via-sky-50 to-sky-100/40",
    iconBg: "bg-sky-200/70",
    iconText: "text-sky-600",
    badgeBg: "bg-sky-100",
    badgeText: "text-sky-700",
    ring: "ring-sky-200",
    dot: "bg-sky-400",
  },
  blue: {
    gradient: "from-blue-100 via-blue-50 to-blue-100/40",
    iconBg: "bg-blue-200/70",
    iconText: "text-blue-600",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    ring: "ring-blue-200",
    dot: "bg-blue-400",
  },
  indigo: {
    gradient: "from-indigo-100 via-indigo-50 to-indigo-100/40",
    iconBg: "bg-indigo-200/70",
    iconText: "text-indigo-600",
    badgeBg: "bg-indigo-100",
    badgeText: "text-indigo-700",
    ring: "ring-indigo-200",
    dot: "bg-indigo-400",
  },
  violet: {
    gradient: "from-violet-100 via-violet-50 to-violet-100/40",
    iconBg: "bg-violet-200/70",
    iconText: "text-violet-600",
    badgeBg: "bg-violet-100",
    badgeText: "text-violet-700",
    ring: "ring-violet-200",
    dot: "bg-violet-400",
  },
  purple: {
    gradient: "from-purple-100 via-purple-50 to-purple-100/40",
    iconBg: "bg-purple-200/70",
    iconText: "text-purple-600",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-700",
    ring: "ring-purple-200",
    dot: "bg-purple-400",
  },
  fuchsia: {
    gradient: "from-fuchsia-100 via-fuchsia-50 to-fuchsia-100/40",
    iconBg: "bg-fuchsia-200/70",
    iconText: "text-fuchsia-600",
    badgeBg: "bg-fuchsia-100",
    badgeText: "text-fuchsia-700",
    ring: "ring-fuchsia-200",
    dot: "bg-fuchsia-400",
  },
  pink: {
    gradient: "from-pink-100 via-pink-50 to-pink-100/40",
    iconBg: "bg-pink-200/70",
    iconText: "text-pink-600",
    badgeBg: "bg-pink-100",
    badgeText: "text-pink-700",
    ring: "ring-pink-200",
    dot: "bg-pink-400",
  },
  rose: {
    gradient: "from-rose-100 via-rose-50 to-rose-100/40",
    iconBg: "bg-rose-200/70",
    iconText: "text-rose-600",
    badgeBg: "bg-rose-100",
    badgeText: "text-rose-700",
    ring: "ring-rose-200",
    dot: "bg-rose-400",
  },
  gray: {
    gradient: "from-gray-100 via-gray-50 to-gray-100/40",
    iconBg: "bg-gray-200/70",
    iconText: "text-gray-500",
    badgeBg: "bg-gray-100",
    badgeText: "text-gray-500",
    ring: "ring-gray-200",
    dot: "bg-gray-400",
  },
};

export function autoClassColor(seed: number | string): ClassColor {
  const n =
    typeof seed === "number"
      ? seed
      : Array.from(seed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return CLASS_COLORS[Math.abs(n) % CLASS_COLORS.length];
}

export function classTokens(color: ClassColor) {
  return CLASS_COLOR_TOKENS[color];
}

/** Tailwind 400 hex values for inline styles */
export const CLASS_COLOR_HEX: Record<ClassColor, string> = {
  red:     "#F87171",
  orange:  "#FB923C",
  amber:   "#FBBF24",
  yellow:  "#FACC15",
  lime:    "#A3E635",
  green:   "#4ADE80",
  emerald: "#34D399",
  teal:    "#2DD4BF",
  cyan:    "#22D3EE",
  sky:     "#38BDF8",
  blue:    "#60A5FA",
  indigo:  "#818CF8",
  violet:  "#A78BFA",
  purple:  "#C084FC",
  fuchsia: "#E879F9",
  pink:    "#F472B6",
  rose:    "#FB7185",
  gray:    "#9CA3AF",
};
