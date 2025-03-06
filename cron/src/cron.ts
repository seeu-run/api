import cron from 'node-cron';
import { GlobalServices } from './config/global-services'

const services = new GlobalServices()

const cronJob = async () => {
    const monitors = await services.getSsh.execute()

    if (monitors.length !== 0) {
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

}

cron.schedule('*/10 * * * * *', cronJob);

console.log("🚀 Cron Job iniciado...");
