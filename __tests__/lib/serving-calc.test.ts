import { describe, it, expect } from 'vitest'
import { getWeightUnits, toBaseUnit, calcServingMultiplier } from '@/lib/serving-calc'
import type { FoodResult } from '@/types'

// ---------------------------------------------------------------------------
// Minimal food fixture factory
// ---------------------------------------------------------------------------
function makeFood(servingSizeUnit: string, servingSize = 100): FoodResult {
  return {
    fdcId: 1,
    description: 'Test Food',
    brandOwner: null,
    calories: 100,
    protein: 10,
    carbs: 10,
    fat: 5,
    servingSize,
    servingSizeUnit,
  }
}

// ---------------------------------------------------------------------------
// getWeightUnits
// ---------------------------------------------------------------------------
describe('getWeightUnits', () => {
  it.each(['g', 'GRM', 'grms', 'gram', 'grams'])(
    'returns [g, oz] for gram variant "%s"',
    (unit) => {
      expect(getWeightUnits(makeFood(unit))).toEqual(['g', 'oz'])
    }
  )

  it.each(['ml', 'mll', 'milliliter', 'milliliters'])(
    'returns [ml, floz] for volume variant "%s"',
    (unit) => {
      expect(getWeightUnits(makeFood(unit))).toEqual(['ml', 'floz'])
    }
  )

  it('returns [] for an unrecognised unit', () => {
    expect(getWeightUnits(makeFood('cup'))).toEqual([])
    expect(getWeightUnits(makeFood('tbsp'))).toEqual([])
    expect(getWeightUnits(makeFood('piece'))).toEqual([])
  })

  it('returns [] when servingSizeUnit is an empty string', () => {
    expect(getWeightUnits(makeFood(''))).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// toBaseUnit
// ---------------------------------------------------------------------------
describe('toBaseUnit', () => {
  it('returns grams unchanged', () => {
    expect(toBaseUnit(100, 'g')).toBe(100)
  })

  it('returns ml unchanged', () => {
    expect(toBaseUnit(250, 'ml')).toBe(250)
  })

  it('converts oz to grams (1 oz = 28.3495 g)', () => {
    expect(toBaseUnit(1, 'oz')).toBeCloseTo(28.3495, 4)
    expect(toBaseUnit(2, 'oz')).toBeCloseTo(56.699, 3)
  })

  it('converts fl oz to ml (1 fl oz = 29.5735 ml)', () => {
    expect(toBaseUnit(1, 'floz')).toBeCloseTo(29.5735, 4)
    expect(toBaseUnit(8, 'floz')).toBeCloseTo(236.588, 3)
  })

  it('handles zero amount', () => {
    expect(toBaseUnit(0, 'oz')).toBe(0)
    expect(toBaseUnit(0, 'g')).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// calcServingMultiplier
// ---------------------------------------------------------------------------
describe('calcServingMultiplier', () => {
  it('returns 1.0 when amount equals serving size in grams', () => {
    expect(calcServingMultiplier(100, 'g', 100)).toBeCloseTo(1.0)
  })

  it('returns 0.5 when amount is half the serving size', () => {
    expect(calcServingMultiplier(50, 'g', 100)).toBeCloseTo(0.5)
  })

  it('returns 1.5 when amount is 1.5× the serving size', () => {
    expect(calcServingMultiplier(150, 'g', 100)).toBeCloseTo(1.5)
  })

  it('applies oz-to-gram conversion before dividing', () => {
    // 1 oz = 28.3495 g; serving size 100 g → multiplier ≈ 0.2835
    expect(calcServingMultiplier(1, 'oz', 100)).toBeCloseTo(28.3495 / 100, 4)
  })

  it('applies fl-oz-to-ml conversion before dividing', () => {
    // 8 fl oz = 236.588 ml; serving size 240 ml → multiplier ≈ 0.9858
    expect(calcServingMultiplier(8, 'floz', 240)).toBeCloseTo((8 * 29.5735) / 240, 4)
  })

  it('clamps result to minimum of 0.01 for zero input', () => {
    expect(calcServingMultiplier(0, 'g', 100)).toBe(0.01)
  })

  it('clamps result to minimum of 0.01 for a very small input', () => {
    expect(calcServingMultiplier(0.001, 'g', 100)).toBe(0.01)
  })
})
