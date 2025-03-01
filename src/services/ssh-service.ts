import { Client, ConnectConfig, ExecOptions, ClientChannel } from 'ssh2'
import { RedisService } from './redis-service'

export class SSHService {
  private conn: Client | null = null
  private isConnected: boolean = false

  async connect(sshCredentials: ConnectConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.conn) {
        this.disconnect()
      }

      this.conn = new Client()

      this.conn.on('ready', () => {
        console.log('Conexão SSH estabelecida.')
        this.isConnected = true
        resolve()
      }).on('error', (err: Error) => {
        reject(`Erro na conexão SSH: ${err.message}`)
      }).connect(sshCredentials)
    })
  }

  async execute(command: string, redisService: RedisService, redisKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.conn || !this.isConnected) {
        reject('Erro: Nenhuma conexão SSH ativa.')
        return
      }
  
      const execOptions: ExecOptions = {}
      this.conn.exec(command, execOptions, (err: Error | undefined, stream: ClientChannel) => {
        if (err) {
          reject(`Erro ao executar comando: ${err.message}`)
          return
        }
  
        let output = ''
  
        stream.on('data', async (data: Buffer) => {
          const chunk = data.toString()
          console.log(`stdout: ${chunk}`)
          output += chunk
        })
  
        stream.on('close', async (code: number, signal: string | null) => {
          console.log(`Comando finalizado com código ${code}, sinal ${signal}`)
  
          try {
            await redisService.set(redisKey, output)
            console.log(`Saída salva no Redis com a chave: ${redisKey}`)
          } catch (error) {
            console.error('Erro ao salvar no Redis:', error)
          }
  
          resolve()
        })
  
        stream.on('error', (err: Error) => {
          reject(`Erro no stream: ${err.message}`)
        })
      })
    })
  }

  disconnect(): void {
    if (this.conn) {
      this.conn.end()
      this.isConnected = false
      this.conn = null
      console.log('Sessão SSH desconectada.')
    }
  }
}
