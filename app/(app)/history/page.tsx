import { createClient } from '@/lib/supabase/server'
import { HistoryDayCard } from '@/components/history/HistoryDayCard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { FoodEntry } from '@/types'

export default async function HistoryPage() {
  const supabase = await createClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const startDate = thirtyDaysAgo.toISOString().split('T')[0]

  const { data: entries } = await supabase
    .from('food_entries')
    .select('*')
    .gte('logged_date', startDate)
    .order('logged_date', { ascending: false })
    .order('created_at', { ascending: true })

  const safeEntries: FoodEntry[] = entries ?? []

  // Group by date
  const grouped = new Map<string, FoodEntry[]>()
  for (const entry of safeEntries) {
    const group = grouped.get(entry.logged_date) ?? []
    group.push(entry)
    grouped.set(entry.logged_date, group)
  }

  const days = Array.from(grouped.entries()).map(([date, dayEntries]) => ({
    date,
    entries: dayEntries,
    totals: dayEntries.reduce(
      (acc, e) => ({
        calories: acc.calories + e.calories,
        protein: acc.protein + e.protein,
        carbs: acc.carbs + e.carbs,
        fat: acc.fat + e.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    ),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">History</h1>
          <p className="text-muted-foreground mt-1 text-sm">Last 30 days</p>
        </div>
        <Link href="/log/add">
          <Button size="sm">+ Add food</Button>
        </Link>
      </div>

      {days.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-muted-foreground">No entries in the last 30 days.</p>
          <Link href="/log/add">
            <Button>Log your first food</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {days.map((day) => (
            <HistoryDayCard
              key={day.date}
              date={day.date}
              entries={day.entries}
              totals={day.totals}
            />
          ))}
        </div>
      )}
    </div>
  )
}
