import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency: string = 'EUR') {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency,
  }).format(value)
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('pt-PT').format(new Date(date))
}