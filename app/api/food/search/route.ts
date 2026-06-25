import { NextResponse, type NextRequest } from 'next/server'

const FDC_BASE = 'https://api.nal.usda.gov/fdc/v1'

// Nutrient IDs in FDC data
const NUTRIENT = {
  calories: 1008,
  protein: 1003,
  carbs: 1005,
  fat: 1004,
}

function getNutrient(nutrients: FdcNutrient[], id: number): number {
  return nutrients.find((n) => n.nutrientId === id)?.value ?? 0
}

interface FdcNutrient {
  nutrientId: number
  value: number
}

interface FdcFood {
  fdcId: number
  description: string
  brandOwner?: string
  brandName?: string
  foodNutrients: FdcNutrient[]
  servingSize?: number
  servingSizeUnit?: string
}

export async function GET(request: NextRequest) {

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  if (!q) {
    return NextResponse.json({ error: 'Missing query param: q' }, { status: 400 })
  }

  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(25, Math.max(1, Number(searchParams.get('pageSize') ?? 10)))

  const url = new URL(`${FDC_BASE}/foods/search`)
  url.searchParams.set('query', q)
  url.searchParams.set('pageNumber', String(page))
  url.searchParams.set('pageSize', String(pageSize))
  url.searchParams.set('dataType', 'Foundation,SR Legacy,Branded')
  url.searchParams.set('api_key', process.env.USDA_API_KEY!)

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
  if (!res.ok) {
    return NextResponse.json({ error: 'FDC request failed' }, { status: 502 })
  }

  const data = await res.json()
  const foods = (data.foods as FdcFood[]).map((f) => ({
    fdcId: f.fdcId,
    description: f.description,
    brandOwner: f.brandOwner ?? f.brandName ?? null,
    calories: Math.round(getNutrient(f.foodNutrients, NUTRIENT.calories)),
    protein: +getNutrient(f.foodNutrients, NUTRIENT.protein).toFixed(1),
    carbs: +getNutrient(f.foodNutrients, NUTRIENT.carbs).toFixed(1),
    fat: +getNutrient(f.foodNutrients, NUTRIENT.fat).toFixed(1),
    servingSize: f.servingSize ?? 100,
    servingSizeUnit: f.servingSizeUnit ?? 'g',
  }))

  return NextResponse.json({
    foods,
    totalHits: data.totalHits ?? 0,
    currentPage: data.currentPage ?? page,
  })
}
