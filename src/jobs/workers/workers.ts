import { type Job, Worker } from "bullmq";
import { redisConfig } from "@/utils/redisConfig";
import { RedisService } from "@/services/redis-service";

const redisService = new RedisService();
const EXECUTION_TIME_CACHE_KEY = "worker:avg_execution_time"; // Chave no Redis para tempo médio

export const createWorker = (queueName: string, processor: (job: Job) => Promise<void>) => {
    const worker = new Worker(queueName, processor, { connection: redisConfig });

    worker.on("completed", async (job) => {
        console.log(`✅ Worker ${worker.name} - Job ${job.id} completed`);

        if (job.finishedOn && job.processedOn) {
            const executionTime = job.finishedOn - job.processedOn;

            // ✅ Garantimos que o valor do Redis seja convertido corretamente para número
            const prevExecutionTimeRaw = await redisService.get(EXECUTION_TIME_CACHE_KEY);
            const prevExecutionTime = prevExecutionTimeRaw ? Number.parseFloat(prevExecutionTimeRaw) : executionTime;

            // ✅ Calculamos a nova média corretamente
            const newAvgExecutionTime = Math.round((prevExecutionTime + executionTime) / 2);
            await redisService.set(EXECUTION_TIME_CACHE_KEY, newAvgExecutionTime.toString(), 600); // Expira em 10 min

            console.log(`📊 Tempo médio atualizado: ${newAvgExecutionTime}ms`);
        }
    });

    worker.on("failed", (job, err) => {
        console.error(`❌ Worker ${worker.name} - Job ${job?.id ?? "unknown"} failed: ${err.message}`);
    });

    return worker;
};
