import { prisma } from "@/lib/prisma";
import type { ConnectConfig } from "ssh2";
import { getVpsMonitors } from "@/cron/monitors/get-monitors";
import type { QueueService } from "@/services/queue-service";

export interface VpsMonitorDto {
    monitorId: string;
    vpsCredentials: ConnectConfig;
}

export class VpsMonitor {
    private readonly queueService: QueueService;

    constructor(queueService: QueueService) {
        this.queueService = queueService;
    }

    async execute() {
        const monitors = await getVpsMonitors();
        if (monitors.length === 0) {
            console.log("ℹ️ Nenhum monitor precisa ser verificado no momento.");
            return;
        }

        console.log(`🔍 Encontrados ${monitors.length} monitores para verificar.`);

        for (const monitor of monitors) {
            const dto: VpsMonitorDto = {
                monitorId: monitor.id,
                vpsCredentials: {
                    host: monitor.ipAddress ?? "",
                    port: 22,
                    username: monitor.sshUser ?? "",
                    password: monitor.sshPassword ?? "",
                },
            };

            await this.queueService.addVpsMonitor(dto); // ✅ Envia o job para a fila

            console.log(`🚀 Job para monitor ${monitor.id} adicionado à fila.`);

            // ✅ Atualiza os status um por um (evitando vazamento de memória com `Promise.all`)
            for (const status of monitor.statuses) {
                await prisma.serviceStatus.update({
                    where: { id: status.id },
                    data: { checkedAt: new Date() },
                });
            }
        }

        console.log("✅ Todos os monitores foram processados.");
    }
}
