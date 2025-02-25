import fastify from 'fastify'
import { errorHandler } from '@/http/middlewares/error-handler'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import fastifyJwt from '@fastify/jwt'
import { env } from '@/env'
import { fastifyRawBody } from 'fastify-raw-body'
import fastifyCors from '@fastify/cors'
import { authenticateWithPassword } from './routes/auth/authenticate-with-password'
import { createAccount } from './routes/auth/create-account'

import { getProfile } from './routes/auth/get-profile'
import { createOrganization } from './routes/orgs/create-organization'
import { getOrganization } from './routes/orgs/get-organization'
import { getOrganizations } from './routes/orgs/get-organizations'
import { shutdownOrganization } from './routes/orgs/shutdown-organization'
import { transferOrganization } from './routes/orgs/transfer-organization'
import { updateOrganization } from './routes/orgs/update-organization'
import { getMembership } from './routes/orgs/get-membership'

import { requestPasswordRecover } from './routes/auth/request-password-recover'
import { resetPassword } from './routes/auth/reset-password'
import { createMonitoring } from './routes/monitoring/create-monitoring'
import { deleteMonitoring } from './routes/monitoring/delete-monitor'
import { getMonitoring } from './routes/monitoring/get-monitoring'
import { getMonitors } from './routes/monitoring/get-monitors'
import { updateMonitoring } from './routes/monitoring/update-monitor'

export const app = fastify().withTypeProvider<ZodTypeProvider>()

app.register(fastifyRawBody, { field: 'rawBody', runFirst: true })

app.register(fastifyCors)

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
})
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

app.register(fastifySwaggerUi, {
  routePrefix: '/docs',
})

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)
app.setErrorHandler(errorHandler)


// Auth
app.register(createAccount)
app.register(authenticateWithPassword)
app.register(getProfile)
app.register(requestPasswordRecover)
app.register(resetPassword)

// Organizations
app.register(createOrganization)
app.register(getOrganizations)
app.register(getOrganization)
app.register(shutdownOrganization)
app.register(transferOrganization)
app.register(updateOrganization)
app.register(getMembership)


// Monitoring
app.register(createMonitoring)
app.register(deleteMonitoring)
app.register(getMonitoring)
app.register(getMonitors)
app.register(updateMonitoring)

// Invites
// app.register(acceptInvite)
// app.register(createInvite)
// app.register(getInvite)
// app.register(getInvites)
// app.register(getPendingInvites)
// app.register(rejectInvite)
// app.register(revokeInvite)

// Members
// app.register(getMembers)
// app.register(removeMember)
// app.register(updateMember)

// Billing
// app.register(getOrganizationBilling)
