import { MacroBar } from './MacroBar'

interface Totals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface Goals {
  calorie_goal: number
  protein_goal: number
  carbs_goal: number
  fat_goal: number
}

interface DailySummaryProps {
  totals: Totals
  goals: Goals
}

function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const radius = 45
  const stroke = 8
  const normalizedRadius = radius - stroke / 2
  const circumference = 2 * Math.PI * normalizedRadius
  const pct = goal > 0 ? Math.min(consumed / goal, 1) : 0
  const dashOffset = circumference * (1 - pct)
  const remaining = Math.max(goal - consumed, 0)
  const over = consumed > goal

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
        <svg
          width={radius * 2}
          height={radius * 2}
          viewBox={`0 0 ${radius * 2} ${radius * 2}`}
        >
          {/* Background track */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-muted"
          />
          {/* Progress arc */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            strokeWidth={stroke}
            stroke={over ? '#ef4444' : 'hsl(var(--primary))'}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
            style={{
              transformOrigin: 'center',
              transform: 'rotate(-90deg)',
              transition: 'stroke-dashoffset 0.5s ease',
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold leading-none">
            {Math.round(consumed)}
          </span>
          <span className="text-[10px] text-muted-foreground">kcal</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-medium">
          {over ? (
            <span className="text-destructive">
              {Math.round(consumed - goal)} over goal
            </span>
          ) : (
            <span>{Math.round(remaining)} remaining</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">of {goal} kcal goal</p>
      </div>
    </div>
  )
}

export function DailySummary({ totals, goals }: DailySummaryProps) {
  return (
    <div className="rounded-lg border p-5 space-y-5">
      <div className="flex items-start gap-8">
        <CalorieRing consumed={Math.round(totals.calories)} goal={goals.calorie_goal} />
        <div className="flex-1 space-y-4 pt-1">
          <MacroBar
            label="Protein"
            value={totals.protein}
            goal={goals.protein_goal}
            color="#3b82f6"
          />
          <MacroBar
            label="Carbs"
            value={totals.carbs}
            goal={goals.carbs_goal}
            color="#f59e0b"
          />
          <MacroBar
            label="Fat"
            value={totals.fat}
            goal={goals.fat_goal}
            color="#ec4899"
          />
        </div>
      </div>
    </div>
  )
}
