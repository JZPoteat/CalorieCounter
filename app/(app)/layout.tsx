import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { MobileNav } from '@/components/layout/MobileNav'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/log/add', label: 'Log Food' },
  { href: '/history', label: 'History' },
  { href: '/foods/custom', label: 'My Foods' },
  { href: '/settings', label: 'Settings' },
]

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          {/* Hamburger — mobile only */}
          <MobileNav links={NAV_LINKS} />

          {/* Logo */}
          <Link href="/dashboard" className="font-semibold text-lg shrink-0">
            CalTracker
          </Link>

          {/* Nav links — desktop only */}
          <nav className="hidden md:flex flex-1 items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-3 py-1.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* User + sign out */}
          <div className="flex items-center gap-3 ml-auto md:ml-0 shrink-0">
            <span className="text-sm text-muted-foreground hidden lg:block">
              {user.email}
            </span>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
