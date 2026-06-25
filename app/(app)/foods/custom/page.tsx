import { createClient } from '@/lib/supabase/server'
import { CustomFoodList } from '@/components/foods/CustomFoodList'
import type { CustomFood } from '@/types'

export default async function CustomFoodsPage() {
  const supabase = await createClient()

  const { data: foods } = await supabase
    .from('custom_foods')
    .select('*')
    .order('name', { ascending: true })

  const safeFoods: CustomFood[] = foods ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Foods</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Create custom foods to log them alongside USDA search results.
        </p>
      </div>
      <CustomFoodList foods={safeFoods} />
    </div>
  )
}
