import { Job, Worker } from "bullmq"
import { redisConfig } from "@/utils/redisConfig"

export const createWorker = (
    queueName: string,
    processor: (job: Job) => Promise<void>) => {
    const worker = new Worker(queueName, processor, { connection: redisConfig })

    worker.on("completed", (job) => {
        console.log(`✅ Job completed: ${job.id}`)
    })

    worker.on("failed", (job, err) => {
        console.error(`❌ Job failed: ${job?.id ?? "unknown"}, Error: ${err.message}`)
    })

    return worker
}
