import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

// 캔들 데이터 타입
export type CandleData = {
  time: string; // HH:mm
  open: number;
  high: number;
  low: number;
  close: number;
};

interface CandleChartProps {
  data: CandleData[];
  width?: number;
  height?: number;
}

const CandleChart: React.FC<CandleChartProps> = ({ data, width = 600, height = 350 }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data || data.length === 0) return;
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    // SVG 초기화
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // X, Y 스케일
    const x = d3
      .scaleBand()
      .domain(data.map(d => d.time))
      .range([0, w])
      .padding(0.3);
    const y = d3
      .scaleLinear()
      .domain([
        d3.min(data, (d: CandleData) => d.low)! * 0.995,
        d3.max(data, (d: CandleData) => d.high)! * 1.005,
      ])
      .range([h, 0]);

    // X, Y 축
    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x));
    g.append('g').call(d3.axisLeft(y));

    // 캔들(봉) 그리기
    g.selectAll('g.candle')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'candle')
      .each(function (this: SVGGElement, d: CandleData) {
        const group = d3.select(this);
        // 윗꼬리/아랫꼬리(고가~저가)
        group
          .append('line')
          .attr('x1', (x(d.time) ?? 0) + x.bandwidth() / 2)
          .attr('x2', (x(d.time) ?? 0) + x.bandwidth() / 2)
          .attr('y1', y(d.high))
          .attr('y2', y(d.low))
          .attr('stroke', 'black');
        // 시가~종가(몸통)
        group
          .append('rect')
          .attr('x', x(d.time) ?? 0)
          .attr('y', y(Math.max(d.open, d.close)))
          .attr('width', x.bandwidth())
          .attr('height', Math.abs(y(d.open) - y(d.close)))
          .attr('fill', d.close >= d.open ? '#e74c3c' : '#2ecc71')
          .attr('stroke', 'black');
      });
  }, [data, width, height]);

  return (
    <svg ref={svgRef} width={width} height={height} style={{ background: '#fff', borderRadius: 8 }} />
  );
};

export default CandleChart; 