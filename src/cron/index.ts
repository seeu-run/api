import cron from "node-cron";
import {QueueService} from "@/services/queue-service";
import {VpsMonitor} from "@/cron/usecases/vps-monitor";

const CRON_INTERVAL = '*/5 * * * * *'; // 5s

const queueService = new QueueService()
const vpsMonitor = new VpsMonitor(queueService)

const scheduler = async () => {
    await vpsMonitor.execute()
}

cron.schedule(CRON_INTERVAL, scheduler);

console.log("🚀 Scheduler iniciado...")
