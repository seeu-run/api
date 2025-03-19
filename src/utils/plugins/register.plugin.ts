// @ts-ignore
import { AuthService } from "@/services/auth.service";
import { FastifyInstance } from "fastify";

export async function registerPlugin(app: FastifyInstance) {
    const authService = new AuthService()
    app.decorate('authService', authService)
}
