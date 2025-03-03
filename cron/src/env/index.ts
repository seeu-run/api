import 'dotenv/config'
import { z } from 'zod'

const envSchemas = z.object({
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  NODE_ENV: z.enum(['dev', 'test', 'production']).default('dev'),
})

const _env = envSchemas.safeParse(process.env)

if (_env.success === false) {
  console.error('❌ Invalid enviroment variables', _env.error.format())

  throw new Error('Invalid enviroment variables')
}

export const env = _env.data
