import { prisma } from "@/lib/prisma";
import { ISystemMonitoring } from "./interfaces/system-monitoring.interface";
import { ConnectConfig } from "ssh2";
import { ILogService } from "@/services/interfaces/log-service.interface";
import { ISSHService } from "@/services/interfaces/ssh-service.interface";
import { randomUUID } from "crypto";

export class SystemMonitoring implements ISystemMonitoring {
    private readonly logService: ILogService
    private readonly sshService: ISSHService

    constructor(logService: ILogService, sshService: ISSHService) {
        this.logService = logService
        this.sshService = sshService
    }
 
    async execute(data: string, organizationId: string, monitorId: string): Promise<void> {
        const decodedString = Buffer.from(data, 'base64').toString('utf-8');
        this.logService.create(`Connection Config: ${decodedString}`, "INFO", organizationId)

        try {
            const sshCredentials: ConnectConfig = JSON.parse(decodedString)
            this.sshService.connect(sshCredentials, organizationId)

            this.sshService.execute('', monitorId, organizationId)
            this.sshService.disconnect(organizationId)
        } catch (error) {
            this.logService.create(`Error: ${error}`, "ERROR", organizationId)
        }
    }
}
