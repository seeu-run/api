import { ILogService } from "@/services/interfaces/log-service.interface";
import { IRedisService } from "@/services/interfaces/redis-service.interface";
import { ISSHService } from "@/services/interfaces/ssh-service.interface";
import { LogService } from "@/services/log-service";
import { RedisService } from "@/services/redis-service";
import { SSHService } from "@/services/ssh-service";

export class GlobalServices {
    public sshService: ISSHService
    public logService: ILogService
    public redisService: IRedisService

    constructor() {
        this.logService = new LogService()
        this.redisService = new RedisService()
        this.sshService = new SSHService(this.logService, this.redisService)
    }
}
