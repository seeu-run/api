import { prisma } from "@/lib/prisma"
import { ConnectConfig } from "ssh2"
import { getVpsMonitors } from "@/cron/monitors/get-monitors"
import { QueueService } from "@/services/queue-service"

export interface VpsMonitorDto {
    monitorId: string
    vpsCredentials: ConnectConfig
}

export class VpsMonitor {
    private readonly queueService: QueueService

    constructor(queueService: QueueService) {
        this.queueService = queueService
    }

    async execute() {
        const monitors = await getVpsMonitors()

        await Promise.all(
            monitors.map(async (monitor) => {
                const dto: VpsMonitorDto = {
                    monitorId: monitor.id,
                    vpsCredentials: {
                        host: monitor.ipAddress ?? "",
                        port: 22,
                        username: monitor.sshUser ?? "",
                        password: monitor.sshPassword ?? "",
                    },
                }

                await this.queueService.addVpsMonitor(dto)

                await Promise.all(
                    monitor.statuses.map(async (status) => {
                        await prisma.serviceStatus.update({
                            where: { id: status.id },
                            data: { checkedAt: new Date() },
                        })
                    })
                )

                console.log("🚀 Job adicionado!")
            })
        )
    }
}
