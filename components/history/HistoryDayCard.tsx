'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { deleteFoodEntry } from '@/actions/food-entries'
import type { FoodEntry } from '@/types'

interface DayTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface HistoryDayCardProps {
  date: string
  entries: FoodEntry[]
  totals: DayTotals
}

function formatDate(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  // Parse as local date to avoid timezone shift
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function HistoryDayCard({ date, entries, totals }: HistoryDayCardProps) {
  const [open, setOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()
  const [, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    setDeletingId(id)
    startTransition(async () => {
      await deleteFoodEntry(id)
      setDeletingId(null)
      router.refresh()
    })
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Summary row — click to expand */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-accent transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{formatDate(date)}</p>
          <p className="text-xs text-muted-foreground">{entries.length} item{entries.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold">{Math.round(totals.calories)} kcal</p>
          <p className="text-xs text-muted-foreground">
            P {totals.protein.toFixed(0)}g · C {totals.carbs.toFixed(0)}g · F {totals.fat.toFixed(0)}g
          </p>
        </div>
        <span className="text-muted-foreground text-xs ml-1">{open ? '▲' : '▼'}</span>
      </button>

      {/* Expanded entries */}
      {open && (
        <ul className="border-t divide-y">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{entry.food_name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {entry.serving_qty} × {entry.serving_size ?? '1 serving'}
                  {entry.meal_type && ` · ${entry.meal_type}`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">{entry.calories} kcal</p>
                <p className="text-xs text-muted-foreground">
                  P {entry.protein}g · C {entry.carbs}g · F {entry.fat}g
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive shrink-0"
                disabled={deletingId === entry.id}
                onClick={() => handleDelete(entry.id)}
              >
                {deletingId === entry.id ? '…' : 'Delete'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
