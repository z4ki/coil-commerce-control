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

export interface PaginatedAuditLogResult {
  rows: AuditLog[];
  total: number;
}

export async function getAuditLog(page: number = 1, pageSize: number = 50): Promise<PaginatedAuditLogResult> {
  return await core.invoke<PaginatedAuditLogResult>('get_audit_log', { page, page_size: pageSize });
} 