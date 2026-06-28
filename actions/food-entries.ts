'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { addFoodEntrySchema } from '@/lib/validations'

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
