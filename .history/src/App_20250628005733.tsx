import React, { useState } from 'react';
import './App.css';
import JWTGenerator from './JWTGenerator';
import SocketConnectionPanel from './SocketConnectionPanel';

function App() {
  const [jwt, setJwt] = useState('');

  return (
    <div className="App" style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      <h2>🔑 JWT 직접 생성 & 실시간 소켓 테스트</h2>
      <JWTGenerator jwt={jwt} setJwt={setJwt} />
      <SocketConnectionPanel jwt={jwt} />
    </div>
  );
}

export default App;
