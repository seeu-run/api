import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

import { auth } from '@/http/middlewares/auth'

import { ensureIsOwner } from '@/utils/permissions'

export async function shutdownOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/organizations/:slug',
      {
        schema: {
          tags: ['Organizations'],
          summary: 'Shutdown Organization',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params

        // Obtém o ID do usuário autenticado
        const userId = await request.getCurrentUserId()

        // Busca a organização pelo slug
        const organization = await prisma.organization.findFirstOrThrow({
          where: { slug },
        })

        // Verifica se o usuário é o OWNER
        await ensureIsOwner(userId, organization.id)

        // Exclui a organização
        await prisma.organization.delete({
          where: {
            id: organization.id,
          },
        })

        return reply.status(204).send()
      },
    )
}
