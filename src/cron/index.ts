import cron from "node-cron";
import {QueueService} from "@/services/queue-service";
import {VpsMonitor} from "@/cron/usecases/vps-monitor";

const queueService = new QueueService()
const vpsMonitor = new VpsMonitor(queueService)

const scheduler = async () => {
    await vpsMonitor.execute()
}

cron.schedule('*/5 * * * * *', scheduler)

console.log("🚀 Scheduler iniciado...")
