import { ISystemMonitoring } from "./interfaces/system-monitoring.interface";
import { ConnectConfig } from "ssh2";
import { ILogService } from "@/services/interfaces/log-service.interface";
import { ISSHService } from "@/services/interfaces/ssh-service.interface";
import * as fs from 'fs';



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

            await this.sshService.connect(sshCredentials, organizationId)

            const command = `
                echo '{
                    "result": {
                        "data": {
                        "json": {
                            "uptime": '$(awk '{print $1}' /proc/uptime)',
                            "memInfo": {
                                "totalMemMb": '$(free -m | awk '/Mem:/ {print $2}')',
                                "usedMemMb": '$(free -m | awk '/Mem:/ {print $3}')',
                                "freeMemMb": '$(free -m | awk '/Mem:/ {print $4}')',
                                "usedMemPercentage": '$(free | awk '/Mem:/ {printf "%.2f", $3/$2 * 100}')',
                                "freeMemPercentage": '$(free | awk '/Mem:/ {printf "%.2f", $4/$2 * 100}')'
                            },
                            "diskInfo": {
                                "totalGb": "'$(df -h / | awk 'NR==2 {print $2}' | sed 's/G//')'",
                                "usedGb": "'$(df -h / | awk 'NR==2 {print $3}' | sed 's/G//')'",
                                "freeGb": "'$(df -h / | awk 'NR==2 {print $4}' | sed 's/G//')'",
                                "usedPercentage": "'$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')'",
                                "freePercentage": "'$(awk 'BEGIN {printf "%.1f", 100 - ('$(df / | awk 'NR==2 {print $5}' | sed 's/%//')') }')'"
                            },
                            "cpuInfo": {
                                "usedPercentage": '$(top -bn1 | grep '%Cpu' | awk '{print 100 - $8}')',
                                "count": '$(nproc)',
                                "loadavg": ['$(awk '{print $1","$2","$3}' /proc/loadavg)']
                            }
                        }
                        }
                    }
                }'
            `

            await this.sshService.execute(command, monitorId, organizationId)
            this.sshService.disconnect(organizationId)
        } catch (error) {
            this.logService.create(`Error: ${error}`, "ERROR", organizationId)
        }
    }
}
