import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET as string

export function creerToken(userId: number, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifierToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; role: string }
  } catch {
    return null
  }
}

export async function chiffrerMotDePasse(motDePasse: string): Promise<string> {
  return await bcrypt.hash(motDePasse, 12)
}

export async function verifierMotDePasse(
  motDePasse: string,
  motDePasseChiffre: string
): Promise<boolean> {
  return await bcrypt.compare(motDePasse, motDePasseChiffre)
}