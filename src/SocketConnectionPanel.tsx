import React, { useState, useRef, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import {
  Button,
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Divider,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Wifi,
  WifiOff,
  Refresh,
  CheckCircle,
  Error,
  Info
} from '@mui/icons-material';
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
  const [isConnected, setIsConnected] = useState(false);
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
      logMessage('❌ 먼저 JWT 토큰을 만들어주세요!');
      return;
    }
    if (socket && socket.connected) {
      logMessage('ℹ️ 이미 소켓에 연결되어 있습니다.');
      return;
    }
    if (socket) socket.disconnect();
    const newSocket = io('http://localhost:9092', {
      transports: ['websocket'],
      query: { token: jwt },
    });
    setSocket(newSocket);
    newSocket.on('connect', () => {
      setStatus('연결됨');
      setIsConnected(true);
      logMessage(`✅ [${new Date().toLocaleTimeString()}] 소켓 연결 성공 (ID: ${newSocket.id})`);
    });
    newSocket.on('disconnect', () => {
      setStatus('연결 종료됨');
      setIsConnected(false);
      logMessage(`❌ [${new Date().toLocaleTimeString()}] 소켓 연결 종료`);
      setJoinedRooms([]);
    });
    newSocket.on('tickUpdate', (msg: any) => {
      const { stockId, tradeTickItems } = msg;
      tradeTickItems.forEach((tick: any) => {
        logMessage(`📊 [${new Date().toLocaleTimeString()}] [${stockId}] 체결 데이터:\n` + JSON.stringify(tick, null, 2));
      });
    });
    newSocket.on('connect_error', (err: any) => {
      setStatus('연결 실패');
      setIsConnected(false);
      logMessage(`❌ [${new Date().toLocaleTimeString()}] 소켓 연결 실패: ${err.message || err}`);
    });
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setStatus('연결 종료됨');
      setIsConnected(false);
      setJoinedRooms([]);
    }
  };

  const clearLog = () => {
    setLog('');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="success"
          onClick={connectSocket}
          disabled={isConnected}
          startIcon={<Wifi />}
        >
          소켓 연결
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={disconnectSocket}
          disabled={!isConnected}
          startIcon={<WifiOff />}
        >
          연결 종료
        </Button>
        <Button
          variant="outlined"
          onClick={clearLog}
          startIcon={<Refresh />}
        >
          로그 지우기
        </Button>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Chip
          icon={isConnected ? <CheckCircle /> : <Error />}
          label={status || '연결되지 않음'}
          color={isConnected ? 'success' : 'error'}
          variant="outlined"
        />
        {isConnected && (
          <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
            Socket ID: {socket?.id}
          </Typography>
        )}
      </Box>

      <RoomManager socket={socket} joinedRooms={joinedRooms} setJoinedRooms={setJoinedRooms} logMessage={logMessage} />
      
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Info color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" component="h3">
              실시간 로그
            </Typography>
            <Tooltip title="로그 지우기">
              <IconButton size="small" onClick={clearLog} sx={{ ml: 'auto' }}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              maxHeight: 400,
              overflow: 'auto',
              backgroundColor: '#f5f5f5',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {log || '로그가 없습니다. 소켓에 연결하고 Room에 입장해보세요.'}
          </Paper>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SocketConnectionPanel; 