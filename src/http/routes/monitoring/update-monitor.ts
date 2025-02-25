import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { ServiceType } from '@prisma/client'
import { ensureIsAdminOrOwner } from '@/utils/permissions'

export async function updateMonitoring(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/organizations/:slug/monitoring/:monitorId',
      {
        schema: {
          tags: ['Monitoring'],
          summary: 'Update a monitor',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
            monitorId: z.string().uuid(),
          }),
          body: z.object({
            name: z.string().optional(),
            type: z.nativeEnum(ServiceType).default('VPS'),
            url: z.string().nullable(),
            ipAddress: z.string().nullable(),
            sshUser: z.string().nullable(),
            sshPassword: z.string().nullable(),
            sshKey: z.string().nullable(),
          }),
          response: {
            200: z.object({
              monitorId: z.string().uuid(),
              name: z.string(),
              type: z.nativeEnum(ServiceType),
              url: z.string().nullable(),
              ipAddress: z.string().nullable(),
              sshUser: z.string().nullable(),
              sshPassword: z.string().nullable(),
              sshKey: z.string().nullable(),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug, monitorId } = request.params
        const userId = await request.getCurrentUserId()
        const { organization } = await request.getUserMembership(slug)

        await ensureIsAdminOrOwner(userId, organization.id)

        const { name, type, url, ipAddress, sshUser, sshPassword, sshKey } = request.body

        const monitor = await prisma.serviceMonitor.update({
          where: {
            id: monitorId,
          },
          data: {
            name,
            type,
            url,
            ipAddress,
            sshUser,
            sshPassword,
            sshKey,
          },
        })

        return reply.status(200).send({
          monitorId: monitor.id,
          name: monitor.name,
          type: monitor.type,
          url: monitor.url,
          ipAddress: monitor.ipAddress,
          sshUser: monitor.sshUser,
          sshPassword: monitor.sshPassword,
          sshKey: monitor.sshKey,
        })
      },
    )
}
