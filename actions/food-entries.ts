'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const addFoodEntrySchema = z.object({
  food_name: z.string().min(1),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  serving_size: z.string(),
  serving_qty: z.number().positive(),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  source: z.enum(['api', 'custom']),
  external_food_id: z.string().optional(),
  logged_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export async function addFoodEntry(data: z.infer<typeof addFoodEntrySchema>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = addFoodEntrySchema.safeParse(data)
  if (!parsed.success) throw new Error('Invalid food entry data')

  const today = new Date().toISOString().split('T')[0]
  const { logged_date, ...rest } = parsed.data
  const targetDate = logged_date ?? today

  const { error } = await supabase.from('food_entries').insert({
    ...rest,
    user_id: user.id,
    logged_date: targetDate,
  })

  if (error) throw new Error(error.message)

  if (targetDate === today) {
    redirect('/dashboard')
  } else {
    redirect('/history')
  }
}

export async function deleteFoodEntry(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('food_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  revalidatePath('/history')
}
