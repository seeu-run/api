import type { Job } from "bullmq"
import {VpsChecker} from "@/jobs/usecases/vps-checker"
import {SshService} from "@/services/ssh-service"
import {RedisService} from "@/services/redis-service"
import type {VpsMonitorDto} from "@/cron/usecases/vps-monitor"

const redisService = new RedisService()
const sshService = new SshService(redisService)
const vpsChecker = new VpsChecker(sshService)

const MAX_AGE = 60 * 60 * 1000; // 1h

export const vpsCheckerProcessor = async (job: Job) => {
    console.log(`🔄 Processando job ${job.id}`);

    // ✅ Verifica se o job é antigo demais
    const jobAge = Date.now() - job.timestamp;
    if (jobAge > MAX_AGE) {
        console.warn(`⏳ Ignorando job ${job.id}, pois tem mais de ${jobAge / 1000}s`);
        return; // ❌ Não processamos jobs muito antigos
    }

    // Decodifica os dados do job
    const decodedData: VpsMonitorDto = JSON.parse(
        Buffer.from(job.data.message64, "base64").toString("utf-8")
    );

    await vpsChecker.execute(decodedData);

    console.log(`✅ Job ${job.id} concluído.`);
};
