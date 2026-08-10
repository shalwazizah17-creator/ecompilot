import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
// Provide a fallback for local development if not set
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '01234567890123456789012345678901' 
const IV_LENGTH = 16

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(text: string): string {
  try {
    const parts = text.split(':')
    if (parts.length !== 3) throw new Error('Invalid encrypted string format')
    
    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encryptedText = parts[2]
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (err) {
    throw new Error('Failed to decrypt data')
  }
}
