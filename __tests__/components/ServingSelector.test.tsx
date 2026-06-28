import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ServingSelector } from '@/components/log/ServingSelector'
import type { FoodResult } from '@/types'

vi.mock('@/actions/food-entries', () => ({
  addFoodEntry: vi.fn().mockResolvedValue(undefined),
}))

// Radix Dialog uses scrollIntoView on focus which jsdom doesn't implement
window.HTMLElement.prototype.scrollIntoView = vi.fn()

import { addFoodEntry } from '@/actions/food-entries'

const mockFood: FoodResult = {
  fdcId: 1001,
  description: 'Whole Milk',
  brandOwner: 'Test Brand',
  calories: 61,
  protein: 3.2,
  carbs: 4.8,
  fat: 3.3,
  servingSize: 100,
  servingSizeUnit: 'ml',
}

describe('ServingSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing (closed dialog) when food is null', () => {
    render(<ServingSelector food={null} onClose={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders the food name in the dialog title', () => {
    render(<ServingSelector food={mockFood} onClose={vi.fn()} />)
    expect(screen.getByText('Whole Milk')).toBeInTheDocument()
  })

  it('renders the brand name', () => {
    render(<ServingSelector food={mockFood} onClose={vi.fn()} />)
    expect(screen.getByText('Test Brand')).toBeInTheDocument()
  })

  it('shows correct macro preview at qty=1', () => {
    render(<ServingSelector food={mockFood} onClose={vi.fn()} />)
    expect(screen.getByText('61 kcal')).toBeInTheDocument()
    expect(screen.getByText('3.2g')).toBeInTheDocument() // protein
    expect(screen.getByText('4.8g')).toBeInTheDocument() // carbs
    expect(screen.getByText('3.3g')).toBeInTheDocument() // fat
  })

  it('updates macro preview when quantity changes', async () => {
    const user = userEvent.setup()
    render(<ServingSelector food={mockFood} onClose={vi.fn()} />)

    const input = screen.getByRole('spinbutton')
    await user.clear(input)
    await user.type(input, '2')

    // 61 * 2 = 122 kcal, protein 3.2 * 2 = 6.4g
    await waitFor(() => {
      expect(screen.getByText('122 kcal')).toBeInTheDocument()
      expect(screen.getByText('6.4g')).toBeInTheDocument()
    })
  })

  it('calls addFoodEntry with correct data when Log food is clicked', async () => {
    const user = userEvent.setup()
    render(<ServingSelector food={mockFood} onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /log food/i }))

    await waitFor(() => {
      expect(addFoodEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          food_name: 'Whole Milk',
          calories: 61,
          protein: 3.2,
          carbs: 4.8,
          fat: 3.3,
          serving_qty: 1,
        })
      )
    })
  })

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ServingSelector food={mockFood} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
