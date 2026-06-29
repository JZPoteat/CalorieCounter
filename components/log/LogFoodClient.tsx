'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { FoodSearch } from '@/components/log/FoodSearch'
import { ServingSelector } from '@/components/log/ServingSelector'
import { SearchResultCard } from '@/components/log/SearchResultCard'
import { Input } from '@/components/ui/input'
import type { FoodResult, CustomFood } from '@/types'

const BarcodeScanner = dynamic(
  () => import('@/components/log/BarcodeScanner').then((m) => m.BarcodeScanner),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-muted-foreground text-center py-8">Loading scanner…</p>
    ),
  },
)

type Tab = 'search' | 'custom' | 'barcode'

interface LogFoodClientProps {
  customFoods: CustomFood[]
}

function customFoodToFoodResult(food: CustomFood): FoodResult {
  return {
    fdcId: 0,
    description: food.name,
    brandOwner: null,
    calories: food.calories_per_serving,
    protein: food.protein_per_serving,
    carbs: food.carbs_per_serving,
    fat: food.fat_per_serving,
    servingSize: 1,
    servingSizeUnit: 'serving',
    servingLabel: food.serving_size ?? '1 serving',
    customFoodId: food.id,
  }
}

export function LogFoodClient({ customFoods }: LogFoodClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('search')
  const [selectedFood, setSelectedFood] = useState<FoodResult | null>(null)
  const [customQuery, setCustomQuery] = useState('')

  const filteredCustom = customFoods.filter((f) =>
    f.name.toLowerCase().includes(customQuery.toLowerCase())
  )

  const tabs: { id: Tab; label: string }[] = [
    { id: 'search', label: 'Search Foods' },
    { id: 'custom', label: `My Foods (${customFoods.length})` },
    { id: 'barcode', label: 'Scan Barcode' },
  ]

  return (
    <>
      {/* Tab switcher */}
      <div className="flex gap-1 border-b">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'search' && <FoodSearch onSelect={setSelectedFood} />}

      {activeTab === 'custom' && (
        <div className="space-y-4">
          <Input
            type="search"
            placeholder="Filter my foods…"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
          />

          {filteredCustom.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {customFoods.length === 0
                ? 'No custom foods yet. Create them in My Foods.'
                : 'No matches.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {filteredCustom.map((food) => (
                <li key={food.id}>
                  <SearchResultCard
                    food={customFoodToFoodResult(food)}
                    onSelect={setSelectedFood}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === 'barcode' && (
        <BarcodeScanner onSelect={setSelectedFood} />
      )}

      <ServingSelector food={selectedFood} onClose={() => setSelectedFood(null)} />
    </>
  )
}
