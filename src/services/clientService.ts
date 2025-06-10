import { LocalAdapter } from './database/localAdapter';
import type { Client } from '@/types/index';

const localAdapter = new LocalAdapter();

function dbToClient(row: any): Client {
  return {
    id: row.id,
    name: row.name,
    company: row.company ?? undefined,
    address: row.address ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    nif: row.nif ?? undefined,
    nis: row.nis ?? undefined,
    rc: row.rc ?? undefined,
    ai: row.ai ?? undefined,
    rib: row.rib ?? undefined,
    notes: row.notes ?? undefined,
    creditBalance: typeof row.credit_balance === 'number' ? row.credit_balance : 0,
    createdAt: new Date(row.created_at),
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  };
}

export const getClients = async (): Promise<Client[]> => {
  const rows = await localAdapter.read('clients', { order: { name: 'asc' } });
  return rows.map(dbToClient);
};

export const getClientById = async (id: string): Promise<Client | null> => {
  const rows = await localAdapter.read('clients', { where: { id } });
  return rows[0] ? dbToClient(rows[0]) : null;
};

export const createClient = async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> => {
  const now = new Date().toISOString();
  const data = await localAdapter.create('clients', {
    ...client,
    credit_balance: client.creditBalance ?? 0,
    created_at: now,
    updated_at: now,
  });
  return dbToClient(data);
};

export const updateClient = async (id: string, client: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Client> => {
  const now = new Date().toISOString();
  const data = await localAdapter.update('clients', {
    ...client,
    credit_balance: client.creditBalance,
    updated_at: now,
  }, { id });
  return dbToClient(data);
};

export const deleteClient = async (id: string): Promise<void> => {
  await localAdapter.delete('clients', { id });
};
