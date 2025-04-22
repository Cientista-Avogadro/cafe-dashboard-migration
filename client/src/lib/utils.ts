import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format numbers to hectares
export function formatHectares(value: number): string {
  return `${value} ha`;
}

// Format currency values
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Format date to Brazilian format
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const parts = dateString.split('/');
    // If already in Brazilian format (DD/MM/YYYY)
    if (parts.length === 3) return dateString;
    
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  } catch (error) {
    return dateString;
  }
}

// Get status color based on status string
export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    'Concluído': 'success',
    'Em andamento': 'warning',
    'Pendente': 'info',
    'Cancelado': 'destructive'
  };
  
  return statusMap[status] || 'default';
}

// Get icon color based on severity
export function getSeverityColor(severity: string): string {
  const severityMap: Record<string, string> = {
    'warning': 'bg-warning/10 text-warning',
    'error': 'bg-error/10 text-error',
    'info': 'bg-info/10 text-info',
    'primary': 'bg-primary/10 text-primary',
    'success': 'bg-success/10 text-success'
  };
  
  return severityMap[severity] || 'bg-slate-100 text-slate-500';
}

// Generate initials from name
export function getInitials(name: string): string {
  if (!name) return '';
  
  const parts = name.split(' ');
  if (parts.length === 1) return name.substring(0, 2).toUpperCase();
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
