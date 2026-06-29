'use client'

import { useState } from 'react'
import { deleteFoodEntry } from '@/actions/food-entries'
import { ServingSelector } from '@/components/log/ServingSelector'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { GRAM_UNITS, VOL_UNITS } from '@/lib/serving-calc'
import type { FoodEntry, FoodResult } from '@/types'

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'] as const

function groupByMeal(entries: FoodEntry[]) {
  const groups = new Map<string, FoodEntry[]>()
  for (const entry of entries) {
    const key = entry.meal_type ?? 'other'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(entry)
  }
  const ordered: Array<{ meal: string; entries: FoodEntry[] }> = []
  for (const meal of [...MEAL_ORDER, 'other']) {
    if (groups.has(meal)) ordered.push({ meal, entries: groups.get(meal)! })
  }
  return ordered
}

/** Convert a stored FoodEntry back to per-serving FoodResult for ServingSelector */
function entryToFoodResult(entry: FoodEntry): FoodResult {
  const qty = entry.serving_qty || 1
  const label = entry.serving_size ?? '1 serving'

  // Parse the serving label to recover unit so weight mode stays available.
  // e.g. "100g" → size=100, unit="g"  /  "1 cup" → size=1, unit="cup"
  const match = label.match(/^([\d.]+)\s*([a-zA-Z]*)/)
  const parsedSize = match ? parseFloat(match[1]) : 1
  const parsedUnit = match ? match[2].toLowerCase() : 'serving'

  const isGram = GRAM_UNITS.includes(parsedUnit)
  const isVol  = VOL_UNITS.includes(parsedUnit)

  return {
    fdcId: 0,
    description: entry.food_name,
    brandOwner: null,
    calories: Math.round(entry.calories / qty),
    protein: +(entry.protein / qty).toFixed(1),
    carbs: +(entry.carbs / qty).toFixed(1),
    fat: +(entry.fat / qty).toFixed(1),
    servingSize: (isGram || isVol) ? parsedSize : 1,
    servingSizeUnit: (isGram || isVol) ? parsedUnit : 'serving',
    servingLabel: label,
  }
}

function DeleteButton({ id }: { id: string }) {
  return (
    <form action={deleteFoodEntry.bind(null, id)}>
      <Button type="submit" variant="ghost" size="sm" className="text-destructive hover:text-destructive px-2">
        Delete
      </Button>
    </form>
  )
}

interface FoodEntryListProps {
  entries: FoodEntry[]
}

export function FoodEntryList({ entries }: FoodEntryListProps) {
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null)

  if (entries.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-muted-foreground">Nothing logged yet today.</p>
        <Link href="/log/add">
          <Button>Add your first food</Button>
        </Link>
      </div>
    )
  }

  const groups = groupByMeal(entries)

  return (
    <>
      <div className="space-y-5">
        {groups.map(({ meal, entries: mealEntries }) => {
          const total = Math.round(mealEntries.reduce((s, e) => s + e.calories, 0))
          return (
            <div key={meal}>
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-sm font-semibold capitalize text-muted-foreground">{meal}</h3>
                <span className="text-xs text-muted-foreground">{total} kcal</span>
              </div>
              <ul className="space-y-2">
                {mealEntries.map((entry) => (
                  <li key={entry.id} className="flex items-center gap-2 rounded-lg border px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{entry.food_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.serving_qty} × {entry.serving_size ?? '100g'}
                      </p>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <p className="text-sm font-semibold">{Math.round(entry.calories)} kcal</p>
                      <p className="text-xs text-muted-foreground">
                        P {entry.protein}g · C {entry.carbs}g · F {entry.fat}g
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="px-2 shrink-0" onClick={() => setEditingEntry(entry)}>
                      Edit
                    </Button>
                    <DeleteButton id={entry.id} />
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      <ServingSelector
        food={editingEntry ? entryToFoodResult(editingEntry) : null}
        editEntry={editingEntry ?? undefined}
        onClose={() => setEditingEntry(null)}
      />
    </>
  )
}
