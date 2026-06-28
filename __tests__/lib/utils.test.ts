import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('returns an empty string with no arguments', () => {
    expect(cn()).toBe('')
  })

  it('returns a single class unchanged', () => {
    expect(cn('text-sm')).toBe('text-sm')
  })

  it('joins multiple classes', () => {
    expect(cn('text-sm', 'font-bold')).toBe('text-sm font-bold')
  })

  it('ignores falsy values', () => {
    expect(cn('text-sm', false, null, undefined, '')).toBe('text-sm')
  })

  it('applies conditional classes', () => {
    expect(cn('base', true && 'active', false && 'inactive')).toBe('base active')
  })

  it('merges conflicting Tailwind classes (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles object syntax', () => {
    expect(cn({ 'text-sm': true, 'font-bold': false })).toBe('text-sm')
  })
})
