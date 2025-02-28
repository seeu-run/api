// LogService.ts
import { prisma } from '@/lib/prisma';
import { ILogService, LogLevel } from '@/services/interfaces/log-service.interface';

export class LogService implements ILogService {
    async create(message: string, level: LogLevel, organizationId: string): Promise<void> {

        const log = await prisma.log.create({
            data: {
                message,
                level,
                organizationId
            }
        })

        console.log(`(${log.timestamp}) | ${level} - ${message}`);
    }
}
