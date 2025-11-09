import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  }

  return new Intl.DateTimeFormat('en-US', defaultOptions).format(
    typeof date === 'string' ? new Date(date) : date
  )
}

export function formatTime(date: string | Date): string {
  return formatDate(date, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDateShort(date: string | Date): string {
  return formatDate(date, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function isDatePast(date: string | Date): boolean {
  const now = new Date()
  const checkDate = typeof date === 'string' ? new Date(date) : date
  return checkDate < now
}

export function generateDeviceFingerprint(): string {
  // Simple device fingerprint based on browser and screen info
  const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : ''
  const screenRes = typeof window !== 'undefined'
    ? `${window.screen.width}x${window.screen.height}`
    : ''
  const language = typeof window !== 'undefined' ? window.navigator.language : ''

  const fingerprint = `${userAgent}-${screenRes}-${language}`

  // Simple hash function
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }

  return Math.abs(hash).toString(36)
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export function validatePhone(phone: string): boolean {
  // Simple North American phone validation
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length === 10 || cleaned.length === 11
}
