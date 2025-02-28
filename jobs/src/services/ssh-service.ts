import { Client, ConnectConfig, ExecOptions, ClientChannel } from 'ssh2'
import { ISSHService } from './interfaces/ssh-service.interface'
import { ILogService } from './interfaces/log-service.interface'
import { IRedisService } from './interfaces/redis-service.interface'

export class SSHService implements ISSHService {
  private conn: Client | null = null
  private isConnected: boolean = false
  private readonly logService: ILogService
  private readonly redisService: IRedisService

  constructor(logService: ILogService, redisService: IRedisService) {
    this.logService = logService
    this.redisService = redisService
  }

  async connect(sshCredentials: ConnectConfig, organizationId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.conn) {
        this.disconnect(organizationId)
      }

      this.conn = new Client()

      this.conn.on('ready', () => {
        this.logService.create('Conexão SSH estabelecida.', 'INFO', organizationId)
        this.isConnected = true
        resolve()
      }).on('error', (err: Error) => {
        reject(`Erro na conexão SSH: ${err.message}`)
        this.logService.create('Conexão SSH negada', 'ERROR', organizationId)
      }).connect(sshCredentials)
    })
  }

  async execute(command: string, redisKey: string, organizationId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.conn || !this.isConnected) {
        reject('Erro: Nenhuma conexão SSH ativa.')
        this.logService.create('Nenhuma conexão SSH ativa', 'ERROR', organizationId)
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
          this.logService.create(chunk, 'INFO', organizationId)
          output += chunk
        })
  
        stream.on('close', async (code: number, signal: string | null) => {
  
          try {
            await this.redisService.set(redisKey, output, 300)
          } catch (error) {
            this.logService.create(`Error: ${error}`, 'ERROR', organizationId)
          }
  
          resolve()
        })
  
        stream.on('error', (err: Error) => {
          reject(`Erro no stream: ${err.message}`)
          this.logService.create(`Error: ${err.message}`, 'ERROR', organizationId)
        })
      })
    })
  }

  disconnect(organizationId: string): void {
    if (this.conn) {
      this.conn.end()
      this.isConnected = false
      this.conn = null
      this.logService.create('Sessão SSH desconectada.', 'INFO', organizationId)
    }
  }
}
