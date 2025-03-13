import { app } from '@/http/app'
import { env } from '@/env'
import {QueueService} from "@/services/queue-service";
import {VpsMonitor} from "@/cron/usecases/vps-monitor";
import cron from "node-cron";
import {manageWorkers} from "@/jobs/workers/worker-manager";
import {vpsCheckerProcessor} from "@/jobs/processors/vps-checker-processor";

const queueService = new QueueService()
const vpsMonitor = new VpsMonitor(queueService)

const scheduler = async () => {
  await vpsMonitor.execute()
}

cron.schedule('*/5 * * * * *', scheduler)

console.log("🚀 Scheduler iniciado...")

manageWorkers("vps-monitoring", vpsCheckerProcessor)

console.log("🚀 Listener iniciado...")

app.listen({ port: env.PORT, host: '0.0.0.0' }).then(() => {
  const baseHost =
    env.NODE_ENV === 'dev' ? `http://localhost:${env.PORT}` : `${env.HOST}`

  console.log('🚀 HTTP Server is Running:')
  console.log(`- API: ${baseHost}/`)
  console.log(`- Swagger: ${baseHost}/docs`)
})
