import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { ensureIsAdminOrOwner } from '@/utils/permissions'



export async function getOrganizationBilling(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/billing',
      {
        schema: {
          tags: ['Billing'],
          summary: 'Get monitoring billing information for an organization',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              billing: z.object({
                services: z.object({
                  amount: z.number(),
                  unit: z.number(),
                  price: z.number(),
                }),
                total: z.number(),
              }),
            }),
          },
        },
      },
      async (request) => {
        const { slug } = request.params
        const userId = await request.getCurrentUserId()
        const { organization } = await request.getUserMembership(slug)

        await ensureIsAdminOrOwner(userId, organization.id)

        // Definição de preços (exemplo: R$ 5,00 por serviço monitorado)
        const MONITORING_UNIT_PRICE = 5

        const amountOfServices = await prisma.serviceMonitor.count({
          where: { organizationId: organization.id },
        })

        return {
          billing: {
            services: {
              amount: amountOfServices,
              unit: MONITORING_UNIT_PRICE,
              price: amountOfServices * MONITORING_UNIT_PRICE,
            },
            total: amountOfServices * MONITORING_UNIT_PRICE,
          },
        }
      }
    )
}
