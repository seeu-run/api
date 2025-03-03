import { ISystemMonitoring } from "@/usecases/interfaces/system-monitoring.interface";
import { GlobalServices } from "./global-services";
import { SystemMonitoring } from "@/usecases/system-monitoring";

export class GlobalUseCases {
    public systemMonitoringUseCase: ISystemMonitoring

    constructor(services: GlobalServices) {
        this.systemMonitoringUseCase = new SystemMonitoring(services.logService, services.sshService)
    }
}
