import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MacroBar } from '@/components/dashboard/MacroBar'

describe('MacroBar', () => {
  it('renders the label', () => {
    render(<MacroBar label="Protein" value={80} goal={150} color="#3b82f6" />)
    expect(screen.getByText('Protein')).toBeInTheDocument()
  })

  it('displays value and goal', () => {
    render(<MacroBar label="Carbs" value={120} goal={200} color="#f59e0b" />)
    expect(screen.getByText(/120g/)).toBeInTheDocument()
    expect(screen.getByText(/200g/)).toBeInTheDocument()
  })

  it('shows correct remaining grams', () => {
    render(<MacroBar label="Fat" value={30} goal={65} color="#10b981" />)
    expect(screen.getByText('35g remaining')).toBeInTheDocument()
  })

  it('shows 0g remaining when goal is exactly met', () => {
    render(<MacroBar label="Fat" value={65} goal={65} color="#10b981" />)
    expect(screen.getByText('0g remaining')).toBeInTheDocument()
  })

  it('shows 0g remaining when value exceeds goal', () => {
    render(<MacroBar label="Protein" value={200} goal={150} color="#3b82f6" />)
    expect(screen.getByText('0g remaining')).toBeInTheDocument()
  })

  it('renders a progress bar element', () => {
    const { container } = render(
      <MacroBar label="Carbs" value={50} goal={200} color="#f59e0b" />
    )
    const bar = container.querySelector('.h-2') as HTMLElement
    expect(bar).toBeInTheDocument()
  })

  it('caps progress bar width at 100% when over goal', () => {
    const { container } = render(
      <MacroBar label="Protein" value={300} goal={150} color="#3b82f6" />
    )
    // The inner fill div has a style width set inline
    const fill = container.querySelector('[style*="width"]') as HTMLElement
    expect(fill.style.width).toBe('100%')
  })
})
