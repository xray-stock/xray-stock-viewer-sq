import React, { useState } from 'react';
import CandleChart, { CandleData } from './CandleChart';
import { StockApiClient } from './api/StockApiClient';
import type { Candle, CandleResponse } from './types/stock';

const mockCandleData: CandleData[] = [];

// interval별 추천 범위(ms)
const INTERVAL_OPTIONS = [
  { value: '1m', label: '1분', rangeMs: 1000 * 60 * 30 },      // 30분
  { value: '5m', label: '5분', rangeMs: 1000 * 60 * 60 },      // 1시간
  { value: '1d', label: '일봉', rangeMs: 1000 * 60 * 60 * 24 * 30 }, // 1달
];

const getIntervalOption = (value: string) => INTERVAL_OPTIONS.find(opt => opt.value === value) || INTERVAL_OPTIONS[0];

const CandleChartPage: React.FC = () => {
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