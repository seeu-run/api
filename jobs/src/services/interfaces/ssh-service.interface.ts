import { ConnectConfig } from "ssh2";

export interface ISSHService {
    connect(sshCredentials: ConnectConfig, organizationId: string): void;
    execute(command: string, key: string, organizationId: string): void;
    disconnect(organizationId: string): void;
}
