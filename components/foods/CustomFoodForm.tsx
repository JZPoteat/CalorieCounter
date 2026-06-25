'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createCustomFood, updateCustomFood } from '@/actions/custom-foods'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { CustomFood } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  serving_size: z.string().optional(),
  calories_per_serving: z.number().nonnegative('Must be 0 or more'),
  protein_per_serving: z.number().nonnegative('Must be 0 or more'),
  carbs_per_serving: z.number().nonnegative('Must be 0 or more'),
  fat_per_serving: z.number().nonnegative('Must be 0 or more'),
})

type FormData = z.infer<typeof schema>

const MACRO_FIELDS: { name: keyof FormData; label: string; unit: string }[] = [
  { name: 'calories_per_serving', label: 'Calories', unit: 'kcal' },
  { name: 'protein_per_serving', label: 'Protein', unit: 'g' },
  { name: 'carbs_per_serving', label: 'Carbs', unit: 'g' },
  { name: 'fat_per_serving', label: 'Fat', unit: 'g' },
]

interface CustomFoodFormProps {
  food?: CustomFood
  onSuccess: () => void
  onCancel: () => void
}

export function CustomFoodForm({ food, onSuccess, onCancel }: CustomFoodFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: food
      ? {
          name: food.name,
          serving_size: food.serving_size ?? '',
          calories_per_serving: food.calories_per_serving,
          protein_per_serving: food.protein_per_serving,
          carbs_per_serving: food.carbs_per_serving,
          fat_per_serving: food.fat_per_serving,
        }
      : { calories_per_serving: 0, protein_per_serving: 0, carbs_per_serving: 0, fat_per_serving: 0 },
  })

  const onSubmit = async (data: FormData) => {
    if (food) {
      await updateCustomFood(food.id, data)
    } else {
      await createCustomFood(data)
    }
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border p-4 space-y-4">
      <h2 className="font-semibold">{food ? 'Edit Food' : 'New Food'}</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1 sm:col-span-2">
          <label className="text-sm font-medium">Name</label>
          <Input {...register('name')} placeholder="e.g. Greek Yogurt" />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label className="text-sm font-medium">
            Serving size{' '}
            <span className="text-muted-foreground font-normal">(optional, e.g. 100g, 1 cup)</span>
          </label>
          <Input {...register('serving_size')} placeholder="1 serving" />
        </div>

        {MACRO_FIELDS.map(({ name, label, unit }) => (
          <div key={name} className="space-y-1">
            <label className="text-sm font-medium">
              {label} <span className="text-muted-foreground font-normal">({unit})</span>
            </label>
            <Input type="number" min="0" step="0.1" {...register(name, { valueAsNumber: true })} />
            {errors[name] && (
              <p className="text-xs text-destructive">{errors[name]?.message}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : food ? 'Save changes' : 'Create food'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
