export interface IRedisService {
    set(key: string, value: string, expiration: number): Promise<string>
    get(key: string): Promise<string | null>
    del(key: string): Promise<number>
    exists(key: string): Promise<boolean>
}
