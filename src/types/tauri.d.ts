// Removed old Tauri v1 module declarations. Use direct imports from '@tauri-apps/api' in v2.

interface Window {
  __TAURI__?: {
    invoke: (cmd: string, args?: any) => Promise<any>;
  };
}
