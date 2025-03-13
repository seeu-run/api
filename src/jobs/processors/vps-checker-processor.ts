import { Job } from "bullmq"
import {VpsChecker} from "@/jobs/usecases/vps-checker"
import {SshService} from "@/services/ssh-service"
import {RedisService} from "@/services/redis-service"
import {VpsMonitorDto} from "@/cron/usecases/vps-monitor"

const redisService = new RedisService()
const sshService = new SshService(redisService)
const vpsChecker = new VpsChecker(sshService)

export const vpsCheckerProcessor = async (job: Job) => {
    console.log(`🔄 Processando job ${job.id}`)
    const decodedData: VpsMonitorDto = JSON.parse(Buffer.from(job.data.message64, "base64").toString("utf-8"))

    await vpsChecker.execute(decodedData)
    console.log(`✅ Job ${job.id} concluído.`)
}
