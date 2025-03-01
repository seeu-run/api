import { ILogService } from "@/services/interfaces/log-service.interface";
import { IQueueService } from "@/services/interfaces/queue-service.interface";
import { LogService } from "@/services/log-service";
import { QueueService } from "@/services/queue-service";


export class GlobalServices {
    public logService: ILogService
    public queueService: IQueueService

    constructor() {
        this.logService = new LogService()
        this.queueService = new QueueService(this.logService)
    }
}
