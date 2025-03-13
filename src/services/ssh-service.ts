import { Client, type ClientChannel, type ConnectConfig, type ExecOptions } from "ssh2"
import type { RedisService } from "@/services/redis-service"

export class SshService {
    private static connections: Map<string, Client> = new Map() // Pool de conexões
    private readonly redisService: RedisService

    constructor(redisService: RedisService) {
        this.redisService = redisService
    }

    async connect(sshCredentials: ConnectConfig): Promise<void> {
        return new Promise((resolve, reject) => {
            const key = sshCredentials.host! // Usa o host como chave única

            if (SshService.connections.has(key)) {
                console.log(`Conexão reutilizada para: ${key}`)
                return resolve()
            }

            const conn = new Client()
            conn.on("ready", () => {
                console.log(`Conexão SSH estabelecida com: ${key}`)
                SshService.connections.set(key, conn) // Armazena a conexão no pool
                resolve()
            })
                .on("error", (err: Error) => {
                    reject(`Erro na conexão SSH (${key}): ${err.message}`)
                })
                .connect(sshCredentials)
        })
    }

    async execute(command: string, redisKey: string, sshCredentials: ConnectConfig): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const key = sshCredentials.host!
            let conn = SshService.connections.get(key)

            if (!conn) {
                await this.connect(sshCredentials) // Conecta caso não tenha conexão ativa
                conn = SshService.connections.get(key)
                if (!conn) {
                    return reject("Erro: Falha ao recuperar a conexão do pool.")
                }
            }

            const execOptions: ExecOptions = {}
            conn.exec(command, execOptions, (err: Error | undefined, stream: ClientChannel) => {
                if (err) {
                    return reject(`Erro ao executar comando: ${err.message}`)
                }

                let output = ""
                stream.on("data", async (data: Buffer) => {
                    output += data.toString()
                })

                stream.on("close", async () => {
                    try {
                        await this.redisService.set(redisKey, output, 300)
                    } catch (error) {
                        console.error("Erro ao salvar no Redis:", error)
                    }
                    resolve()
                })

                stream.on("error", (err: Error) => {
                    reject(`Erro no stream: ${err.message}`)
                })
            })
        })
    }

    disconnect(host: string): void {
        const conn = SshService.connections.get(host)
        if (conn) {
            conn.end()
            SshService.connections.delete(host)
            console.log(`Conexão SSH fechada para: ${host}`)
        }
    }

    static disconnectAll(): void {
        SshService.connections.forEach((conn, key) => {
            conn.end()
            console.log(`Todas as conexões foram encerradas para: ${key}`)
        })
        SshService.connections.clear()
    }
}
