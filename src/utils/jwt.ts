// lib/tokens.ts

import jwt, { SignOptions } from 'jsonwebtoken'
import { StringValue } from 'ms'

const accessSecret = process.env.JWT_ACCESS_SECRET as string
const refreshSecret = process.env.JWT_REFRESH_SECRET as string
const verifyEmailSecret = process.env.JWT_VERIFY_EMAIL_SECRET as string

const accessExpires = (process.env.JWT_ACCESS_EXPIRES || '1d') as StringValue
const refreshExpires = (process.env.JWT_REFRESH_EXPIRES || '7d') as StringValue
const verifyEmailExpires = (process.env.JWT_VERIFY_EMAIL_EXPIRES || '10m') as StringValue

const signOptionsAccess: SignOptions = { expiresIn: accessExpires }
const signOptionsRefresh: SignOptions = { expiresIn: refreshExpires }
const signOptionsVerifyEmail: SignOptions = { expiresIn: verifyEmailExpires }

export const signAccessToken = (payload: object): string => {
  return jwt.sign(payload, accessSecret, signOptionsAccess)
}

export const signRefreshToken = (payload: object): string => {
  return jwt.sign(payload, refreshSecret, signOptionsRefresh)
}

export const signVerifyEmailToken = (payload: object): string => {
  return jwt.sign(payload, verifyEmailSecret, signOptionsVerifyEmail)
}

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, accessSecret)
}

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, refreshSecret)
}

export const verifyEmailToken = (token: string) => {
  return jwt.verify(token, verifyEmailSecret)
}
