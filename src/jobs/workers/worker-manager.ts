import { Queue, Worker, Job } from "bullmq"
import { redisConfig } from "@/utils/redisConfig"
import { createWorker } from "@/jobs/workers/workers"
import cron from "node-cron"
import { env } from "@/env"

const MAX_WORKERS = Number(env.MAX_WORKERS)
const MIN_WORKERS = Number(env.MIN_WORKERS)
const CRON_SCHEDULE = "*/1 * * * *" // A cada 1 minuto

const activeWorkers: Worker[] = []

export async function manageWorkers(queueName: string, processor: (job: Job) => Promise<void>) {
    const queue = new Queue(queueName, { connection: redisConfig })
    const worker = await createWorker(queueName, processor)
    activeWorkers.push(worker)

    cron.schedule(CRON_SCHEDULE, async () => {
        const jobCount = await queue.count()
        const neededWorkers = Math.min(MAX_WORKERS, Math.max(MIN_WORKERS, Math.ceil(jobCount / 2)))

        const diff = neededWorkers - activeWorkers.length

        console.log(`🔍 Job Count: ${jobCount}, Needed Workers: ${neededWorkers}, Active Workers: ${activeWorkers.length}`)

        if (diff > 0) {
            for (let i = 0; i < diff; i++) {
                console.log(`🚀 Criando novo worker para ${queueName}`)
                const worker = await createWorker(queueName, processor)
                activeWorkers.push(worker)
            }
        } else if (diff < 0) {
            for (let i = 0; i < Math.abs(diff); i++) {
                const worker = activeWorkers.pop()
                if (worker) {
                    console.log(`🛑 Removendo worker de ${queueName}`)
                    await worker.close()
                }
            }
        }

        console.log(`⚙️ Workers ativos: ${activeWorkers.length}`)
    })
}
