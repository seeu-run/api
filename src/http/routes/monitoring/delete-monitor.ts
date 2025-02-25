import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { BadRequestError } from '@/http/_errors/bad-request-error'
import { ensureIsAdminOrOwner } from '@/utils/permissions'

export async function deleteMonitoring(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>()
  .register(auth)
  .delete(
    '/monitoring/:monitorId',
    {
      schema: {
        tags: ['Monitoring'],
        summary: 'Delete a monitor',
        params: z.object({
          monitorId: z.string().uuid(),
          slug: z.string()
        }),
        response: {
          200: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request) => {
        const { monitorId, slug } = request.params
        const userId = await request.getCurrentUserId()
        const { organization } = await request.getUserMembership(slug)

        await ensureIsAdminOrOwner(userId, organization.id)

        const monitor = await prisma.serviceMonitor.delete({
            where: {
            id: monitorId,
            },
        })

        if (!monitor) {
        throw new BadRequestError('Monitor not found')
        }

        return { message: 'Monitor deleted successfully' }
    }
  )
}
