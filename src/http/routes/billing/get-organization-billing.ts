// import type { FastifyInstance } from 'fastify'
// import type { ZodTypeProvider } from 'fastify-type-provider-zod'
// import { z } from 'zod'

// import { auth } from '@/http/middlewares/auth'
// import { prisma } from '@/lib/prisma'
// import { getUserPermissions } from '@/utils/get-user-permissions'
// import { UnauthorizedError } from '@/http/_errors/unauthorized-error'

// export async function getOrganizationBilling(app: FastifyInstance) {
//   app
//     .withTypeProvider<ZodTypeProvider>()
//     .register(auth)
//     .get(
//       '/organizations/:slug/billing',
//       {
//         schema: {
//           tags: ['Billing'],
//           summary: 'Get billing information from organization',
//           security: [{ bearerAuth: [] }],
//           params: z.object({
//             slug: z.string(),
//           }),
//           response: {
//             200: z.object({
//               billing: z.object({
//                 seats: z.object({
//                   amount: z.number(),
//                   unit: z.number(),
//                   price: z.number(),
//                 }),
//                 clients: z.object({
//                   amount: z.number(),
//                   unit: z.number(),
//                   price: z.number(),
//                 }),
//                 subscriptions: z.array(
//                   z.object({
//                     planName: z.string(),
//                     price: z.number(),
//                     startDate: z.string(),
//                     endDate: z.string(),
//                     status: z.string(),
//                   }),
//                 ),
//                 payments: z.array(
//                   z.object({
//                     amount: z.number(),
//                     currency: z.string(),
//                     paymentGateway: z.string(),
//                     transactionId: z.string().nullable(),
//                     status: z.string(),
//                     date: z.string(),
//                   }),
//                 ),
//                 total: z.number(),
//               }),
//             }),
//           },
//         },
//       },
//       async (request) => {
//         const { slug } = request.params
//         const userId = await request.getCurrentUserId()
//         const { organization, membership } =
//           await request.getUserMembership(slug)

//         const { cannot } = getUserPermissions(userId, membership.role)

//         if (cannot('get', 'Billing')) {
//           throw new UnauthorizedError(
//             `You're not allowed to get billing details from this organization.`,
//           )
//         }

//         const [amountOfMembers, amountOfClients, subscriptions, payments] =
//           await Promise.all([
//             prisma.member.count({
//               where: {
//                 organizationId: organization.id,
//                 role: { not: 'BILLING' },
//               },
//             }),
//             prisma.client.count({
//               where: {
//                 organizationId: organization.id,
//               },
//             }),
//             prisma.subscription.findMany({
//               where: {
//                 userId, // Faturamento relacionado ao usuário
//               },
//               select: {
//                 plan: {
//                   select: {
//                     name: true,
//                     price: true,
//                   },
//                 },
//                 startDate: true,
//                 endDate: true,
//                 status: true,
//               },
//             }),
//             prisma.payment.findMany({
//               where: {
//                 subscription: {
//                   userId, // Faturamento do usuário
//                 },
//               },
//               select: {
//                 amount: true,
//                 currency: true,
//                 paymentGateway: true,
//                 transactionId: true,
//                 status: true,
//                 createdAt: true,
//               },
//             }),
//           ])

//         const formattedSubscriptions = subscriptions.map((subscription) => ({
//           planName: subscription.plan.name,
//           price: subscription.plan.price,
//           startDate: subscription.startDate.toISOString(),
//           endDate: subscription.endDate.toISOString(),
//           status: subscription.status,
//         }))

//         const formattedPayments = payments.map((payment) => ({
//           amount: payment.amount,
//           currency: payment.currency,
//           paymentGateway: payment.paymentGateway,
//           transactionId: payment.transactionId,
//           status: payment.status,
//           date: payment.createdAt.toISOString(),
//         }))

//         const totalPaymentsAmount = payments.reduce(
//           (total, payment) => total + payment.amount,
//           0,
//         )

//         return {
//           billing: {
//             seats: {
//               amount: amountOfMembers,
//               unit: 10,
//               price: amountOfMembers * 10,
//             },
//             clients: {
//               amount: amountOfClients,
//               unit: 20,
//               price: amountOfClients * 20,
//             },
//             subscriptions: formattedSubscriptions,
//             payments: formattedPayments,
//             total:
//               amountOfMembers * 10 + amountOfClients * 20 + totalPaymentsAmount,
//           },
//         }
//       },
//     )
// }
