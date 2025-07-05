// 랜덤 캔들 데이터 생성 함수
import type { CandleData } from './CandleChart';

export function generateRandomCandleData(count: number): CandleData[] {
  const data: CandleData[] = [];
  let prevClose = 100;
  for (let i = 0; i < count; i++) {
    const hour = 9 + Math.floor((i + 0) / 60);
    const min = (i % 60).toString().padStart(2, '0');
    const time = `${hour}:${min}`;
    const open = prevClose + (Math.random() - 0.5) * 4;
    const high = open + Math.random() * 4;
    const low = open - Math.random() * 4;
    const close = low + Math.random() * (high - low);
    data.push({
      time,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
    });
    prevClose = close;
  }
  return data;
} 