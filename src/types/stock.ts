// 주식 캔들 타입 정의
export interface Candle {
  at: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CandleResponse {
  stockId: string;
  interval: string;
  candles: Candle[];
} 