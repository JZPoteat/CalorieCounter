'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export function NavigationSpinner() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  // Track the pathname at the time the click fired so we can suppress
  // the spinner when the user clicks a link to the current page.
  const clickedPathRef = useRef<string | null>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return
      // Ignore external links, hash-only links, and non-page links
      if (href.startsWith('http') || href.startsWith('mailto') || href.startsWith('#')) return
      // Extract just the pathname portion
      const targetPath = href.split('?')[0].split('#')[0]
      if (targetPath === pathname) return

      clickedPathRef.current = targetPath
      setLoading(true)
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [pathname])

  // Hide when navigation completes (pathname updates)
  useEffect(() => {
    setLoading(false)
    clickedPathRef.current = null
  }, [pathname])

  if (!loading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
      <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  )
}
