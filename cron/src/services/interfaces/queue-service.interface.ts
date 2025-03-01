import { ServiceMonitor } from "@prisma/client";

export interface MonitorJobData {
    message: string;
    timestamp: number;
}

export interface IQueueService {
    addMonitorJob(ipAddress: string, sshUser: string, sshPassword: string, organizationId: string, monitorId: string): void;
}
