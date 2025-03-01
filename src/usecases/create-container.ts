import { BadRequestError } from "@/http/_errors/bad-request-error";
import { NotFoundError } from "@/http/_errors/not-found-error";
import { prisma } from "@/lib/prisma";
import { RedisService } from "@/services/redis-service";
import { SSHService } from "@/services/ssh-service";
import { ConnectConfig } from "ssh2";

export class CreateContainer {
    private sshService: SSHService;
    private redisService: RedisService;
    private readonly SSH_PORT = 22

    constructor(sshService: SSHService, redisService: RedisService) {
        this.sshService = sshService;
        this.redisService = redisService;
    }

    async create(monitorId: string): Promise<void> {
        const monitor = await prisma.serviceMonitor.findUnique({
            where: { id: monitorId },
            select: {
                ipAddress: true,
                sshUser: true,
                sshPassword: true
            }
        })

        if (!monitor) {
            throw new NotFoundError("Monitor não encontrado")
        }

        const creds: ConnectConfig = {
            host: monitor.ipAddress ?? "",
            port: this.SSH_PORT,
            username: monitor.sshUser ?? "",
            password: monitor.sshPassword ?? ""
        }

        await this.sshService.connect(creds)

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
                        },
                        "network": {
                        "inputMb": '$(awk '{print $2/1024/1024}' /proc/net/dev | tail -n +3 | paste -sd+ - | bc)',
                        "outputMb": '$(awk '{print $10/1024/1024}' /proc/net/dev | tail -n +3 | paste -sd+ - | bc)'
                        }
                    }
                    }
                }
            }'
        `

        const redisKey = `ssh_output:${Date.now()}`
        await this.sshService.execute(command, this.redisService, redisKey)

        this.sshService.disconnect()
    }
}
