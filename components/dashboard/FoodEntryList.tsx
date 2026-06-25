import { deleteFoodEntry } from '@/actions/food-entries'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { FoodEntry } from '@/types'

function DeleteButton({ id }: { id: string }) {
  return (
    <form
      action={async () => {
        'use server'
        await deleteFoodEntry(id)
      }}
    >
      <Button type="submit" variant="ghost" size="sm" className="text-destructive hover:text-destructive">
        Delete
      </Button>
    </form>
  )
}

interface FoodEntryListProps {
  entries: FoodEntry[]
}

export function FoodEntryList({ entries }: FoodEntryListProps) {
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

  return (
    <ul className="space-y-2">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex items-center gap-3 rounded-lg border px-4 py-3"
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{entry.food_name}</p>
            <p className="text-xs text-muted-foreground">
              {entry.serving_qty} × {entry.serving_size ?? '100g'}{' '}
              {entry.meal_type && (
                <span className="capitalize">· {entry.meal_type}</span>
              )}
            </p>
          </div>
          <div className="text-right shrink-0 space-y-0.5">
            <p className="text-sm font-semibold">{entry.calories} kcal</p>
            <p className="text-xs text-muted-foreground">
              P {entry.protein}g · C {entry.carbs}g · F {entry.fat}g
            </p>
          </div>
          <DeleteButton id={entry.id} />
        </li>
      ))}
    </ul>
  )
}
