import { createFileRoute, redirect } from '@tanstack/react-router'
import { signIn } from '@/lib/auth-client'
import { LogIn } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const Route = createFileRoute('/')({
  beforeLoad: async ({ context }) => {
    if (context.isAuthenticated) {
      throw redirect({ to: '/notes' })
    }
  },
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-sm">
        <h1 className="text-xl font-medium text-foreground mb-1">Workspace</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Notes, chat, and publishing in one place.
        </p>
        <Button
          onClick={() => signIn.social({ provider: 'google' })}
          className="gap-2"
        >
          <LogIn className="w-4 h-4" />
          Sign in with Google
        </Button>
      </div>
    </div>
  )
}
