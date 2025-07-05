import React, { useState } from 'react';
import CandleChart, { CandleData } from './CandleChart';
import { StockApiClient } from './api/StockApiClient';
import type { Candle, CandleResponse } from './types/stock';

const mockCandleData: CandleData[] = [];

const CandleChartPage: React.FC = () => {
  const [symbol, setSymbol] = useState('KOSPI::005930');
  const [candleData, setCandleData] = useState<CandleData[]>(mockCandleData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 날짜 범위 상태 추가
  const now = new Date();
  const defaultEnd = now.toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
  const defaultStart = new Date(now.getTime() - 30 * 60 * 1000).toISOString().slice(0, 16);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  // interval 상태 추가
  const [interval, setInterval] = useState('1m');

  const apiClient = new StockApiClient();
  const fetchCandleData = async () => {
    setLoading(true);
    setError(null);
    try {
      const start = startDate ? new Date(startDate).toISOString() : undefined;
      const end = endDate ? new Date(endDate).toISOString() : undefined;
      const data: CandleResponse = await apiClient.getCandles(symbol, interval, start, end);
      const chartData: CandleData[] = (data.candles || []).map((item: Candle) => ({
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
  // const chartData = { ... }
  // const chartOptions = { ... }

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
        <select value={interval} onChange={e => setInterval(e.target.value)} style={{ marginLeft: 4, marginRight: 8 }}>
          <option value="1m">1분</option>
          <option value="5m">5분</option>
          <option value="1d">일봉</option>
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
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      <div style={{ height: 400, background: '#f5f5f5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', height: 350 }}>
          <CandleChart data={candleData} width={600} height={350} />
        </div>
      </div>
    </div>
  );
};

export default CandleChartPage; 