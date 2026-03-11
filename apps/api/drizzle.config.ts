import type { Config } from 'drizzle-kit'

export default {
  schema: './src/database/schema/index.ts',
  out: './src/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://owntown:owntown@localhost:5432/owntown',
  },
} satisfies Config
