import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { authComponent, createAuth } from './auth'

const http = httpRouter()

// Health check endpoint for monitoring
http.route({
  path: '/api/health',
  method: 'GET',
  handler: httpAction(async () => {
    return new Response(
      JSON.stringify({
        status: 'ok',
        layer: 'convex',
        timestamp: Date.now(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }),
})

// Register Better Auth routes with CORS for cross-origin auth requests
authComponent.registerRoutes(http, createAuth, {
  cors: {
    allowedOrigins: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  },
})

export default http
