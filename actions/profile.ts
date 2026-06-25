'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const goalsSchema = z.object({
  calorie_goal: z.number().int().positive(),
  protein_goal: z.number().int().positive(),
  carbs_goal: z.number().int().positive(),
  fat_goal: z.number().int().positive(),
})

export async function updateGoals(data: z.infer<typeof goalsSchema>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const parsed = goalsSchema.safeParse(data)
  if (!parsed.success) throw new Error('Invalid goals data')

  const { error } = await supabase
    .from('profiles')
    .update(parsed.data)
    .eq('id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  revalidatePath('/settings')
}
