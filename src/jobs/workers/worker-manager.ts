import { Queue, Worker, Job } from "bullmq";
import { redisConfig } from "@/jobs/config";
import { createWorker } from "@/jobs/workers/workers";
import cron from "node-cron";
import {env} from "@/env";

const MAX_WORKERS = Number(env.MAX_WORKERS);
const MIN_WORKERS = Number(env.MIN_WORKERS);
const CRON_SCHEDULE = '*/5 * * * *';  // A cada 5 minutos

let activeWorkers: Worker[] = [];

export async function manageWorkers(queueName: string, processor: (job: Job) => Promise<void>) {
    const queue = new Queue(queueName, { connection: redisConfig });

    cron.schedule(CRON_SCHEDULE, async () => {
        const jobCount = await queue.count();
        const neededWorkers = Math.min(
            MAX_WORKERS,
            Math.max(MIN_WORKERS, Math.ceil(jobCount / 2)));

        const diff = neededWorkers - activeWorkers.length;

        if (diff > 0) {
            for (let i = 0; i < diff; i++) {
                console.log(`🚀 Criando novo worker para ${queueName}`);
                activeWorkers.push(createWorker(queueName, processor));
            }
        } else if (diff < 0) {
            for (let i = 0; i < Math.abs(diff); i++) {
                const worker = activeWorkers.pop();
                if (worker) {
                    console.log(`🛑 Removendo worker de ${queueName}`);
                    await worker.close();
                }
            }
        }

        console.log(`⚙️ Workers ativos: ${activeWorkers.length}`);
    });
}
