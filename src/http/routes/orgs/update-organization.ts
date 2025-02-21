import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'

import { prisma } from '@/lib/prisma'
import { ensureIsAdminOrOwner, validateUniqueDomain } from '@/utils/permissions'

export async function updateOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/organizations/:slug',
      {
        schema: {
          tags: ['Organizations'],
          summary: 'Update organization details',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
            domain: z.string().nullish(),
            shouldAttachUsersByDomain: z.boolean().optional(),
          }),
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
        const { name, domain, shouldAttachUsersByDomain } = request.body
        const userId = await request.getCurrentUserId()

        // Busca a organização pelo slug
        const organization = await prisma.organization.findFirstOrThrow({
          where: { slug },
        })

        // Valida se o usuário é ADMIN ou OWNER
        await ensureIsAdminOrOwner(userId, organization.id)

        // Valida o domínio, se fornecido
        if (domain) {
          await validateUniqueDomain(domain, organization.id)
        }

        // Atualiza os dados da organização
        await prisma.organization.update({
          where: { id: organization.id },
          data: {
            name,
            domain,
            shouldAttachUsersByDomain,
          },
        })

        return reply.status(204).send()
      },
    )
}
