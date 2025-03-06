import { ILogService } from "@/services/interfaces/log-service.interface";
import { IQueueService } from "@/services/interfaces/queue-service.interface";
import { LogService } from "@/services/log-service";
import { QueueService } from "@/services/queue-service";
import {GetSshUsecase} from "@/usecases/get-ssh-usecase";


export class GlobalServices {
    public logService: ILogService
    public queueService: IQueueService
    public getSsh: GetSshUsecase

    constructor() {
        this.logService = new LogService()
        this.queueService = new QueueService(this.logService)
        this.getSsh = new GetSshUsecase()
    }
}
