import { env } from '@/env'
import crypto from 'node:crypto'

const algorithm = 'aes-256-gcm'
const ivLength = 16 // 16 bytes para IV (Initialization Vector)

// Decodifica a chave Base64
const secretKey = env.AES_ENCRYPTION_KEY || 'default_secret_key'
const key = Buffer.from(secretKey, 'base64')

// Valida o tamanho da chave
if (key.length !== 32) {
  throw new Error(
    'Invalid AES key length. Key must be 32 bytes for AES-256-GCM.',
  )
}

/**
 * Criptografa um dado.
 */
export function encrypt(data: string): string {
  const iv = crypto.randomBytes(ivLength)
  const cipher = crypto.createCipheriv(algorithm, key, iv)

  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag().toString('hex')
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

/**
 * Descriptografa um dado.
 */
export function decrypt(data: string): string {
  const [ivHex, authTagHex, encryptedData] = data.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}