"use client"

type Props = {
  name: string
  visits?: number
  image?: string
  emoji?: string
  description?: string
  color?: string
  rank?: number
}

const defaultColors: Record<string, string> = {
  Andrómeda: "from-primary/20 to-glow-magenta/10",
  Tatooine: "from-glow-red/20 to-accent/10",
  Kessel: "from-glow-cyan/20 to-primary/10",
  Hoth: "from-primary/20 to-glow-magenta/10",
  Dagobah: "from-accent/20 to-glow-green/10",
  Coruscant: "from-glow-red/20 to-glow-magenta/10",
}

const defaultEmojis: Record<string, string> = {
  Andrómeda: "🌌",
  Tatooine: "🏜️",
  Kessel: "💎",
  Hoth: "❄️",
  Dagobah: "🌫️",
  Coruscant: "🏙️",
}

const defaultDescriptions: Record<string, string> = {
  Andrómeda: "La más distante",
  Tatooine: "Planeta del desierto",
  Kessel: "Minas de spice",
  Hoth: "Planeta de hielo",
  Dagobah: "El pantano místico",
  Coruscant: "Capital galáctica",
}

export default function GalaxyCard({ name, visits = 0, rank, color, emoji, description }: Props) {
  const cardColor = color ?? defaultColors[name] ?? "from-primary/20 to-muted/10"
  const cardEmoji = emoji ?? defaultEmojis[name] ?? "⭐"
  const cardDescription = description ?? defaultDescriptions[name] ?? "Destino galáctico"

  return (
    <button
      className={`relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br border border-border hover:border-primary/30 ${cardColor}`}
    >
      {rank != null && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/50 flex items-center justify-center">
          <span
            className="text-xs font-bold text-primary"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            #{rank}
          </span>
        </div>
      )}

      <div className="space-y-2">
        <span className="text-2xl">{cardEmoji}</span>
        <div>
          <h4 className="font-medium text-foreground text-sm">{name}</h4>
          <p className="text-[10px] text-muted-foreground">{cardDescription}</p>
        </div>
        <p
          className="text-[10px] text-primary/70"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          {visits.toLocaleString()} viajes
        </p>
      </div>

      <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-primary/5 blur-xl" />
    </button>
  )
}
