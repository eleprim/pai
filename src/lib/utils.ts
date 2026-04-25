import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

export type DatePreset = 'week' | 'month' | 'quarter' | 'year' | 'all';

export function getDateRangeFromPreset(preset: DatePreset) {
  const today = new Date();
  let start = new Date();
  const end = new Date().toISOString().split('T')[0];

  switch (preset) {
    case 'week':
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(today.setDate(diff));
      break;
    case 'month':
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'quarter':
      const quarter = Math.floor(today.getMonth() / 3);
      start = new Date(today.getFullYear(), quarter * 3, 1);
      break;
    case 'year':
      start = new Date(today.getFullYear(), 0, 1);
      break;
    case 'all':
      return { start: '1900-01-01', end: '2099-12-31' };
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end
  };
}
