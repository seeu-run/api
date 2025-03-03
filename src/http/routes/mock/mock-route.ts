import { SubscriptionType } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { prisma } from '@/lib/prisma'
import { auth } from '@/http/middlewares/auth'
import { RedisService } from '@/services/redis-service'
import { ensureIsAdminOrOwner } from '@/utils/permissions'
import { LogService } from '@/services/log-service'

export async function mockTestRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/mock/:slug',
      {
        schema: {
          params: z.object({
            slug: z.string()
          }),
          querystring: z.object({
            monitorId: z.string()
          }),
          security: [{
            bearerAuth: []
          }]
        }
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const { slug } = request.params
        const { monitorId } = request.query

        const { organization } = await request.getUserMembership(slug)
        await ensureIsAdminOrOwner(userId, organization.id)

        const logService = new LogService()
        const redisService = new RedisService()

        return reply.send()
      },
    )
}
