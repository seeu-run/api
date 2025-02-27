import Redis, { Redis as RedisClient } from 'ioredis'
import { env } from '@/env'


export class RedisService {
  private redis: RedisClient

  constructor() {
    this.redis = new Redis(env.REDIS_URL)
  }

  async set(key: string, value: string, expiration: number = 300): Promise<string> {
    try {
      return await this.redis.set(key, value, 'EX', expiration)
    } catch (error: unknown) {
      if (error instanceof Error) 
        throw new Error(`Failed to set key ${key}: ${error.message}`)
      throw new Error(`Failed to set key ${key}: Unknown error`)
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key)
    } catch (error: unknown) {
      if (error instanceof Error) 
        throw new Error(`Failed to get key ${key}: ${error.message}`)
      throw new Error(`Failed to get key ${key}: Unknown error`)
    }
  }

  async del(key: string): Promise<number> {
    try {
      return await this.redis.del(key)
    } catch (error: unknown) {
      if (error instanceof Error) 
        throw new Error(`Failed to delete key ${key}: ${error.message}`)
      throw new Error(`Failed to delete key ${key}: Unknown error`)
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key)
      return result === 1
    } catch (error: unknown) {
      if (error instanceof Error) 
        throw new Error(`Failed to check if key exists ${key}: ${error.message}`)
      throw new Error(`Failed to check if key exists ${key}: Unknown error`)
    }
  }

  async close(): Promise<void> {
    try {
      await this.redis.quit()
    } catch (error: unknown) {
      if (error instanceof Error) 
        throw new Error(`Failed to close Redis connection: ${error.message}`)
      throw new Error(`Failed to close Redis connection: Unknown error`)
    }
  }
}
