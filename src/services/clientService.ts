
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types';

export const getClients = async (): Promise<Client[]> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
  
  // Convert to Client type with correct date format
  return (data || []).map(client => ({
    ...client,
    id: client.id,
    createdAt: new Date(client.created_at),
    updatedAt: client.updated_at ? new Date(client.updated_at) : undefined
  }));
};

export const getClientById = async (id: string): Promise<Client | null> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // No data found
      return null;
    }
    console.error('Error fetching client:', error);
    throw error;
  }
  
  if (!data) return null;
  
  return {
    ...data,
    id: data.id,
    createdAt: new Date(data.created_at),
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
  };
};

export const createClient = async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> => {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      address: client.address,
      notes: client.notes,
      nif: client.nif,
      nis: client.nis,
      rc: client.rc,
      ai: client.ai
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating client:', error);
    throw error;
  }
  
  return {
    ...data,
    id: data.id,
    createdAt: new Date(data.created_at),
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
  };
};

export const updateClient = async (id: string, client: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Client> => {
  const { data, error } = await supabase
    .from('clients')
    .update({
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      address: client.address,
      notes: client.notes,
      nif: client.nif,
      nis: client.nis,
      rc: client.rc,
      ai: client.ai,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating client:', error);
    throw error;
  }
  
  return {
    ...data,
    id: data.id,
    createdAt: new Date(data.created_at),
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
  };
};

export const deleteClient = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
};
