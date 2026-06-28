import type { FoodResult } from '@/types'

/** USDA serving size unit strings that indicate a gram-based measurement. */
export const GRAM_UNITS = ['g', 'grm', 'grms', 'gram', 'grams']

/** USDA serving size unit strings that indicate a millilitre-based measurement. */
export const VOL_UNITS = ['ml', 'mll', 'milliliter', 'milliliters']

/**
 * Returns the weight/volume units available for "By weight" mode given a food's
 * serving size unit. Returns an empty array when the food's unit is not a
 * recognised gram or millilitre variant, meaning weight mode should be hidden.
 *
 * @param food - The food whose `servingSizeUnit` is inspected.
 * @returns `['g', 'oz']` for gram-based foods, `['ml', 'floz']` for volume-based,
 *          or `[]` when the unit cannot be matched.
 */
export function getWeightUnits(food: FoodResult): Array<'g' | 'oz' | 'ml' | 'floz'> {
  const unit = food.servingSizeUnit?.toLowerCase() ?? ''
  if (GRAM_UNITS.includes(unit)) return ['g', 'oz']
  if (VOL_UNITS.includes(unit))  return ['ml', 'floz']
  return []
}

/**
 * Converts a user-entered amount to the food's base unit (grams or millilitres)
 * so it can be divided by the food's serving size to get a multiplier.
 *
 * Conversion factors:
 * - 1 oz  = 28.3495 g
 * - 1 fl oz = 29.5735 ml
 * - g and ml are already in the base unit and are returned unchanged.
 *
 * @param amount - The numeric quantity the user entered.
 * @param unit   - The unit the user selected (`'g'`, `'oz'`, `'ml'`, or `'floz'`).
 * @returns The equivalent amount in grams (for oz) or millilitres (for floz),
 *          or the original amount unchanged for g/ml.
 */
export function toBaseUnit(amount: number, unit: 'g' | 'oz' | 'ml' | 'floz'): number {
  if (unit === 'oz')   return amount * 28.3495
  if (unit === 'floz') return amount * 29.5735
  return amount
}

/**
 * Calculates the serving multiplier used to scale a food's per-serving macros.
 *
 * In "By weight" mode the multiplier is:
 *   `toBaseUnit(amount, unit) / servingSize`
 *
 * The result is clamped to a minimum of `0.01` to avoid zero or negative
 * multipliers reaching the macro preview.
 *
 * @param amount      - The raw number the user typed.
 * @param unit        - The unit the user selected.
 * @param servingSize - The food's reference serving size in its base unit (g or ml).
 *                      Must be greater than zero.
 * @returns A positive multiplier (≥ 0.01).
 */
export function calcServingMultiplier(
  amount: number,
  unit: 'g' | 'oz' | 'ml' | 'floz',
  servingSize: number
): number {
  const amountInBase = toBaseUnit(amount, unit)
  return Math.max(0.01, amountInBase / servingSize)
}
