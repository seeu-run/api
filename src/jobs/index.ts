import { manageWorkers } from "@/jobs/workers/worker-manager";
import { vpsCheckerProcessor } from "@/jobs/processors/vps-checker-processor";

manageWorkers("vps-monitoring", vpsCheckerProcessor)

console.log("🚀 Listener iniciado...")
