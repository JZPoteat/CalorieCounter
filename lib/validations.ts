import { z } from 'zod'

export const addFoodEntrySchema = z.object({
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

export const customFoodSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  serving_size: z.string().optional(),
  calories_per_serving: z.number().nonnegative(),
  protein_per_serving: z.number().nonnegative(),
  carbs_per_serving: z.number().nonnegative(),
  fat_per_serving: z.number().nonnegative(),
})

export const goalsSchema = z.object({
  calorie_goal: z.number().int().positive(),
  protein_goal: z.number().int().positive(),
  carbs_goal: z.number().int().positive(),
  fat_goal: z.number().int().positive(),
})
