import {SshService} from "@/services/ssh-service"
import {VpsMonitorDto} from "@/cron/usecases/vps-monitor"
import {prisma} from "@/lib/prisma";

export class VpsChecker {
    private readonly sshService: SshService


    constructor(sshService: SshService) {
        this.sshService = sshService
    }

    async execute(data: VpsMonitorDto) {
        const monitor = await prisma.serviceMonitor.findUnique({
            where: {id: data.monitorId},
            include: {
                statuses: true
            }
        })

        if (!monitor) {
            throw new Error('Monitor not founded')
        }

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
                                    "freeMemMb": '$(free -m | awk '/Mem:/ {print $7}')',
                                    "usedMemPercentage": '$(free -m | awk '/Mem:/ {printf "%.2f", ($2-$7)/$2 * 100}')',
                                    "freeMemPercentage": '$(free -m | awk '/Mem:/ {printf "%.2f", $7/$2 * 100}')'
                                },
                                "diskInfo": {
                                    "totalGb": "'$(df -BG / | awk 'NR==2 {print $2}' | sed 's/G//')'",
                                    "usedGb": "'$(df -BG / | awk 'NR==2 {print $3}' | sed 's/G//')'",
                                    "freeGb": "'$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')'",
                                    "usedPercentage": "'$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')'",
                                    "freePercentage": "'$(awk 'BEGIN {printf "%.1f", 100 - ('$(df / | awk 'NR==2 {print $5}' | sed 's/%//')') }')'"
                                },
                                "cpuInfo": {
                                    "usedPercentage": '$(top -bn1 | grep "Cpu(s)" | awk '{print 100 - $8}')',
                                    "count": '$(nproc)',
                                    "loadavg": ['$(cat /proc/loadavg | awk '{print $1","$2","$3}')'],
                                    "cpuFrequencyMHz": '$(lscpu | grep "MHz" | awk '{print $3}')',
                                    "cpuCoresUsage": ['$(mpstat -P ALL 1 1 | awk 'NR>4 {print 100 - $NF}')']
                                },
                                "network": {
                                    "publicIP": "'$(curl -s ifconfig.me)'",
                                    "internalIP": "'$(hostname -I | awk '{print $1}')'",
                                    "networkUsage": {
                                        "downloadKb": "'$(cat /sys/class/net/eth0/statistics/rx_bytes)'",
                                        "uploadKb": "'$(cat /sys/class/net/eth0/statistics/tx_bytes)'"
                                    }
                                }
                            }
                        }
                    }
                }'
            `

            await this.sshService.execute(command, data.monitorId, data.vpsCredentials)

            await Promise.all(
                monitor.statuses.map(async (status) => {
                    await prisma.serviceStatus.update({
                        where: { id: status.id },
                        data: { status: "UP" },
                    })
                })
            )
        } catch (e) {
            await Promise.all(
                monitor.statuses.map(async (status) => {
                    await prisma.serviceStatus.update({
                        where: { id: status.id },
                        data: { status: "DOWN" },
                    })
                })
            )
        }
    }
}
