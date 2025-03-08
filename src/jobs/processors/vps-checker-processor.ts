import { Job } from "bullmq";

export const vpsCheckerProcessor = async (job: Job) => {
    console.log(`🔄 Processando job ${job.id}`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log(`✅ Job ${job.id} concluído.`);
};
