import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

import { ensureIsAdminOrOwner } from '@/utils/permissions'
import { ServiceStatusType, ServiceType } from '@prisma/client'

export async function getMonitors(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/monitors',
      {
        schema: {
          tags: ['Monitoring'],
          summary: 'Get all organization monitors',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              monitors: z.array(
                z.object({
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
                })
              ),
              meta: z.object({
                totalMonitors: z.number(),
                serviceUp: z.number(),
                activeAlerts: z.object({
                  critical: z.number(),
                  warning: z.number()
                })
              })
            }),
          },
        },
      },
      async (request) => {
        const { slug } = request.params
        const userId = await request.getCurrentUserId()
        const { organization } = await request.getUserMembership(slug)

        await ensureIsAdminOrOwner(userId, organization.id)
        
        const totalMonitors = await prisma.serviceMonitor.count({ where: { organizationId: organization.id } })

        const monitors = await prisma.serviceMonitor.findMany({
            where: {
              organizationId: organization.id,
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
                },
              },
            },
          })

          return { monitors, meta: {
            totalMonitors,
            serviceUp: 0,
            activeAlerts: {
              critical: 0,
              warning: 0
            }
          } }
      },
    )
}
