import {env} from "@/env";

export const redisConfig = {
    host: env.REDIS_HOST,
    port: Number(env.REDIS_PORT),
    username: env.REDIS_USERNAME,
    password: env.REDIS_PASSWORD
}