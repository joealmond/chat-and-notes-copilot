import { createAuthClient } from 'better-auth/react'
import { convexClient } from '@convex-dev/better-auth/client/plugins'

// Auth requests go through the local TanStack Start server proxy at /api/auth/*
// which forwards to Convex via convexBetterAuthReactStart. No baseURL needed.
export const authClient = createAuthClient({
  plugins: [convexClient()],
})

// Export commonly used hooks and utilities
const { signIn, signOut: _signOut, useSession } = authClient

/**
 * Sign out and reload the page to reset Convex auth state.
 *
 * Without this, signing out and back in causes authenticated Convex queries
 * to fire before auth is ready — leading to errors.
 * See: https://docs.convex.dev/auth/sessions-and-tokens
 */
export const signOut = (opts?: Parameters<typeof _signOut>[0]) =>
  _signOut({
    ...opts,
    fetchOptions: {
      ...opts?.fetchOptions,
      onSuccess: (...args) => {
        opts?.fetchOptions?.onSuccess?.(...args)
        location.reload()
      },
    },
  })

export { signIn, useSession }
