// Replace the Supabase import with local data
// import { supabase } from '@/integrations/supabase/client';
import { tauriApi } from '@/lib/tauri-api';
import { Client } from '@/types';

export const getClients = async (): Promise<Client[]> => {
  try {
    return await tauriApi.clients.getAll();
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

export const getClientById = async (id: string): Promise<Client | null> => {
  try {
    return await tauriApi.clients.getById(id);
  } catch (error) {
    console.error('Error fetching client:', error);
    throw error;
  }
};

export const createClient = async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> => {
  try {
    return await tauriApi.clients.create(client);
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
};

export const updateClient = async (id: string, client: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Client> => {
  try {
    return await tauriApi.clients.update(id, client);
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
