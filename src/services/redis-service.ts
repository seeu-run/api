import Redis from 'ioredis'
import { env } from '@/env'
import type { IRedisService } from '@/services/interfaces/redis-service.interface'

export class RedisService implements IRedisService {
  private redis = new Redis(
    `redis://${env.REDIS_USERNAME}:${env.REDIS_PASSWORD}@${env.REDIS_HOST}:${env.REDIS_PORT}`
  )

  private subscriber = new Redis(
    `redis://${env.REDIS_USERNAME}:${env.REDIS_PASSWORD}@${env.REDIS_HOST}:${env.REDIS_PORT}`
  ) // ✅ Cliente separado para `subscribe`

  async set(key: string, value: string, expiration = 300) {
    try {
      return await this.redis.set(key, value, 'EX', expiration)
    } catch (error) {
      throw new Error(`Failed to set key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async get(key: string) {
    try {
      return await this.redis.get(key)
    } catch (error) {
      throw new Error(`Failed to get key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async del(key: string) {
    try {
      return await this.redis.del(key)
    } catch (error) {
      throw new Error(`Failed to delete key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async exists(key: string) {
    try {
      return (await this.redis.exists(key)) === 1
    } catch (error) {
      throw new Error(`Failed to check if key exists ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async close() {
    try {
      await this.redis.quit()
      await this.subscriber.quit() // ✅ Fechar ambas conexões corretamente
    } catch (error) {
      throw new Error(`Failed to close Redis connection: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // ✅ Método para listar todas as chaves correspondentes a um padrão
  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern)
    } catch (error) {
      throw new Error(`Failed to get keys with pattern ${pattern}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // ✅ Método para publicar eventos no Redis
  async publish(channel: string, message: string): Promise<void> {
    try {
        console.log(`📡 Tentando publicar no Redis: ${channel} ->`, message);
        if (!message) {
            console.warn("⚠️ Tentativa de publicar mensagem vazia no Redis!");
            return;
        }
        await this.redis.publish(channel, message);
        console.log(`✅ Publicado no Redis: ${channel} ->`, message);
    } catch (error) {
        console.error(`❌ Erro ao publicar no Redis (${channel}):`, error);
    }
}


  // ✅ Método para se inscrever em eventos do Redis
  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      await this.subscriber.subscribe(channel, (message) => {
        return callback(message)
      })
    } catch (error) {
      throw new Error(`Failed to subscribe to ${channel}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
