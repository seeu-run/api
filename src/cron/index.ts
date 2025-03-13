import cron from "node-cron";
import { QueueService } from "@/services/queue-service";
import { VpsMonitor } from "@/cron/usecases/vps-monitor";

const CRON_INTERVAL = "*/5 * * * * *"; // 5s
let isRunning = false;

const queueService = new QueueService();
const vpsMonitor = new VpsMonitor(queueService);

const scheduler = async () => {
    if (isRunning) {
        console.warn("⚠️ Job do cron ainda está rodando, ignorando nova execução.");
        return;
    }

    isRunning = true; // ✅ Define como "rodando"
    console.log("🚀 Iniciando execução do cron...");

    try {
        await vpsMonitor.execute();
        console.log("✅ Execução do cron finalizada com sucesso.");
    } catch (error) {
        console.error("❌ Erro ao executar o cron:", error);
    } finally {
        isRunning = false; // ✅ Libera para próxima execução
    }
};

cron.schedule(CRON_INTERVAL, scheduler);

console.log("🚀 Scheduler iniciado...");
