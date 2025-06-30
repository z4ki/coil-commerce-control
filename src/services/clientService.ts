// Replace the Supabase import with local data
// import { supabase } from '@/integrations/supabase/client';
import { tauriApi } from '@/lib/tauri-api';
import { Client } from '@/types/index';

export const getClients = async (): Promise<Client[]> => {
  try {
    return await tauriApi.clients.getAll() as Client[];
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

export const getClientById = async (id: string): Promise<Client | null> => {
  try {
    return await tauriApi.clients.getById(id) as Client | null;
  } catch (error) {
    console.error('Error fetching client:', error);
    throw error;
  }
};

export const createClient = async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> => {
  try {
    return await tauriApi.clients.create(client) as Client;
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
};

export const updateClient = async (
  id: string,
  client: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'creditBalance'>>
): Promise<Client> => {
  // Only pick allowed fields
  const {
    name, company, address, phone, email, nif, nis, rc, ai, rib, notes
  } = client;
  const updatePayload = { name, company, address, phone, email, nif, nis, rc, ai, rib, notes };
  try {
    return await tauriApi.clients.update(id, updatePayload) as Client;
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
};

export const deleteClient = async (id: string): Promise<void> => {
  try {
    await tauriApi.clients.delete(id);
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
};
