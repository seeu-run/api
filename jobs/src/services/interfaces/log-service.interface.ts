import { LogLevel } from "@prisma/client";

export interface ILogService {
    create(message: string, level: LogLevel, organizationId: string): void;
}
export { LogLevel };

