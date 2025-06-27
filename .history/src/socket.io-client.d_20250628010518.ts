declare module 'socket.io-client' {
  export interface Socket {
    id: string;
    connected: boolean;
    disconnect(): void;
    on(event: string, callback: (...args: any[]) => void): Socket;
    emit(event: string, ...args: any[]): Socket;
  }
  
  export function io(url: string, options?: any): Socket;
} 