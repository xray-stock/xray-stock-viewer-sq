import React, { useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const mockCandleData = [
  { time: '09:00', open: 100, high: 110, low: 95, close: 105 },
  { time: '09:05', open: 105, high: 115, low: 104, close: 110 },
  { time: '09:10', open: 110, high: 112, low: 108, close: 109 },
  { time: '09:15', open: 109, high: 113, low: 107, close: 112 },
];

// API 응답 타입 예시 (실제 응답 구조에 맞게 수정 필요)
type TradeTick = {
  at: string; // 시간
  open: number;
  high: number;
  low: number;
  close: number;
};

const CandleChartPage: React.FC = () => {
  const [symbol, setSymbol] = useState('KOSPI::005930');
  const [candleData, setCandleData] = useState(mockCandleData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 실제 API 연동
  const fetchCandleData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 날짜 범위 등은 임시로 최근 30분(예시)로 설정
      const now = new Date();
      const end = now.toISOString();
      const start = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
      // 실제 서버 주소로 변경 필요 (프록시 사용 시 /api로 시작)
      const url = `/api/v1/stocks/${encodeURIComponent(symbol)}/trade-ticks/range?start=${start}&end=${end}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('API 요청 실패');
      const data = await res.json();
      // data.items 또는 data.results 등 실제 응답 구조에 맞게 파싱 필요
      // 여기서는 예시로 data.items 사용
      const items: TradeTick[] = data.items || [];
      // 차트용 데이터 변환
      const chartData = items.map(item => ({
        time: item.at.slice(11, 16), // HH:mm
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }));
      setCandleData(chartData.length > 0 ? chartData : mockCandleData);
    } catch (e: any) {
      setError(e.message || '데이터 로딩 실패');
      setCandleData(mockCandleData);
    } finally {
      setLoading(false);
    }
  };

  // Chart.js용 데이터 변환 (Bar 차트로 임시 표현)
  const chartData = {
    labels: candleData.map(d => d.time),
    datasets: [
      {
        label: '시가',
        data: candleData.map(d => d.open),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: '종가',
        data: candleData.map(d => d.close),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: `${symbol} 캔들 차트` },
    },
  };

  return (
    <div>
      <h2>캔들 차트</h2>
      <div style={{ marginBottom: '1rem' }}>
        <label>종목 코드: </label>
        <input
          type="text"
          value={symbol}
          onChange={e => setSymbol(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button onClick={fetchCandleData} disabled={loading}>{loading ? '조회 중...' : '조회'}</button>
      </div>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      <div style={{ height: 400, background: '#f5f5f5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', height: 350 }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default CandleChartPage; 