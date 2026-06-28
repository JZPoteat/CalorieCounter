import { describe, it, expect } from 'vitest'
import { addFoodEntrySchema, customFoodSchema, goalsSchema } from '@/lib/validations'

// ---------------------------------------------------------------------------
// addFoodEntrySchema
// ---------------------------------------------------------------------------
describe('addFoodEntrySchema', () => {
  const valid = {
    food_name: 'Chicken breast',
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    serving_size: '100g',
    serving_qty: 1,
    meal_type: 'lunch' as const,
    source: 'api' as const,
  }

  it('accepts valid data', () => {
    expect(addFoodEntrySchema.safeParse(valid).success).toBe(true)
  })

  it('accepts valid data with optional fields', () => {
    const result = addFoodEntrySchema.safeParse({
      ...valid,
      external_food_id: '123456',
      logged_date: '2026-06-28',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty food_name', () => {
    expect(addFoodEntrySchema.safeParse({ ...valid, food_name: '' }).success).toBe(false)
  })

  it('rejects invalid meal_type', () => {
    expect(addFoodEntrySchema.safeParse({ ...valid, meal_type: 'brunch' }).success).toBe(false)
  })

  it('rejects zero serving_qty', () => {
    expect(addFoodEntrySchema.safeParse({ ...valid, serving_qty: 0 }).success).toBe(false)
  })

  it('rejects negative serving_qty', () => {
    expect(addFoodEntrySchema.safeParse({ ...valid, serving_qty: -1 }).success).toBe(false)
  })

  it('rejects malformed logged_date', () => {
    expect(addFoodEntrySchema.safeParse({ ...valid, logged_date: '28-06-2026' }).success).toBe(false)
  })

  it('accepts missing logged_date (optional)', () => {
    const { logged_date: _unused, ...withoutDate } = { ...valid, logged_date: undefined }
    expect(addFoodEntrySchema.safeParse(withoutDate).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// customFoodSchema
// ---------------------------------------------------------------------------
describe('customFoodSchema', () => {
  const valid = {
    name: 'Homemade granola',
    calories_per_serving: 350,
    protein_per_serving: 8,
    carbs_per_serving: 52,
    fat_per_serving: 12,
  }

  it('accepts valid data', () => {
    expect(customFoodSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts zero macros (e.g. water)', () => {
    const result = customFoodSchema.safeParse({
      name: 'Water',
      calories_per_serving: 0,
      protein_per_serving: 0,
      carbs_per_serving: 0,
      fat_per_serving: 0,
    })
    expect(result.success).toBe(true)
  })

  it('accepts an optional serving_size', () => {
    expect(customFoodSchema.safeParse({ ...valid, serving_size: '1 cup' }).success).toBe(true)
  })

  it('rejects empty name', () => {
    expect(customFoodSchema.safeParse({ ...valid, name: '' }).success).toBe(false)
  })

  it('rejects negative calories', () => {
    expect(customFoodSchema.safeParse({ ...valid, calories_per_serving: -1 }).success).toBe(false)
  })

  it('rejects negative protein', () => {
    expect(customFoodSchema.safeParse({ ...valid, protein_per_serving: -0.1 }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// goalsSchema
// ---------------------------------------------------------------------------
describe('goalsSchema', () => {
  const valid = {
    calorie_goal: 2000,
    protein_goal: 150,
    carbs_goal: 200,
    fat_goal: 65,
  }

  it('accepts valid integer goals', () => {
    expect(goalsSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects float goals', () => {
    expect(goalsSchema.safeParse({ ...valid, calorie_goal: 2000.5 }).success).toBe(false)
  })

  it('rejects zero goals', () => {
    expect(goalsSchema.safeParse({ ...valid, protein_goal: 0 }).success).toBe(false)
  })

  it('rejects negative goals', () => {
    expect(goalsSchema.safeParse({ ...valid, fat_goal: -10 }).success).toBe(false)
  })
})
