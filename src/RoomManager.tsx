import React, { useState } from 'react';
import { Socket } from 'socket.io-client';
import {
  TextField,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert
} from '@mui/material';
import {
  MeetingRoom,
  ClearAll,
  Add,
  Remove
} from '@mui/icons-material';

interface RoomManagerProps {
  socket: Socket | null;
  joinedRooms: string[];
  setJoinedRooms: React.Dispatch<React.SetStateAction<string[]>>;
  logMessage: (msg: string) => void;
}

const RoomManager: React.FC<RoomManagerProps> = ({ socket, joinedRooms, setJoinedRooms, logMessage }) => {
  const [symbol, setSymbol] = useState('KOSPI::005930');
  const [error, setError] = useState('');

  const joinRoom = () => {
    if (!socket || !socket.connected) {
      setError('먼저 소켓에 연결하세요!');
      return;
    }
    if (!symbol) {
      setError('종목 코드를 입력해주세요.');
      return;
    }
    setError('');
    socket.emit('joinRoom', symbol, (response: any) => {
      if (response.success) {
        if (!joinedRooms.includes(symbol)) {
          setJoinedRooms(prev => [...prev, symbol]);
        }
        logMessage(`✅ Room '${symbol}' 입장 성공`);
      } else {
        logMessage(`❌ Room '${symbol}' 입장 실패: ${response.message}`);
      }
    });
    logMessage(`📡 Room '${symbol}' 입장 요청됨...`);
  };

  const leaveRoom = (room: string) => {
    if (!socket || !socket.connected) {
      setError('먼저 소켓에 연결하세요!');
      return;
    }
    setError('');
    socket.emit('leaveRoom', room, (response: any) => {
      if (response.success) {
        setJoinedRooms(prev => prev.filter(r => r !== room));
        logMessage(`👋 Room '${room}' 나가기 성공`);
      } else {
        logMessage(`❌ Room '${room}' 나가기 실패: ${response.message}`);
      }
    });
  };

  const leaveAllRooms = () => {
    if (!socket || !socket.connected) {
      setError('먼저 소켓에 연결하세요!');
      return;
    }
    if (joinedRooms.length === 0) {
      setError('참여 중인 Room이 없습니다.');
      return;
    }
    setError('');
    joinedRooms.forEach(room => {
      socket.emit('leaveRoom', room, (response: any) => {
        if (response.success) {
          setJoinedRooms(prev => prev.filter(r => r !== room));
          logMessage(`👋 Room '${room}' 나가기 성공`);
        } else {
          logMessage(`❌ Room '${room}' 나가기 실패: ${response.message}`);
        }
      });
    });
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <MeetingRoom color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" component="h3">
            Room 관리
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            label="종목 코드 (예: KOSPI::005930)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            variant="outlined"
            size="small"
          />
          <Button
            variant="contained"
            onClick={joinRoom}
            startIcon={<Add />}
            sx={{ height: 40, minWidth: 120 }}
          >
            Room 입장
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mr: 2 }}>
            참여 중인 Room ({joinedRooms.length})
          </Typography>
          {joinedRooms.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={leaveAllRooms}
              startIcon={<ClearAll />}
            >
              모두 나가기
            </Button>
          )}
        </Box>

        {joinedRooms.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
            <MeetingRoom sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
            <Typography variant="body2">
              참여 중인 Room이 없습니다.
            </Typography>
          </Box>
        ) : (
          <List dense>
            {joinedRooms.map((room) => (
              <ListItem
                key={room}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: 'background.paper'
                }}
              >
                <ListItemText
                  primary={room}
                  secondary={
                    <Chip
                      label="활성"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    color="error"
                    onClick={() => leaveRoom(room)}
                    title="Room 나가기"
                  >
                    <Remove />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default RoomManager; 