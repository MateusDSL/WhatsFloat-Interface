import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utilitários para timezone Brasil (UTC-3)
export const timezoneUtils = {
  // Converter data para timezone Brasil antes de enviar para API
  toBrazilTimezone: (date: Date): string => {
    // Ajustar para UTC-3 (Brasil)
    const brazilDate = new Date(date.getTime() - (3 * 60 * 60 * 1000));
    return brazilDate.toISOString().split('T')[0];
  },

  // Criar data no timezone Brasil
  createBrazilDate: (year: number, month: number, day: number): Date => {
    const date = new Date(year, month - 1, day); // month é 0-indexed
    // Ajustar para início do dia no timezone Brasil
    date.setHours(0, 0, 0, 0);
    return date;
  },

  // Obter início e fim do dia no timezone Brasil
  getBrazilDayRange: (date: Date): { start: Date; end: Date } => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }
};
