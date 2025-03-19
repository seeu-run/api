import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

import { ServiceType } from '@prisma/client'
import { ensureIsAdminOrOwner } from '@/utils/permissions'
import { hash } from 'bcryptjs'
import {CryptService} from "@/services/crypt-service";

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
            url: z.string().nullable(),
            ipAddress: z.string().nullable(),
            sshUser: z.string().nullable().default('root'),
            sshPassword: z.string().nullable(),
            sshKey: z.string().nullable(),
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
        await ensureIsAdminOrOwner(userId, organization.id)

        const {name, type, url, ipAddress, sshKey, sshPassword, sshUser} = request.body;

        const cryptService = new CryptService();

        const ipHash = cryptService.encript(ipAddress ?? '')
        const sshPwdHash = cryptService.encript(sshPassword ?? '')

        const monitor = await prisma.serviceMonitor.create({
            data: {
                name,
                type,
                url,
                ipAddress: ipHash,
                sshKey,
                sshPassword: sshPwdHash,
                sshUser,
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
