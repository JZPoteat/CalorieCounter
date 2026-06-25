interface MacroBarProps {
  label: string
  value: number
  goal: number
  color: string
}

export function MacroBar({ label, value, goal, color }: MacroBarProps) {
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0
  const remaining = Math.max(goal - value, 0)

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {value.toFixed(0)}g{' '}
          <span className="text-xs">/ {goal}g</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct * 100}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-right">
        {remaining.toFixed(0)}g remaining
      </p>
    </div>
  )
}
