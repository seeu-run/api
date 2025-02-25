import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { roleSchema } from '../orgs/get-organizations'
import { BadRequestError } from '@/http/_errors/bad-request-error'
import { NotificationType, ServiceStatusType, ServiceType } from '@prisma/client'

export async function getMonitoring(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/monitoring/:monitorId',
    {
        schema: {
          tags: ['Monitoring'],
          summary: 'Get a monitor',
          params: z.object({
            monitorId: z.string().uuid(),
          }),
          response: {
            200: z.object({
              monitor: z.object({
                id: z.string().uuid(),
                name: z.string(),
                type: z.nativeEnum(ServiceType),
                url: z.string().nullable(),
                organizationId: z.string().uuid(),
                createdAt: z.date(),
                updatedAt: z.date(),
                ipAddress: z.string().nullable(),
                sshUser: z.string().nullable(),
                sshPassword: z.string().nullable(),
                sshKey: z.string().nullable(),
                statuses: z.array(
                  z.object({
                    id: z.string().uuid(),
                    status: z.nativeEnum(ServiceStatusType),
                    checkedAt: z.date(),
                  })
                ),
              }),
            }),
          },
        },
      },
    async (request) => {
      const { monitorId } = request.params

      const monitor = await prisma.serviceMonitor.findUnique({
        where: {
          id: monitorId
        },
        select: {
          id: true,
          name: true,
          type: true,
          url: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true,
          ipAddress: true,
          sshUser: true,
          sshPassword: true,
          sshKey: true,
          statuses: {
            select: {
              id: true,
              status: true,
              checkedAt: true,
            }
          },
          notifications: {
            select: {
              id: true,
              type: true,
              recipient: true,
              message: true,
              sentAt: true,
            }
          }
        }
      })

      if (!monitor) {
        throw new BadRequestError('Monitor not found')
      }

      return { monitor }
    }
  )
}
