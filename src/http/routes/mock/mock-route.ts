import { SubscriptionType } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { prisma } from '@/lib/prisma'
import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/_errors/bad-request-error'
import { CreateContainer } from '@/usecases/create-container'
import { RedisService } from '@/services/redis-service'
import { SSHService } from '@/services/ssh-service'
import { ensureIsAdminOrOwner } from '@/utils/permissions'

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

        const sshService = new SSHService()
        const redisService = new RedisService()
        const idk = new CreateContainer(sshService, redisService)

        idk.create(monitorId)

        return reply.send()
      },
    )
}
