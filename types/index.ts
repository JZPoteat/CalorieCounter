export interface FoodEntry {
  id: string
  food_name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  serving_size: string | null
  serving_qty: number
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null
  logged_date: string
  created_at: string
}

export interface CustomFood {
  id: string
  name: string
  calories_per_serving: number
  protein_per_serving: number
  carbs_per_serving: number
  fat_per_serving: number
  serving_size: string | null
  created_at: string
}

export interface FoodResult {
  fdcId: number
  description: string
  brandOwner: string | null
  calories: number
  protein: number
  carbs: number
  fat: number
  servingSize: number
  servingSizeUnit: string
  /** Human-readable serving label, e.g. "100g" or "1 cup". Overrides servingSize+servingSizeUnit for display. */
  servingLabel?: string
  /** UUID of the custom_foods row, present only when this food comes from the user's custom foods. */
  customFoodId?: string
}
