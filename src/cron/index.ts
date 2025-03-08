import cron from "node-cron";

const scheduler = async () => {

}

cron.schedule('*/10 * * * * *', scheduler)

console.log("🚀 Scheduler iniciado...")