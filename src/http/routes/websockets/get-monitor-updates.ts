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

      // ✅ Função para verificar se o WebSocket está pronto
      const isSocketReady = () =>
        connection.socket && connection.socket.readyState === 1;

      // ✅ Função para enviar atualizações ao cliente WebSocket
      const sendUpdate = async () => {
        let attempts = 0;
        const maxAttempts = 5;
      
        while (attempts < maxAttempts) {
          if (isSocketReady()) {
            break;
          }
          console.warn(`⚠️ WebSocket não está pronto. Tentando novamente (${attempts + 1}/${maxAttempts})`);
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Espera 1 segundo antes de tentar de novo
          attempts++;
        }
      
        if (!isSocketReady()) {
          console.warn("❌ WebSocket não respondeu após várias tentativas.");
          return;
        }
      
        try {
          const monitorKeys = await redisService.keys("vps-monitor:*");
      
          if (!monitorKeys.length) {
            console.warn("⚠️ Nenhum monitor encontrado no Redis.");
            return;
          }
      
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
        if (!monitorId || typeof monitorId !== "string") {
          console.warn("⚠️ Evento do Redis recebido sem um monitorId válido:", monitorId);
          return;
        }
      
        console.log(`🔄 Atualização recebida para monitor ${monitorId}`);
      
        if (!isSocketReady()) {
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
