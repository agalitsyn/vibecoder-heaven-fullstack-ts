import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin } from 'better-auth/plugins'
import { apiKey } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { db } from '~/db'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  basePath: '/api/auth',
  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
  ],
  emailAndPassword: { enabled: true },
  plugins: [
    admin({ defaultRole: 'user' }),
    apiKey({
      defaultPrefix: 'sk',
      apiKeyHeaders: ['x-api-key', 'authorization'],
    }),
    tanstackStartCookies(), // must be last plugin
  ],
})
