import { Module, Global } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

export const DB = Symbol('DB')

@Global()
@Module({
  providers: [
    {
      provide: DB,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const pool = new Pool({
          connectionString: config.getOrThrow('DATABASE_URL'),
          max: 20,
        })
        return drizzle(pool, { schema })
      },
    },
  ],
  exports: [DB],
})
export class DatabaseModule {}
