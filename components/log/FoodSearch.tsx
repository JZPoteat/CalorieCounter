'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { SearchResultCard } from '@/components/log/SearchResultCard'
import type { FoodResult } from '@/types'

function SearchSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5 rounded-lg border p-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}

interface FoodSearchProps {
  onSelect: (food: FoodResult) => void
}

export function FoodSearch({ onSelect }: FoodSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setHasSearched(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/food/search?q=${encodeURIComponent(q)}`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setResults(data.foods ?? [])
    } catch {
      setError('Search failed. Please try again.')
      setResults([])
    } finally {
      setLoading(false)
      setHasSearched(true)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  return (
    <div className="space-y-4">
      <Input
        type="search"
        placeholder="Search foods (e.g. chicken breast, oatmeal…)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />

      {loading && <SearchSkeleton />}

      {!loading && error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {!loading && !error && results.length === 0 && query.trim() && hasSearched && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No results for &ldquo;{query}&rdquo;
        </p>
      )}

      {!loading && results.length > 0 && (
        <ul className="space-y-2">
          {results.map((food) => (
            <li key={food.fdcId}>
              <SearchResultCard food={food} onSelect={onSelect} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
