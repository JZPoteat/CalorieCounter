import { createClient } from '@/lib/supabase/server'
import { LogFoodClient } from '@/components/log/LogFoodClient'
import type { CustomFood, FoodResult } from '@/types'

export default async function AddFoodPage() {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  const [{ data: customFoods }, { data: recentEntries }] = await Promise.all([
    supabase.from('custom_foods').select('*').order('name', { ascending: true }),
    supabase
      .from('food_entries')
      .select('food_name, calories, protein, carbs, fat, serving_size, serving_qty')
      .lt('logged_date', today)
      .order('created_at', { ascending: false })
      .limit(60),
  ])

  // Deduplicate by food_name, keep most recent occurrence.
  // Normalize back to per-serving values so ServingSelector can re-scale.
  const seen = new Set<string>()
  const recentFoods: FoodResult[] = []
  for (const e of recentEntries ?? []) {
    if (seen.has(e.food_name)) continue
    seen.add(e.food_name)
    const qty = e.serving_qty || 1
    recentFoods.push({
      fdcId: 0,
      description: e.food_name,
      brandOwner: null,
      calories: Math.round(e.calories / qty),
      protein: +(e.protein / qty).toFixed(1),
      carbs: +(e.carbs / qty).toFixed(1),
      fat: +(e.fat / qty).toFixed(1),
      servingSize: 1,
      servingSizeUnit: 'serving',
      servingLabel: e.serving_size ?? '1 serving',
    })
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Log Food</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Search the USDA database or pick from your custom foods.
        </p>
      </div>
      <LogFoodClient
        customFoods={(customFoods as CustomFood[]) ?? []}
        recentFoods={recentFoods}
      />
    </div>
  )
}
