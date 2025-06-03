declare module '@tauri-apps/api/tauri' {
  export function invoke<T>(cmd: string, args?: any): Promise<T>;
}

declare module '@tauri-apps/api/event' {
  export function listen<T>(event: string, callback: (event: { payload: T }) => void): Promise<() => void>;
}

interface Window {
  __TAURI__?: {
    invoke: (cmd: string, args?: any) => Promise<any>;
  };
}
