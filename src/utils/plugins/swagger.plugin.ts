import type { FastifyPluginAsync } from 'fastify'
import fastifySwagger from '@fastify/swagger'
import { jsonSchemaTransform } from 'fastify-type-provider-zod'

export const swaggerPlugin: FastifyPluginAsync = async (app) => {
  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Next.js SaaS',
        description: 'Full-stack SaaS with multi-tenant & RBAC.',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    transform: jsonSchemaTransform,
  })
}