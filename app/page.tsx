import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Nav */}
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-semibold text-lg text-primary">Nibble</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 gap-6">
        <div className="space-y-3 max-w-lg">
          <h1 className="text-5xl font-bold tracking-tight text-primary">Nibble</h1>
          <p className="text-xl text-muted-foreground">Fork your calories.</p>
          <p className="text-muted-foreground">
            Track what you eat, hit your macros, and stop guessing.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/signup">Get started</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </main>

      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Nibble
      </footer>
    </div>
  )
}
