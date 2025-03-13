import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { RedisService } from "@/services/redis-service";

export async function getMonitorUpdates(app: FastifyInstance) {
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

      // ✅ Função para enviar atualizações ao cliente WebSocket
      const sendUpdate = async () => {
        if (!connection.socket || connection.socket.readyState !== 1) {
          console.warn("⚠️ WebSocket não está pronto para receber mensagens.");
          return;
        }

        try {
          const monitorKeys = await redisService.keys("vps-monitor:*");

          const monitorData = await Promise.all(
            monitorKeys.map(async (key) => {
              const data = await redisService.get(key);
              return data ? JSON.parse(data) : null;
            })
          );

          connection.socket.send(JSON.stringify(monitorData.filter(Boolean)));
        } catch (error) {
          console.error("❌ Erro ao buscar dados do Redis:", error);
        }
      };

      sendUpdate(); // ✅ Envia os dados imediatamente ao conectar

      // ✅ O WebSocket agora escuta eventos do Redis
      redisService.subscribe("monitor:update", async (monitorId) => {
        console.log(`🔄 Atualização recebida para monitor ${monitorId}`);

        if (!connection.socket || connection.socket.readyState !== 1) {
          console.warn("⚠️ WebSocket fechado antes de enviar atualização.");
          return;
        }

        try {
          const cacheKey = `vps-monitor:${monitorId}`;
          const monitorData = await redisService.get(cacheKey);

          if (monitorData) {
            connection.socket.send(monitorData);
          } else {
            console.warn(`⚠️ Nenhum dado encontrado no Redis para ${monitorId}`);
          }
        } catch (error) {
          console.error("❌ Erro ao enviar atualização pelo WebSocket:", error);
        }
      });

      connection.socket.on("close", () => {
        console.log("🔌 Cliente desconectado");
      });
    }
  );
}
