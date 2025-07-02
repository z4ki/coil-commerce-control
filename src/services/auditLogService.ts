import { core } from '@tauri-apps/api';

export interface AuditLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id?: string | null;
  timestamp: string;
  details?: string | null;
}

export async function getAuditLog(): Promise<AuditLog[]> {
  return await core.invoke<AuditLog[]>('get_audit_log');
} 