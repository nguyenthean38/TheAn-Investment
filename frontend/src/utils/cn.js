import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Gộp class Tailwind, class sau ghi đè class trước. */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
