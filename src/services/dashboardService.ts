import { tauriApi } from '@/lib/tauri-api';
import type { DashboardStats } from '@/types/index';

export const getDashboardStats = async (): Promise<DashboardStats> => {
  // Fetch from Tauri backend
  const stats = await tauriApi.dashboard.getDashboardStats();
  return stats as DashboardStats;
};
