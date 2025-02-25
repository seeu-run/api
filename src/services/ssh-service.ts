import { Client, ConnectConfig, ExecOptions, ClientChannel } from 'ssh2'

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

  async execute(command: string): Promise<void> {
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

        stream.on('data', (data: Buffer) => {
          console.log(`stdout: ${data.toString()}`)
        })

        stream.on('close', (code: number, signal: string | null) => {
          console.log(`Comando finalizado com código ${code}, sinal ${signal}`)
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
    } else {
      console.log('Nenhuma conexão ativa para desconectar.')
    }
  }
}
