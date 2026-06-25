import { createClient } from '@/lib/supabase/server'
import { FoodEntryList } from '@/components/dashboard/FoodEntryList'
import { DailySummary } from '@/components/dashboard/DailySummary'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { FoodEntry } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [{ data: entries }, { data: profile }] = await Promise.all([
    supabase
      .from('food_entries')
      .select('*')
      .eq('logged_date', today)
      .order('created_at', { ascending: true }),
    supabase
      .from('profiles')
      .select('calorie_goal, protein_goal, carbs_goal, fat_goal')
      .single(),
  ])

  const safeEntries: FoodEntry[] = entries ?? []

  const totals = safeEntries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const goals = {
    calorie_goal: profile?.calorie_goal ?? 2000,
    protein_goal: profile?.protein_goal ?? 150,
    carbs_goal: profile?.carbs_goal ?? 250,
    fat_goal: profile?.fat_goal ?? 65,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Today</h1>
        <Link href="/log/add">
          <Button size="sm">+ Add food</Button>
        </Link>
      </div>

      <DailySummary totals={totals} goals={goals} />

      <FoodEntryList entries={safeEntries} />
    </div>
  )
}
