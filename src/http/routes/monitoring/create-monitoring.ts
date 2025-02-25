import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

import { ServiceType } from '@prisma/client'
import { ensureIsAdminOrOwner } from '@/utils/permissions'

export async function createMonitoring(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/monitoring',
      {
        schema: {
          tags: ['Monitoring'],
          summary: 'Create a new monitor',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
            type: z.nativeEnum(ServiceType).default('VPS'),
          }),
          params: z.object({
            slug: z.string(),
          }),
          response: {
            201: z.object({
                monitorId: z.string().uuid(),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const userId = await request.getCurrentUserId()
        const { organization } = await request.getUserMembership(slug)

        const {name, type} = request.body

        await ensureIsAdminOrOwner(userId, organization.id)

        const monitor = await prisma.serviceMonitor.create({
            data: {
                name: name,
                type: type,
                organizationId: organization.id
            }
        })

        await prisma.serviceStatus.create({
            data: {
                serviceId: monitor.id,
                status: 'UNKNOWN'
            }
        })

        return reply.status(201).send({
            monitorId: monitor.id
        })
      },
    )
}
