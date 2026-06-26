'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addFoodEntry } from '@/actions/food-entries'
import type { FoodResult } from '@/types'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
type MealType = (typeof MEAL_TYPES)[number]

interface ServingSelectorProps {
  food: FoodResult | null
  onClose: () => void
}

function MacroRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground capitalize">{label}</span>
      <span className="font-medium">{value.toFixed(1)}g</span>
    </div>
  )
}

export function ServingSelector({ food, onClose }: ServingSelectorProps) {
  const [qty, setQty] = useState('1')
  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [isPending, startTransition] = useTransition()

  const qtyNum = Math.max(0.1, parseFloat(qty) || 1)
  const scaled = food
    ? {
        calories: Math.round(food.calories * qtyNum),
        protein: +(food.protein * qtyNum).toFixed(1),
        carbs: +(food.carbs * qtyNum).toFixed(1),
        fat: +(food.fat * qtyNum).toFixed(1),
      }
    : null

  const handleConfirm = () => {
    if (!food || !scaled) return
    startTransition(async () => {
      await addFoodEntry({
        food_name: food.description,
        calories: scaled.calories,
        protein: scaled.protein,
        carbs: scaled.carbs,
        fat: scaled.fat,
        serving_size: food.servingLabel ?? `${food.servingSize}${food.servingSizeUnit}`,
        serving_qty: qtyNum,
        meal_type: mealType,
        logged_date: date,
        source: food.customFoodId ? 'custom' : 'api',
        external_food_id: food.customFoodId ?? String(food.fdcId),
      })
    })
  }

  return (
    <Dialog open={!!food} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-base leading-snug pr-6">
            {food?.description}
          </DialogTitle>
          {food?.brandOwner && (
            <p className="text-sm text-muted-foreground">{food.brandOwner}</p>
          )}
        </DialogHeader>

        <div className="space-y-3">
          {/* Date */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium w-16 shrink-0">Date</label>
            <Input
              type="date"
              value={date}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              className="w-44"
            />
          </div>

          {/* Meal type */}
          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-medium">Meal</label>
            <div className="flex gap-2 flex-wrap">
              {MEAL_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setMealType(type)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors capitalize ${
                    mealType === type
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-accent border-border'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium w-16 shrink-0">Servings</label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-28"
              />
            </div>
            <p className="text-xs text-muted-foreground pl-20">
              1 = {food?.servingLabel ?? `${food?.servingSize}${food?.servingSizeUnit}`}
            </p>
          </div>

          {/* Live macro preview */}
          {scaled && (
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex justify-between text-sm font-semibold">
                <span>Calories</span>
                <span>{scaled.calories} kcal</span>
              </div>
              <MacroRow label="Protein" value={scaled.protein} />
              <MacroRow label="Carbs" value={scaled.carbs} />
              <MacroRow label="Fat" value={scaled.fat} />
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isPending} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isPending} className="flex-1">
            {isPending ? 'Logging...' : 'Log food'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
