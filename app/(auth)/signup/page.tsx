import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="text-center space-y-4">
      <h1 className="text-2xl font-semibold">Create an account</h1>
      <p className="text-muted-foreground">
        Public signup is not currently available.
      </p>
      <Link
        href="/login"
        className="text-sm underline underline-offset-4 hover:text-foreground text-muted-foreground"
      >
        Back to login
      </Link>
    </div>
  )
}
