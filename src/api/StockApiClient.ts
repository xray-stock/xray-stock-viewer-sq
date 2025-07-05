import type { CandleResponse } from '../types/stock';

export class StockApiClient {
  private baseUrl: string;
  constructor(baseUrl = 'http://localhost:8081/api/v1') {
    this.baseUrl = baseUrl;
  }

  async getCandles(symbol: string, interval: string, start?: string, end?: string): Promise<CandleResponse> {
    let url = `${this.baseUrl}/stocks/${symbol}/candles?interval=${interval}`;
    if (start) url += `&start=${start}`;
    if (end) url += `&end=${end}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('API 요청 실패');
    return await res.json();
  }
} 