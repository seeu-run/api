import { Queue, type Worker, type Job } from "bullmq";
import { redisConfig } from "@/utils/redisConfig";
import { createWorker } from "@/jobs/workers/workers";
import { env } from "@/env";
import { RedisService } from "@/services/redis-service";

const redisService = new RedisService();
const MAX_WORKERS = Number(env.MAX_WORKERS) || 5;
const MIN_WORKERS = Number(env.MIN_WORKERS) || 1;
const activeWorkers: Worker[] = [];
const EXECUTION_TIME_CACHE_KEY = "worker:avg_execution_time"; // Chave no Redis para tempo médio

export async function manageWorkers(queueName: string, processor: (job: Job) => Promise<void>) {
    const queue = new Queue(queueName, {
        connection: redisConfig,
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: "fixed", delay: 5000 },
            removeOnComplete: true,
            removeOnFail: false,
        },
    });

    const adjustWorkers = async () => {
        const jobCount = await queue.count();

        // ✅ Garantimos que `avgExecutionTime` seja um número válido
        const avgExecutionTimeRaw = await redisService.get(EXECUTION_TIME_CACHE_KEY);
        const avgExecutionTime = avgExecutionTimeRaw ? Number.parseFloat(avgExecutionTimeRaw) : 5000;

        // ✅ Agora calculamos os workers com base no tempo médio
        const neededWorkers = Math.min(
            MAX_WORKERS,
            Math.max(MIN_WORKERS, Math.ceil((jobCount * avgExecutionTime) / 10000))
        );

        const diff = neededWorkers - activeWorkers.length;
        console.log(`🔍 Job Count: ${jobCount}, Needed Workers: ${neededWorkers}, Active Workers: ${activeWorkers.length}`);

        if (diff > 0) {
            for (let i = 0; i < diff; i++) {
                console.log(`🚀 Criando novo worker para ${queueName}`);
                const worker = createWorker(queueName, processor);
                activeWorkers.push(worker);
            }
        } else if (diff < 0) {
            for (let i = 0; i < Math.abs(diff); i++) {
                const worker = activeWorkers.pop();
                if (worker) {
                    console.log(`🛑 Fechando worker de ${queueName}`);
                    await worker.close();
                }
            }
        }

        console.log(`⚙️ Workers ativos: ${activeWorkers.length}`);
    };

    queue.on("waiting", adjustWorkers);
}
