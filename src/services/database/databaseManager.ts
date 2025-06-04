import { DatabaseAdapter, SyncQueueItem } from './types';
import { SupabaseAdapter } from './supabaseAdapter';
import { LocalAdapter } from './localAdapter';
import { appWindow } from '@tauri-apps/api';
import { EventEmitter } from 'events';

export class DatabaseManager extends EventEmitter {
  private static instance: DatabaseManager;
  private onlineAdapter: DatabaseAdapter;
  private offlineAdapter: DatabaseAdapter;
  private currentAdapter: DatabaseAdapter;
  private isOnline: boolean = true;
  private syncInterval: number | null = null;

  private constructor() {
    super();
    this.onlineAdapter = new SupabaseAdapter();
    this.offlineAdapter = new LocalAdapter();
    this.currentAdapter = this.onlineAdapter;
    this.setupConnectionMonitoring();
    this.setupSyncInterval();
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }
  private async setupConnectionMonitoring() {
    // Initial check
    await this.checkConnection();

    // Listen for online/offline events from Tauri
    appWindow.listen('online', async () => {
      await this.checkConnection(); // Verify actual connection state
    });

    appWindow.listen('offline', () => {
      this.handleConnectionChange(false);
    });

    // Listen for network connectivity changes
    window.addEventListener('online', async () => {
      await this.checkConnection(); // Verify actual connection state
    });

    window.addEventListener('offline', () => {
      this.handleConnectionChange(false);
    });

    // Regular connection checks
    setInterval(() => {
      // Only check if we think we're online to avoid unnecessary requests when offline
      if (this.isOnline) {
        this.checkConnection();
      }
    }, 30000);
  }

  private setupSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Try to sync every 5 minutes when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.syncPendingChanges();
      }
    }, 5 * 60 * 1000) as unknown as number;
  }

  private async checkConnection() {
    const online = await this.onlineAdapter.isOnline();
    if (online !== this.isOnline) {
      this.handleConnectionChange(online);
    }
  }

  private async handleConnectionChange(online: boolean) {
    this.isOnline = online;
    this.currentAdapter = online ? this.onlineAdapter : this.offlineAdapter;
    
    this.emit('connectionChange', online);

    if (online) {
      this.syncPendingChanges();
    }
  }

  async syncPendingChanges(): Promise<void> {
    if (!this.isOnline) return;

    const pendingChanges = await this.offlineAdapter.getPendingChanges();
    
    for (const change of pendingChanges) {
      try {
        switch (change.operation) {
          case 'create':
            await this.onlineAdapter.create(change.table, change.data);
            break;
          case 'update':
            await this.onlineAdapter.update(change.table, change.data, change.data.where);
            break;
          case 'delete':
            await this.onlineAdapter.delete(change.table, change.data);
            break;
        }
      } catch (error) {
        console.error(`Failed to sync change ${change.id}:`, error);
        // Update the change status to error
        await this.offlineAdapter.update('sync_queue', 
          { 
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          { id: change.id }
        );
        continue;
      }

      // Remove the successfully synced change
      await this.offlineAdapter.delete('sync_queue', { id: change.id });
    }
  }

  // Public methods that delegate to the current adapter
  async create<T extends string>(table: T, data: any): Promise<any> {
    try {
      return await this.currentAdapter.create(table, data);
    } catch (error) {
      if (this.isOnline) {
        // If online operation fails, fall back to offline
        this.handleConnectionChange(false);
        return this.offlineAdapter.create(table, data);
      }
      throw error;
    }
  }

  async read<T extends string>(
    table: T,
    query?: Parameters<DatabaseAdapter['read']>[1]
  ): Promise<any[]> {
    try {
      return await this.currentAdapter.read(table, query);
    } catch (error) {
      if (this.isOnline) {
        // If online operation fails, fall back to offline
        this.handleConnectionChange(false);
        return this.offlineAdapter.read(table, query);
      }
      throw error;
    }
  }

  async update<T extends string>(
    table: T,
    data: any,
    where: Record<string, any>
  ): Promise<any> {
    try {
      return await this.currentAdapter.update(table, data, where);
    } catch (error) {
      if (this.isOnline) {
        // If online operation fails, fall back to offline
        this.handleConnectionChange(false);
        return this.offlineAdapter.update(table, data, where);
      }
      throw error;
    }
  }

  async delete<T extends string>(table: T, where: Record<string, any>): Promise<void> {
    try {
      return await this.currentAdapter.delete(table, where);
    } catch (error) {
      if (this.isOnline) {
        // If online operation fails, fall back to offline
        this.handleConnectionChange(false);
        return this.offlineAdapter.delete(table, where);
      }
      throw error;
    }
  }

  async transaction<T>(operations: () => Promise<T>): Promise<T> {
    return this.currentAdapter.transaction(operations);
  }

  getConnectionStatus(): boolean {
    return this.isOnline;
  }

  onConnectionChange(callback: (online: boolean) => void): void {
    this.on('connectionChange', callback);
  }
}
