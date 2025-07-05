import React, { useState } from 'react';
import './App.css';
import JWTGenerator from './JWTGenerator';
import SocketConnectionPanel from './SocketConnectionPanel';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CandleChartPage from './CandleChartPage';
// CandleChartPage는 추후 생성 예정

function App() {
  const [jwt, setJwt] = useState('');

  return (
    <Router>
      <div className="App" style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
        <nav style={{ marginBottom: '2rem' }}>
          <Link to="/">홈</Link>
          <span style={{ margin: '0 1rem' }}>|</span>
          <Link to="/candle-chart">캔들 차트</Link>
        </nav>
        <Routes>
          <Route path="/" element={
            <>
              <h2>🔑 JWT 직접 생성 & 실시간 소켓 테스트</h2>
              <JWTGenerator jwt={jwt} setJwt={setJwt} />
              <SocketConnectionPanel jwt={jwt} />
            </>
          } />
          <Route path="/candle-chart" element={<CandleChartPage jwt={jwt} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
