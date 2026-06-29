'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { NavigationSpinner } from '@/components/layout/NavigationSpinner'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <NavigationSpinner />
    </NextThemesProvider>
  )
}
