export interface ImperialRank {
  label: string
  textClass: string
  bgClass: string
  borderClass: string
  glowStyle: string
  icon: string
  min: number
  max: number | null
  nextLabel?: string
}

export const IMPERIAL_RANKS: ImperialRank[] = [
  {
    label: "Cadete Imperial",
    textClass: "text-muted-foreground",
    bgClass: "bg-muted/30",
    borderClass: "border-muted-foreground/30",
    glowStyle: "",
    icon: "◈",
    min: 0,
    max: 2,
    nextLabel: "Sargento",
  },
  {
    label: "Sargento",
    textClass: "text-foreground",
    bgClass: "bg-foreground/10",
    borderClass: "border-foreground/30",
    glowStyle: "",
    icon: "◉",
    min: 3,
    max: 5,
    nextLabel: "Teniente",
  },
  {
    label: "Teniente",
    textClass: "text-primary",
    bgClass: "bg-primary/15",
    borderClass: "border-primary/40",
    glowStyle: "0 0 12px oklch(0.7 0.22 310 / 0.4)",
    icon: "◈",
    min: 6,
    max: 8,
    nextLabel: "Comandante",
  },
  {
    label: "Comandante",
    textClass: "text-glow-red",
    bgClass: "bg-glow-red/15",
    borderClass: "border-glow-red/40",
    glowStyle: "0 0 16px oklch(0.65 0.28 25 / 0.5)",
    icon: "⬡",
    min: 9,
    max: 11,
    nextLabel: "Gran Almirante",
  },
  {
    label: "Gran Almirante",
    textClass: "text-yellow-400",
    bgClass: "bg-yellow-400/15",
    borderClass: "border-yellow-400/40",
    glowStyle: "0 0 20px rgba(212,175,55,0.5)",
    icon: "✦",
    min: 12,
    max: null,
  },
]

export function getImperialRank(completedMissions: number): ImperialRank {
  for (let i = IMPERIAL_RANKS.length - 1; i >= 0; i--) {
    if (completedMissions >= IMPERIAL_RANKS[i].min) return IMPERIAL_RANKS[i]
  }
  return IMPERIAL_RANKS[0]
}

export function getRankProgress(completedMissions: number, rank: ImperialRank): number {
  if (rank.max === null) return 100
  const range = rank.max + 1 - rank.min
  return Math.min(100, Math.round(((completedMissions - rank.min) / range) * 100))
}
