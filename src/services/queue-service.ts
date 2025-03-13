import {ConnectionOptions, Queue} from "bullmq";
import {redisConfig} from "@/utils/redisConfig";
import {VpsMonitorDto} from "@/cron/usecases/vps-monitor";

export class QueueService {
    private vpsMonitoringQueue: Queue

    constructor() {
        const redisConnection: ConnectionOptions = redisConfig;
        this.vpsMonitoringQueue = new Queue("vps-monitoring", {
            connection: redisConnection
        })
    }

    async addVpsMonitor(dto: VpsMonitorDto) {
        const message64 = Buffer.from(
            JSON.stringify(dto)
        ).toString("base64")

        const job = this.vpsMonitoringQueue.add('monitor-task', {
            message64: message64
            },
            {
                attempts: 3,
                removeOnComplete: true,
                removeOnFail: true
            })
    }
}