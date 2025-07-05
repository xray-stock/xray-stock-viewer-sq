import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

interface UseSocketProps {
  jwt?: string;
  onTickUpdate?: (msg: any) => void;
  onConnect?: (socket: Socket) => void;
  onDisconnect?: () => void;
}

export function useSocket({ jwt, onTickUpdate, onConnect, onDisconnect }: UseSocketProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!jwt) return;
    const newSocket = io('http://localhost:9092', {
      transports: ['websocket'],
      query: { token: jwt },
    });
    setSocket(newSocket);
    newSocket.on('connect', () => {
      setStatus('✅ 연결됨');
      onConnect && onConnect(newSocket);
    });
    newSocket.on('disconnect', () => {
      setStatus('❌ 연결 종료됨');
      onDisconnect && onDisconnect();
    });
    if (onTickUpdate) newSocket.on('tickUpdate', onTickUpdate);
    newSocket.on('connect_error', (err: any) => {
      setStatus('❌ 연결 실패: ' + (err.message || err));
    });
    return () => {
      newSocket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jwt]);

  return { socket, status };
} 