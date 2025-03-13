import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { RedisService } from "@/services/redis-service";

export async function getMonitorUpdatesWs(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/ws/monitors",
    {
      websocket: true,
      schema: {
        tags: ["WebSockets"],
        summary: "Real-time monitor updates",
      },
    },
    async (connection) => {
      console.log("🔌 Cliente conectado ao WebSocket");

      const redisService = new RedisService();

      // ✅ Enviar os dados mais recentes ao cliente assim que ele se conectar
      const sendUpdate = async () => {
        const monitorKeys = await redisService.keys("vps-monitor:*");

        const monitorData = await Promise.all(
          monitorKeys.map(async (key) => {
            const data = await redisService.get(key);
            return data ? JSON.parse(data) : null; // ✅ Agora garantimos que não passamos null para JSON.parse()
          })
        );

        connection.socket.send(JSON.stringify(monitorData.filter(Boolean))); // ✅ Remove valores nulos
      };

      sendUpdate(); // ✅ Envia os dados imediatamente ao conectar

      // ✅ O WebSocket agora escuta eventos do Redis
      redisService.subscribe("monitor:update", async (monitorId) => {
        console.log(`🔄 Atualização recebida para monitor ${monitorId}`);

        // Buscar os dados mais recentes do Redis antes de enviar ao frontend
        const cacheKey = `vps-monitor:${monitorId}`;
        const monitorData = await redisService.get(cacheKey);

        if (monitorData) {
          connection.socket.send(monitorData);
        } else {
          console.warn(`⚠️ Nenhum dado encontrado no Redis para ${monitorId}`);
        }
      });

      connection.socket.on("close", () => {
        console.log("🔌 Cliente desconectado");
      });
    }
  );
}
