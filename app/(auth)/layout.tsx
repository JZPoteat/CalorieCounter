export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-background">
      <div className="text-center">
        <p className="text-4xl font-bold tracking-tight text-primary">Nibble</p>
        <p className="text-sm text-muted-foreground mt-1">Fork your calories.</p>
      </div>
      <div className="w-full max-w-sm px-4">{children}</div>
    </div>
  )
}
