import jwt from "jsonwebtoken"
import { NextRequest } from "next/server"

export interface AuthPayload {
  userId: string
  email: string
}

export function authenticate(req: NextRequest): AuthPayload | null {
  const header = req.headers.get("authorization")
  if (!header?.startsWith("Bearer ")) return null
  try {
    return jwt.verify(header.slice(7), process.env.JWT_SECRET!) as AuthPayload
  } catch {
    return null
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "7d" })
}
