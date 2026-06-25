'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CustomFoodForm } from './CustomFoodForm'
import { deleteCustomFood } from '@/actions/custom-foods'
import type { CustomFood } from '@/types'

interface CustomFoodListProps {
  foods: CustomFood[]
}

export function CustomFoodList({ foods }: CustomFoodListProps) {
  const router = useRouter()
  const [editingFood, setEditingFood] = useState<CustomFood | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    setDeletingId(id)
    startTransition(async () => {
      await deleteCustomFood(id)
      setDeletingId(null)
      router.refresh()
    })
  }

  const handleSuccess = () => {
    setShowNewForm(false)
    setEditingFood(null)
    router.refresh()
  }

  const handleCancel = () => {
    setShowNewForm(false)
    setEditingFood(null)
  }

  return (
    <div className="space-y-4">
      {!showNewForm && !editingFood && (
        <Button size="sm" onClick={() => setShowNewForm(true)}>
          + New food
        </Button>
      )}

      {(showNewForm || editingFood) && (
        <CustomFoodForm
          food={editingFood ?? undefined}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}

      {foods.length === 0 && !showNewForm && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No custom foods yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create one above to log it alongside USDA search results.
          </p>
        </div>
      )}

      {foods.length > 0 && (
        <ul className="space-y-2">
          {foods.map((food) => (
            <li
              key={food.id}
              className="flex items-center gap-3 rounded-lg border px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{food.name}</p>
                <p className="text-xs text-muted-foreground">
                  {food.serving_size ?? '1 serving'} · {food.calories_per_serving} kcal
                </p>
              </div>
              <p className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                P {food.protein_per_serving}g · C {food.carbs_per_serving}g · F{' '}
                {food.fat_per_serving}g
              </p>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!!editingFood || !!showNewForm}
                  onClick={() => {
                    setShowNewForm(false)
                    setEditingFood(food)
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={deletingId === food.id}
                  onClick={() => handleDelete(food.id)}
                >
                  {deletingId === food.id ? '…' : 'Delete'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
