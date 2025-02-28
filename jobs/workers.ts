import "dotenv/config"
import { Worker } from "bullmq"
import { GlobalServices } from "./src/config/global-services"
import { GlobalUseCases } from "./src/config/global-usecases"

const globalServices = new GlobalServices()
const globalUseCases = new GlobalUseCases(globalServices)

const createWorker = (queueName: string, processor: (job) => Promise<void>) => {
    return new Worker(queueName, processor, {
        connection: {
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT),
            username: process.env.REDIS_USERNAME,
            password: process.env.REDIS_PASSWORD,
        },
    })
}

const systemMonitoringWorker = createWorker("system-monitoring", async (job) => {
    const { organizationId, monitorId } = job.data.arguments
    globalServices.logService.create(`Job catched: ${job.id}`, "INFO", organizationId)

    await globalUseCases.systemMonitoringUseCase.execute(job.data.message, organizationId, monitorId)
})

const workers = [systemMonitoringWorker]

workers.forEach((worker) => {
    worker.on("completed", (job) => {
        console.log(`✅ Job completed: ${job.id}`)
    })

    worker.on("failed", (job, err) => {
        console.error(`❌ Job failed: ${job?.id ?? "unknown"}, Error: ${err.message}`)
    })
})
