import React, { useState } from 'react';
import { Socket } from 'socket.io-client';

interface RoomManagerProps {
  socket: Socket | null;
  joinedRooms: string[];
  setJoinedRooms: (rooms: string[]) => void;
  logMessage: (msg: string) => void;
}

const RoomManager: React.FC<RoomManagerProps> = ({ socket, joinedRooms, setJoinedRooms, logMessage }) => {
  const [symbol, setSymbol] = useState('KOSPI::005930');

  const joinRoom = () => {
    if (!socket || !socket.connected) {
      alert('먼저 소켓에 연결하세요!');
      return;
    }
    if (!symbol) {
      alert('종목 코드를 입력해주세요.');
      return;
    }
    socket.emit('joinRoom', symbol, (response: any) => {
      if (response.success) {
        if (!joinedRooms.includes(symbol)) {
          setJoinedRooms([...joinedRooms, symbol]);
        }
        logMessage(`✅ Room '${symbol}' 입장 성공`);
      } else {
        logMessage(`❌ Room '${symbol}' 입장 실패: ${response.message}`);
      }
    });
    logMessage(`📡 Room '${symbol}' 입장 요청됨...`);
  };

  const leaveSelectedRoom = () => {
    if (!socket || !socket.connected) {
      alert('먼저 소켓에 연결하세요!');
      return;
    }
    const selectEl = document.getElementById('joinedRoomsSelect') as HTMLSelectElement;
    const selectedRoom = selectEl?.value;
    if (!selectedRoom) {
      alert('나갈 Room을 선택하세요!');
      return;
    }
    socket.emit('leaveRoom', selectedRoom, (response: any) => {
      if (response.success) {
        setJoinedRooms(joinedRooms.filter(r => r !== selectedRoom));
        logMessage(`👋 Room '${selectedRoom}' 나가기 성공`);
      } else {
        logMessage(`❌ Room '${selectedRoom}' 나가기 실패: ${response.message}`);
      }
    });
  };

  const leaveAllRooms = () => {
    if (!socket || !socket.connected) {
      alert('먼저 소켓에 연결하세요!');
      return;
    }
    if (joinedRooms.length === 0) {
      alert('참여 중인 Room이 없습니다.');
      return;
    }
    joinedRooms.forEach(room => {
      socket.emit('leaveRoom', room, (response: any) => {
        if (response.success) {
          setJoinedRooms((prev: string[]) => prev.filter((r: string) => r !== room));
          logMessage(`👋 Room '${room}' 나가기 성공`);
        } else {
          logMessage(`❌ Room '${room}' 나가기 실패: ${response.message}`);
        }
      });
    });
  };

  return (
    <div id="roomControls" style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: 6 }}>
      <h3>📦 현재 참여 중인 Room</h3>
      <div style={{ marginBottom: '0.7rem' }}>
        <label htmlFor="symbolInput">종목 코드 (예: KOSPI::005930):</label><br />
        <input type="text" id="symbolInput" value={symbol} onChange={e => setSymbol(e.target.value)} />
        <button onClick={joinRoom} style={{ marginLeft: 8 }}>Room 입장</button>
      </div>
      <select id="joinedRoomsSelect" size={5} style={{ width: '100%', marginBottom: '0.5rem' }}>
        {joinedRooms.map(room => (
          <option key={room} value={room}>{room}</option>
        ))}
      </select><br />
      <button onClick={leaveSelectedRoom}>선택한 Room 나가기</button>
      <button onClick={leaveAllRooms} style={{ marginLeft: '1rem' }}>모든 Room 나가기</button>
    </div>
  );
};

export default RoomManager; 