import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { prisma } from '@/lib/prisma'
import { auth } from '@/http/middlewares/auth'
import { NotFoundError } from '@/http/_errors/not-found-error'
export async function getSubscriptionByOrgSlug(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/subscriptions/:slug',
      {
        schema: {
          tags: ['Subscriptions'],
          summary: 'Get subscription for a specific organization',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              id: z.string().uuid(),
              status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'CANCELED']),
              expiresAt: z.date().nullable(),
              startedAt: z.date(),
              plan: z.object({
                id: z.string().uuid(),
                name: z.string(),
                type: z.enum(['TRIAL', 'BASIC', 'PRO', 'BETA']),
              }),
              organization: z.object({
                id: z.string().uuid(),
                name: z.string(),
                slug: z.string(),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const { slug } = request.params

        const subscription = await prisma.subscription.findFirst({
          where: {
            organization: {
              slug,
              ownerId: userId,
            },
          },
          select: {
            id: true,
            status: true,
            expiresAt: true,
            startedAt: true,
            plan: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        })

        if (!subscription) {
          throw new NotFoundError('Subscription not found for this organization.')
        }

        return subscription
      },
    )
}
