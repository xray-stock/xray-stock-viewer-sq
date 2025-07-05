import React, { useState, useEffect } from 'react';
import CandleChart, { CandleData as OrigCandleData } from './CandleChart';
import { StockApiClient } from './api/StockApiClient';
import type { Candle, CandleResponse } from './types/stock';
import { useSocket } from './hooks/useSocket';

// CandleData에 volume 필드 추가 (실시간 거래량 반영)
type CandleData = OrigCandleData & { volume: number };
const mockCandleData: CandleData[] = [];

// interval별 추천 범위(ms)
const INTERVAL_OPTIONS = [
  { value: '1m', label: '1분', rangeMs: 1000 * 60 * 30, format: 'HH:mm' },      // 30분
  { value: '5m', label: '5분', rangeMs: 1000 * 60 * 60, format: 'HH:mm' },      // 1시간
  { value: '1d', label: '일봉', rangeMs: 1000 * 60 * 60 * 24 * 30, format: 'MM-DD' }, // 1달
];

const getIntervalOption = (value: string) => INTERVAL_OPTIONS.find(opt => opt.value === value) || INTERVAL_OPTIONS[0];

interface CandleChartPageProps {
  jwt: string;
}
const CandleChartPage: React.FC<CandleChartPageProps> = ({ jwt }) => {
  const [symbol, setSymbol] = useState('KOSPI::A005930');
  const [candleData, setCandleData] = useState<CandleData[]>(mockCandleData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const now = new Date();
  const defaultInterval = '1m';
  const defaultEnd = now.toLocaleString('sv-SE').slice(0, 16);
  const defaultStart = new Date(now.getTime() - getIntervalOption(defaultInterval).rangeMs).toLocaleString('sv-SE').slice(0, 16);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [interval, setInterval] = useState(defaultInterval);
  const [animateInitial, setAnimateInitial] = useState(false);

  const apiClient = new StockApiClient();
  // 봉 구간 Key 생성 함수
  function getCandleTimeKey(at: string, interval: string): string {
    if (!at) return '';
    const date = new Date(at);
    if (isNaN(date.getTime())) return '';
    if (interval === '1d') {
      return date.toISOString().slice(0, 10); // YYYY-MM-DD
    }
    if (interval === '5m') {
      const min = date.getMinutes();
      const rounded = Math.floor(min / 5) * 5;
      date.setMinutes(rounded, 0, 0);
      return date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
    }
    // 1m 등
    date.setSeconds(0, 0);
    return date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
  }
  const fetchCandleData = async () => {
    setAnimateInitial(true);
    setLoading(true);
    setError(null);
    try {
      const start = startDate ? new Date(startDate).toISOString() : undefined;
      const end = endDate ? new Date(endDate).toISOString() : undefined;
      const data: CandleResponse = await apiClient.getCandles(symbol, interval, start, end);
      const chartData: CandleData[] = (data.candles || [])
        .map((item: Candle) => ({
          time: getCandleTimeKey(item.at, interval),
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume,
        }))
        .filter(candle =>
          candle.time &&
          [candle.open, candle.high, candle.low, candle.close, candle.volume].every(v => typeof v === 'number' && !isNaN(v))
        );
      setCandleData(chartData.length > 0 ? chartData : mockCandleData);
    } catch (e: any) {
      setError(e.message || '데이터 로딩 실패');
      setCandleData(mockCandleData);
    } finally {
      setLoading(false);
    }
  };

  // interval 변경 시 추천 범위 자동 세팅
  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newInterval = e.target.value;
    setInterval(newInterval);
    const now = new Date();
    const end = now.toLocaleString('sv-SE').slice(0, 16);
    const start = new Date(now.getTime() - getIntervalOption(newInterval).rangeMs).toLocaleString('sv-SE').slice(0, 16);
    setStartDate(start);
    setEndDate(end);
  };

  // 소켓 연결 상태 및 실시간 데이터 반영
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketStatus, setSocketStatus] = useState('');
  const [socketActive, setSocketActive] = useState(false); // 연결 버튼 클릭 시 true, 해제 시 false
  // 실시간 체결데이터를 interval별로 봉에 반영하는 함수
  const handleTickUpdate = (msg: any) => {
    if (!msg || !msg.tradeTickItems) return;
    setCandleData(prev => {
      let updated = [...prev];
      msg.tradeTickItems.forEach((tick: any) => {
        const tickKey = getCandleTimeKey(tick.tickAt, interval);
        if (!tickKey || typeof tick.price !== 'number' || isNaN(tick.price) || typeof tick.volume !== 'number' || isNaN(tick.volume)) return;
        // 기존 봉을 time(key)로 전체에서 탐색
        const found = updated.find(c => c.time === tickKey);
        if (found) {
          found.high = Math.max(found.high, tick.price);
          found.low = Math.min(found.low, tick.price);
          found.close = tick.price;
          found.volume += tick.volume;
        } else {
          // 새 봉 추가
          updated.push({
            time: tickKey,
            open: tick.price,
            high: tick.price,
            low: tick.price,
            close: tick.price,
            volume: tick.volume,
          });
        }
      });
      return updated;
    });
  };

  const { socket, status } = useSocket(socketActive ? {
    jwt,
    onTickUpdate: handleTickUpdate,
    onConnect: () => setSocketConnected(true),
    onDisconnect: () => setSocketConnected(false),
  } : { jwt: undefined });
  useEffect(() => { setSocketStatus(status); }, [status]);

  const handleConnect = () => {
    if (!jwt) {
      alert('먼저 JWT 토큰을 입력하세요!');
      return;
    }
    setSocketActive(true);
  };
  const handleDisconnect = () => {
    setSocketActive(false);
    setSocketConnected(false);
    setSocketStatus('');
  };

  // 소켓 연결 후 Room(종목) 자동 입장
  useEffect(() => {
    if (socket && socketConnected && symbol) {
      socket.emit('joinRoom', symbol, (response: any) => {
        if (response && response.success) {
          console.log(`✅ Room '${symbol}' 입장 성공`);
        } else {
          console.log(`❌ Room '${symbol}' 입장 실패:`, response?.message);
        }
      });
    }
  }, [socket, socketConnected, symbol]);

  // Chart.js용 데이터 변환 (Bar 차트로 임시 표현)
  // const chartData = { ... }
  // const chartOptions = { ... }

  useEffect(() => {
    if (animateInitial) {
      const timer = setTimeout(() => setAnimateInitial(false), 700);
      return () => clearTimeout(timer);
    }
  }, [animateInitial]);

  return (
    <div>
      <h2>캔들 차트</h2>
      <div style={{ marginBottom: '1rem' }}>
        <label>종목 코드 (예: KOSPI::A005930): </label>
        <input
          type="text"
          value={symbol}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSymbol(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <label style={{ marginLeft: 8 }}>간격:</label>
        <select value={interval} onChange={handleIntervalChange} style={{ marginLeft: 4, marginRight: 8 }}>
          {INTERVAL_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <label style={{ marginLeft: 8 }}>시작:</label>
        <input
          type="datetime-local"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          style={{ marginLeft: 4, marginRight: 8 }}
        />
        <label>종료:</label>
        <input
          type="datetime-local"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          style={{ marginLeft: 4, marginRight: 8 }}
        />
        <button onClick={fetchCandleData} disabled={loading}>{loading ? '조회 중...' : '조회'}</button>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={handleConnect} disabled={socketConnected}>소켓 연결</button>
        <button onClick={handleDisconnect} disabled={!socketConnected}>연결 종료</button>
        <span style={{ marginLeft: 16 }}>{socketStatus}</span>
      </div>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      <div style={{ height: 400, background: '#f5f5f5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', height: 350 }}>
          <CandleChart data={candleData} width={600} height={350} intervalFormat={getIntervalOption(interval).format} animateInitial={animateInitial} />
        </div>
      </div>
    </div>
  );
};

export default CandleChartPage; 