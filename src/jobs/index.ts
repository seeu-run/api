import { manageWorkers } from "@/jobs/workers/worker-manager";
import { vpsCheckerProcessor } from "@/jobs/processors/vps-checker-processor";

let isJobsStarted = false;

export function startJobs() {
    if (isJobsStarted) return;
    isJobsStarted = true;

    manageWorkers("vps-monitoring", vpsCheckerProcessor);
    console.log("🚀 Listener iniciado...");
}
