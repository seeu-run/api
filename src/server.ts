import { app } from '@/http/app';
import { env } from '@/env';
import { manageWorkers } from "@/jobs/workers/worker-manager";
import { vpsCheckerProcessor } from "@/jobs/processors/vps-checker-processor";
import "@/cron"

console.log("🚀 Scheduler e Listener iniciados...");

manageWorkers("vps-monitoring", vpsCheckerProcessor);

app.listen({ port: env.PORT, host: '0.0.0.0' }).then(() => {
    const baseHost =
        env.NODE_ENV === 'dev' ? `http://localhost:${env.PORT}` : `${env.HOST}`;

    console.log('🚀 HTTP Server is Running:');
    console.log(`- API: ${baseHost}/`);
    console.log(`- Swagger: ${baseHost}/docs`);
});
