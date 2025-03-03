import { GlobalServices } from './config/global-services'

const services = new GlobalServices()

const cronJob = async () => {
    const monitors = [
        { 
            ip: "46.202.150.216", 
            sshUser: "root", 
            sshPassword: "G0(sd7Zzp)tJy;XI68Xk", 
            organizationId: "7175bd0e-1c67-4e9f-951c-857737bc7989", monitorId: "48b67cab-60d6-4ca1-b036-d84c3dad4616" },
    ];

    for (const monitor of monitors) {
        await services.queueService.addMonitorJob(
            monitor.ip,
            monitor.sshUser,
            monitor.sshPassword,
            monitor.organizationId,
            monitor.monitorId
        )
        console.log('Job adicionado')
    }
}

setInterval(cronJob, 1 * 30 * 500)

console.log("🚀 Cron Job iniciado...");
