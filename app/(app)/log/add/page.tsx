import { createClient } from '@/lib/supabase/server'
import { LogFoodClient } from '@/components/log/LogFoodClient'
import type { CustomFood } from '@/types'

export default async function AddFoodPage() {
  const supabase = await createClient()

  const { data: customFoods } = await supabase
    .from('custom_foods')
    .select('*')
    .order('name', { ascending: true })

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Log Food</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Search the USDA database or pick from your custom foods.
        </p>
      </div>
      <LogFoodClient customFoods={(customFoods as CustomFood[]) ?? []} />
    </div>
  )
}
