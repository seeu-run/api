import type { FastifyInstance } from 'fastify'
import fastifyRawBody from 'fastify-raw-body'

export async function rawBodyPlugin(app: FastifyInstance) {
  app.register(fastifyRawBody, {
    field: 'rawBody', // Campo onde o corpo bruto será anexado
    global: false, // Disponível para todas as rotas
    encoding: 'utf8', // Codificação padrão
    runFirst: true, // Certifica-se de executar antes de outros parsers
  })
}