import type { FoodResult } from '@/types'

interface SearchResultCardProps {
  food: FoodResult
  onSelect: (food: FoodResult) => void
}

function MacroPill({ label, value }: { label: string; value: number }) {
  return (
    <span className="text-xs text-muted-foreground">
      <span className="font-medium text-foreground">{value}g</span> {label}
    </span>
  )
}

export function SearchResultCard({ food, onSelect }: SearchResultCardProps) {
  return (
    <button
      onClick={() => onSelect(food)}
      className="w-full text-left rounded-lg border p-3 hover:bg-accent transition-colors space-y-1"
    >
      <p className="font-medium text-sm leading-snug">{food.description}</p>
      {food.brandOwner && (
        <p className="text-xs text-muted-foreground">{food.brandOwner}</p>
      )}
      <div className="flex items-center gap-3 pt-0.5">
        <span className="text-xs font-semibold">{food.calories} kcal</span>
        <span className="text-muted-foreground text-xs">·</span>
        <MacroPill label="protein" value={food.protein} />
        <span className="text-muted-foreground text-xs">·</span>
        <MacroPill label="carbs" value={food.carbs} />
        <span className="text-muted-foreground text-xs">·</span>
        <MacroPill label="fat" value={food.fat} />
        <span className="ml-auto text-xs text-muted-foreground">
          per {food.servingLabel ?? `${food.servingSize}${food.servingSizeUnit}`}
        </span>
      </div>
    </button>
  )
}
