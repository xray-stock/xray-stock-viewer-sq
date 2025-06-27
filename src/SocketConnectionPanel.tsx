import React, { useState, useRef, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import RoomManager from './RoomManager';

const LOG_LIMIT = 4000;

interface SocketConnectionPanelProps {
  jwt: string;
}

const SocketConnectionPanel: React.FC<SocketConnectionPanelProps> = ({ jwt }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState('');
  const [log, setLog] = useState('');
  const [joinedRooms, setJoinedRooms] = useState<string[]>([]);
  const logRef = useRef('');

  useEffect(() => {
    logRef.current = log;
  }, [log]);

  useEffect(() => {
    return () => {
      if (socket) socket.disconnect();
    };
  }, [socket]);

  const logMessage = (msg: string) => {
    setLog(prev => {
      const newLog = msg + '\n\n' + prev;
      return newLog.length > LOG_LIMIT ? newLog.slice(0, LOG_LIMIT) + '\n...(생략)...' : newLog;
    });
  };

  const connectSocket = () => {
    if (!jwt) {
      alert('먼저 JWT 토큰을 만들어주세요!');
      return;
    }
    if (socket && socket.connected) {
      logMessage('이미 소켓에 연결되어 있습니다.');
      return;
    }
    if (socket) socket.disconnect();
    const newSocket = io('http://localhost:9092', {
      transports: ['websocket'],
      query: { token: jwt },
    });
    setSocket(newSocket);
    newSocket.on('connect', () => {
      setStatus('✅ 연결됨. socketId: ' + newSocket.id);
      logMessage(`[${new Date().toLocaleTimeString()}] 소켓 연결 성공`);
    });
    newSocket.on('disconnect', () => {
      setStatus('❌ 연결 종료됨');
      logMessage(`[${new Date().toLocaleTimeString()}] 소켓 연결 종료`);
      setJoinedRooms([]);
    });
    newSocket.on('tickUpdate', (msg: any) => {
      const { stockId, tradeTickItems } = msg;
      tradeTickItems.forEach((tick: any) => {
        logMessage(`[${new Date().toLocaleTimeString()}] [${stockId}] 체결 데이터:\n` + JSON.stringify(tick, null, 2));
      });
    });
    newSocket.on('connect_error', (err: any) => {
      setStatus('❌ 연결 실패: ' + (err.message || err));
      logMessage(`[${new Date().toLocaleTimeString()}] 소켓 연결 실패: ${err.message || err}`);
    });
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setStatus('❌ 연결 종료됨');
      setJoinedRooms([]);
    }
  };

  return (
    <div>
      <div id="controls" style={{ marginBottom: '1rem' }}>
        <button onClick={connectSocket}>소켓 연결</button>
        <button onClick={disconnectSocket} style={{ marginLeft: 8 }}>연결 종료</button>
        <span style={{ marginLeft: 16 }}>{status}</span>
      </div>
      <RoomManager socket={socket} joinedRooms={joinedRooms} setJoinedRooms={setJoinedRooms} logMessage={logMessage} />
      <div id="log" style={{ marginTop: '1rem', whiteSpace: 'pre-wrap', background: '#f0f0f0', padding: '1rem', borderRadius: 6 }}>
        {log}
      </div>
    </div>
  );
};

export default SocketConnectionPanel; 