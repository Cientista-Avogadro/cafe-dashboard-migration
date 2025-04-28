import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para calcular a cor com base na severidade
export function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'high':
    case 'critical':
    case 'danger':
    case 'error':
      return 'text-red-500';
    case 'medium':
    case 'warning':
      return 'text-amber-500';
    case 'low':
    case 'info':
      return 'text-blue-500';
    case 'success':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
}

// Função para calcular a cor com base no status
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'concluído':
    case 'aprovado':
    case 'ativo':
    case 'online':
    case 'success':
      return 'text-green-500';
    case 'em andamento':
    case 'pendente':
    case 'parcial':
      return 'text-amber-500';
    case 'cancelado':
    case 'rejeitado':
    case 'inativo':
    case 'offline':
    case 'error':
      return 'text-red-500';
    default:
      return 'text-slate-500';
  }
}

// Função para formatar valores monetários
export function formatCurrency(value: number, locale = 'pt-BR', currency = 'BRL'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(value);
}