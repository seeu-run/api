import type { FastifyInstance } from 'fastify';
import { fastifyPlugin } from 'fastify-plugin';
import { prisma } from '@/lib/prisma';
import { UnauthorizedError } from '@/http/_errors/unauthorized-error';
import { NotFoundError } from '@/http/_errors/not-found-error';

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook('preHandler', async (request) => {
    request.getCurrentUserId = async () => {
      try {
        const { sub } = await request.jwtVerify<{ sub: string }>();
        return sub;
      } catch {
        throw new UnauthorizedError('Invalid token');
      }
    };

    request.getUserMembership = async (slug: string) => {
      const userId = await request.getCurrentUserId();

      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      const membership = await prisma.member.findFirst({
        where: {
          userId,
          organization: {
            slug,
          },
        },
        include: {
          organization: true,
        },
      });

      if (!membership) {
        throw new NotFoundError('User is not a member of this organization');
      }

      return {
        organization: membership.organization,
        membership,
      };
    };
  });
});
