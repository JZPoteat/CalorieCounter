import { NextResponse, type NextRequest } from 'next/server'
import type { FoodResult } from '@/types'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params

  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}?fields=product_name,brands,nutriments,serving_size,serving_quantity`

  const res = await fetch(url, {
    headers: { 'User-Agent': 'CalorieCounter/1.0 (https://github.com)' },
    next: { revalidate: 86400 },
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Upstream lookup failed' }, { status: 502 })
  }

  const data = await res.json()

  if (data.status !== 1 || !data.product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const p = data.product
  const n = (p.nutriments ?? {}) as Record<string, number>

  // Open Food Facts stores per-100g values
  const calories = Math.round(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0)
  const protein = +(n['proteins_100g'] ?? n['proteins'] ?? 0).toFixed(1)
  const carbs = +(n['carbohydrates_100g'] ?? n['carbohydrates'] ?? 0).toFixed(1)
  const fat = +(n['fat_100g'] ?? n['fat'] ?? 0).toFixed(1)

  const servingQty = p.serving_quantity ? Number(p.serving_quantity) : 100

  const food: FoodResult = {
    fdcId: 0,
    description: (p.product_name as string | undefined) ?? 'Unknown Product',
    brandOwner: (p.brands as string | undefined) ?? null,
    calories,
    protein,
    carbs,
    fat,
    servingSize: servingQty,
    servingSizeUnit: 'g',
    servingLabel: (p.serving_size as string | undefined) ?? '100g',
  }

  return NextResponse.json(food)
}
