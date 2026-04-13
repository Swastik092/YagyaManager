import { ItemStatus } from '../data/inventoryData';

export function calculateStatus(rawQty: number, step: number): ItemStatus {
  if (rawQty <= step * 3) return 'Urgent';
  if (rawQty <= step * 6) return 'Low';
  return 'OK';
}

export function formatTime(date: Date = new Date()): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function formatRow(num: number): string {
  return `ROW ${String(num).padStart(2, '0')}`;
}
