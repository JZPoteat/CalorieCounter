'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { updateGoals } from '@/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const schema = z.object({
  calorie_goal: z.coerce.number().int().positive('Must be a positive number'),
  protein_goal: z.coerce.number().int().positive('Must be a positive number'),
  carbs_goal: z.coerce.number().int().positive('Must be a positive number'),
  fat_goal: z.coerce.number().int().positive('Must be a positive number'),
})

type FormData = z.infer<typeof schema>

interface GoalsFormProps {
  defaults: FormData
}

const FIELDS: { name: keyof FormData; label: string; unit: string }[] = [
  { name: 'calorie_goal', label: 'Daily Calories', unit: 'kcal' },
  { name: 'protein_goal', label: 'Protein', unit: 'g' },
  { name: 'carbs_goal', label: 'Carbohydrates', unit: 'g' },
  { name: 'fat_goal', label: 'Fat', unit: 'g' },
]

export function GoalsForm({ defaults }: GoalsFormProps) {
  const [saved, setSaved] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: defaults })

  const onSubmit = async (data: FormData) => {
    await updateGoals(data)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
      {FIELDS.map(({ name, label, unit }) => (
        <div key={name} className="space-y-1">
          <label htmlFor={name} className="text-sm font-medium">
            {label}{' '}
            <span className="text-muted-foreground font-normal">({unit})</span>
          </label>
          <Input
            id={name}
            type="number"
            min="1"
            {...register(name)}
          />
          {errors[name] && (
            <p className="text-xs text-destructive">{errors[name]?.message}</p>
          )}
        </div>
      ))}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save goals'}
        </Button>
        {saved && <p className="text-sm text-muted-foreground">Saved!</p>}
      </div>
    </form>
  )
}
