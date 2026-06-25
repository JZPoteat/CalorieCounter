'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const customFoodSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  serving_size: z.string().optional(),
  calories_per_serving: z.number().nonnegative(),
  protein_per_serving: z.number().nonnegative(),
  carbs_per_serving: z.number().nonnegative(),
  fat_per_serving: z.number().nonnegative(),
})

type CustomFoodData = z.infer<typeof customFoodSchema>

export async function createCustomFood(data: CustomFoodData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const parsed = customFoodSchema.safeParse(data)
  if (!parsed.success) throw new Error('Invalid food data')

  const { error } = await supabase.from('custom_foods').insert({
    ...parsed.data,
    user_id: user.id,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/foods/custom')
}

export async function updateCustomFood(id: string, data: CustomFoodData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const parsed = customFoodSchema.safeParse(data)
  if (!parsed.success) throw new Error('Invalid food data')

  const { error } = await supabase
    .from('custom_foods')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/foods/custom')
}

export async function deleteCustomFood(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('custom_foods')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/foods/custom')
}
