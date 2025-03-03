import "dotenv/config";
import { Buffer } from "buffer";
import { ConnectionOptions, Queue } from "bullmq";
import { MonitorJobData, IQueueService } from "@/services/interfaces/queue-service.interface";
import { ConnectConfig } from "ssh2";
import { ILogService } from "./interfaces/log-service.interface";


export class QueueService implements IQueueService {
    private systemMonitorQueue: Queue;
    private readonly logService: ILogService;

    constructor(logService: ILogService) {
        const redisConnection: ConnectionOptions = {
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT),
            username: process.env.REDIS_USERNAME,
            password: process.env.REDIS_PASSWORD,
        }

        this.systemMonitorQueue = new Queue<MonitorJobData>("system-monitoring", {
            connection: redisConnection,
        });
        this.logService = logService
    }

    async addMonitorJob(ipAddress: string, sshUser: string, sshPassword: string, organizationId: string, monitorId: string): Promise<void> {
        const creds: ConnectConfig = {
            host: ipAddress ?? "",
            port: 22,
            username: sshUser ?? "",
            password: sshPassword ?? ""
        }

        const credsBase64 = Buffer.from(
            JSON.stringify(creds)
        ).toString('base64');

        const job = await this.systemMonitorQueue.add('monitor-task', {
            message: credsBase64,
            arguments: {
                organizationId,
                monitorId
            }
        }, {
            attempts: 3,
            removeOnComplete: true,
            removeOnFail: true
        })

        this.logService.create(`📌 Job adicionado: ${job.id} para monitor: ${ipAddress}`, "INFO", organizationId);
    }
}
