import type { FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import { env } from '@/env'

export async function jwtPlugin(app: FastifyInstance) {
  app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  })
}