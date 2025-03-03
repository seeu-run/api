import "dotenv/config"
import { Worker, Job } from "bullmq"
import { GlobalServices } from "./config/global-services"
import { GlobalUseCases } from "./config/global-usecases"

const globalServices = new GlobalServices()
const globalUseCases = new GlobalUseCases(globalServices)

const createWorker = (queueName: string, processor: (job: Job) => Promise<void>, count: number) => {
    return Array.from({ length: count }, (_, index) => {
        console.log(`🚀 Worker ${index + 1} criado para a fila: ${queueName}`)
        return new Worker(queueName, processor, {
            connection: {
                host: process.env.REDIS_HOST,
                port: Number(process.env.REDIS_PORT),
                username: process.env.REDIS_USERNAME,
                password: process.env.REDIS_PASSWORD,
            },
        })
    })
}

const systemMonitoringProcessor = async (job: Job) => {
    const { organizationId, monitorId } = job.data.arguments
    globalServices.logService.create(`Job catched: ${job.id}`, "INFO", organizationId)

    await globalUseCases.systemMonitoringUseCase.execute(job.data.message, organizationId, monitorId)
}

const systemMonitoringWorkers = createWorker("system-monitoring", systemMonitoringProcessor, 5)

systemMonitoringWorkers.forEach((worker) => {
    worker.on("completed", (job) => {
        console.log(`✅ Job completed: ${job.id}`)
    })

    worker.on("failed", (job, err) => {
        console.error(`❌ Job failed: ${job?.id ?? "unknown"}, Error: ${err.message}`)
    })
})
