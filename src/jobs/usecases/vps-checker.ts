import {SshService} from "@/services/ssh-service"
import {VpsMonitorDto} from "@/cron/usecases/vps-monitor"

export class VpsChecker {
    private readonly sshService: SshService


    constructor(sshService: SshService) {
        this.sshService = sshService
    }

    async execute(data: VpsMonitorDto) {
        try {
            await this.sshService.connect(data.vpsCredentials)

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

            await this.sshService.execute(command, data.monitorId, data.vpsCredentials)
        } catch (e) {
            console.log(e)
        }
    }
}
