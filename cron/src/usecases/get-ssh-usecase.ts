import { prisma } from "@/lib/prisma";

export interface MonitorResponse {
    ip: string;
    sshUser: string;
    sshPassword: string;
    organizationId: string;
    monitorId: string;
}

export class GetSshUsecase {
    async execute(): Promise<MonitorResponse[]> {
        const entities = await prisma.serviceMonitor.findMany({
            where: {
                type: "VPS"
            },
            select: {
                id: true,
                ipAddress: true,
                sshUser: true,
                sshPassword: true,
                organizationId: true,
                organization: {
                    select: {
                        Subscription: {
                            select: {
                                plan: {
                                    select: {
                                        checkInterval: true  // Intervalo de checagem do plano
                                    }
                                }
                            }
                        }
                    }
                },
                statuses: {
                    orderBy: {
                        checkedAt: 'desc'  // Ordenando pelos status mais recentes
                    },
                    take: 1,
                    select: {
                        checkedAt: true  // Pegando o checkedAt
                    }
                }
            }
        });

        const currentTime = new Date();  // Hora atual
        const response: MonitorResponse[] = [];

        // Percorrendo as entidades para aplicar a lógica
        for (const entity of entities) {
            const lastCheckedAt = entity.statuses[0]?.checkedAt;
            const checkInterval = entity.organization?.Subscription[0]?.plan?.checkInterval;

            console.log(lastCheckedAt)
            console.log(checkInterval)

            // Se não houver status ou intervalos de checagem, não devolve nada
            if (!lastCheckedAt || !checkInterval) continue;

            // Garantir que sshUser e sshPassword não sejam null
            const sshUser = entity.sshUser ?? '';  // Caso sshUser seja null, atribui uma string vazia
            const sshPassword = entity.sshPassword ?? '';  // Caso sshPassword seja null, atribui uma string vazia
            const ipAddress = entity.ipAddress ?? '';

            // Calculando a diferença em milissegundos entre a data atual e o último checkedAt
            const diffInMilliseconds = currentTime.getTime() - new Date(lastCheckedAt).getTime();

            // Se o tempo passado desde o último check for maior ou igual ao checkInterval, retorna as informações
            if (diffInMilliseconds >= checkInterval) {
                response.push({
                    ip: ipAddress,
                    sshUser,  // Atribuindo o valor de sshUser
                    sshPassword,  // Atribuindo o valor de sshPassword
                    organizationId: entity.organizationId,
                    monitorId: entity.id
                });
            }
        }

        return response;
    }
}
