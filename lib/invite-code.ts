import { customAlphabet } from 'nanoid'

// Use a custom alphabet without ambiguous characters (0, O, I, l, 1)
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const nanoid = customAlphabet(alphabet, 10)

export function generateInviteCode(): string {
  return nanoid()
}

export function validateInviteCode(code: string): boolean {
  // Check if code is 10 characters and only contains valid characters
  return /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{10}$/.test(code)
}
