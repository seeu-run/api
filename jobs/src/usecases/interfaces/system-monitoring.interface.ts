export interface ISystemMonitoring {
    execute(data: string, organizationId: string, monitorId: string): Promise<void>
}
