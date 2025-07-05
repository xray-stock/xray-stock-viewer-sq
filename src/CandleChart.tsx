import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import type { ZoomTransform, D3ZoomEvent } from 'd3-zoom';

// 캔들 데이터 타입
export type CandleData = {
  time: string; // HH:mm
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

interface CandleChartProps {
  data: CandleData[];
  width?: number;
  height?: number;
  intervalFormat?: string;
  animateInitial?: boolean;
}

const CANDLE_PADDING = 5; // 좌우 패딩 캔들 개수
const MIN_SCALE = 1;
const MAX_SCALE = 10;

// x축 라벨 포맷 함수
function formatLabel(time: string, format: string) {
  if (!time) return '';
  const date = new Date(time);
  if (isNaN(date.getTime())) return '';
  if (format === 'HH:mm') {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }
  if (format === 'MM-DD') {
    const mon = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${mon}-${day}`;
  }
  return time;
}

const CandleChart: React.FC<CandleChartProps> = ({ data, width = 600, height = 350, intervalFormat, animateInitial = false }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const prevDataLen = useRef<number>(0);
  const transformRef = useRef<ZoomTransform>(d3.zoomIdentity);

  useEffect(() => {
    if (!data || data.length === 0) {
      // 데이터가 없을 때: 기본 축만 그림 + 메시지 표시
      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();
      const margin = { top: 20, right: 20, bottom: 30, left: 50 };
      const w = width - margin.left - margin.right;
      const h = height - margin.top - margin.bottom;
      // X, Y 축 기본값
      const x = d3.scaleBand().domain(['0']).range([0, w]);
      const y = d3.scaleLinear().domain([0, 100]).range([h, 0]);
      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
      g.append('g')
        .attr('transform', `translate(0,${h})`)
        .call(d3.axisBottom(x).tickFormat(() => ''));
      g.append('g').call(d3.axisLeft(y));
      // 중앙 메시지
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#888')
        .attr('font-size', 18)
        .text('데이터가 없습니다. 유효한 날짜 범위를 선택해 주세요.');
      return;
    }
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    const totalCandles = data.length;
    const minIdx = -CANDLE_PADDING;
    const maxIdx = totalCandles - 1 + CANDLE_PADDING;

    // SVG 초기화
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // clipPath 정의 (차트 내부만 보이게)
    svg.append('defs')
      .append('clipPath')
      .attr('id', 'clip')
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', w)
      .attr('height', h);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    // chartArea 그룹에 clip-path 적용
    const chartArea = g.append('g').attr('clip-path', 'url(#clip)');

    // X, Y 스케일
    const x = d3
      .scaleBand()
      .domain(data.map((_, i: number) => i.toString()))
      .range([0, w])
      .padding(0.3);
    const y = d3
      .scaleLinear()
      .domain([
        d3.min(data, (d: CandleData) => d.low)! * 0.995,
        d3.max(data, (d: CandleData) => d.high)! * 1.005,
      ])
      .range([h, 0]);

    const xAxis = g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(
        d3.axisBottom(x)
          .tickFormat((d: string, i: number) => {
            const t = data[+d]?.time;
            return formatLabel(t, intervalFormat || '');
          })
          .tickValues(x.domain())
      );
    const yAxis = g.append('g').call(d3.axisLeft(y));

    // 툴팁 div 생성
    let tooltip = d3.select('.candle-tooltip');
    if (tooltip.empty()) {
      tooltip = d3.select('body').append('div').attr('class', 'candle-tooltip');
    }
    tooltip.style('position', 'absolute').style('pointer-events', 'none').style('display', 'none').style('background', '#fff').style('border', '1px solid #aaa').style('padding', '6px 10px').style('border-radius', '6px').style('font-size', '13px').style('z-index', 1000);

    // 십자선 그룹 (chartArea 내부에)
    const crosshair = chartArea.append('g').style('display', 'none');
    const vLine = crosshair.append('line').attr('stroke', '#888').attr('stroke-dasharray', '3 2');
    const hLine = crosshair.append('line').attr('stroke', '#888').attr('stroke-dasharray', '3 2');

    // 봉 간 여백 비율 (0~1, 0.2이면 20%가 gap)
    const BAND_RATIO = 0.8;

    // 색상 정의
    const COLOR_UP = '#ffb3b3';      // 연한 빨강
    const COLOR_UP_HOVER = '#e74c3c'; // 진한 빨강
    const COLOR_DOWN = '#b3c6ff';    // 연한 파랑
    const COLOR_DOWN_HOVER = '#2471e3'; // 진한 파랑

    // 봉 그리기 함수 (transform 적용)
    function drawCandles(transform: ZoomTransform = d3.zoomIdentity) {
      // x축 스케일을 transform에 맞게 변환
      const zx = transform.rescaleX(
        d3.scaleLinear()
          .domain([minIdx, maxIdx + 1])
          .range([0, w])
      );
      // 봉의 가로폭을 동적으로 계산 (최소 1 보장)
      const fullWidth = Math.max(1, zx(1) - zx(0));
      const bandWidth = fullWidth * BAND_RATIO;
      const gap = fullWidth * (1 - BAND_RATIO);

      // 봉 join 패턴
      const candleGroups = chartArea.selectAll('g.candle')
        .data(data, (d: any) => d?.time)
        .join(
          (enter: any) => {
            const g = enter.append('g')
              .attr('class', 'candle')
              .attr('transform', (_: CandleData, i: number) => `translate(${zx(i) + gap / 2},0)`);
            // 꼬리
            const line = g.append('line')
              .attr('x1', bandWidth / 2)
              .attr('x2', bandWidth / 2)
              .attr('stroke', 'black');
            // 몸통
            const rect = g.append('rect')
              .attr('x', 0)
              .attr('width', bandWidth)
              .attr('fill', (d: CandleData) => d.close >= d.open ? COLOR_UP : COLOR_DOWN)
              .attr('stroke', 'black');
            if (animateInitial) {
              line
                .attr('y1', (d: CandleData) => y(d.close))
                .attr('y2', (d: CandleData) => y(d.close))
                .transition()
                .duration(600)
                .attr('y1', (d: CandleData) => y(d.high))
                .attr('y2', (d: CandleData) => y(d.low));
              rect
                .attr('y', (d: CandleData) => y(d.close))
                .attr('height', 1)
                .transition()
                .duration(600)
                .attr('y', (d: CandleData) => y(Math.max(d.open, d.close)))
                .attr('height', (d: CandleData) => {
                  const h = Math.abs(y(d.open) - y(d.close));
                  return h === 0 ? 1 : h;
                });
            } else {
              line
                .attr('y1', (d: CandleData) => y(d.high))
                .attr('y2', (d: CandleData) => y(d.low));
              rect
                .attr('y', (d: CandleData) => y(Math.max(d.open, d.close)))
                .attr('height', (d: CandleData) => {
                  const h = Math.abs(y(d.open) - y(d.close));
                  return h === 0 ? 1 : h;
                });
            }
            return g;
          },
          (update: any) => {
            update.attr('transform', (_: CandleData, i: number) => `translate(${zx(i) + gap / 2},0)`);
            // 꼬리
            update.select('line')
              .attr('x1', bandWidth / 2)
              .attr('x2', bandWidth / 2)
              .attr('y1', (d: CandleData) => y(d.high))
              .attr('y2', (d: CandleData) => y(d.low))
              .attr('stroke', 'black');
            // 몸통
            update.select('rect')
              .attr('x', 0)
              .attr('y', (d: CandleData) => y(Math.max(d.open, d.close)))
              .attr('width', bandWidth)
              .attr('height', (d: CandleData) => {
                const h = Math.abs(y(d.open) - y(d.close));
                return h === 0 ? 1 : h;
              })
              .attr('fill', (d: CandleData) => d.close >= d.open ? COLOR_UP : COLOR_DOWN)
              .attr('stroke', 'black');
            return update;
          },
          (exit: any) => exit.remove()
        );

      // 마우스 오버 이벤트 (툴팁/십자선)
      candleGroups
        .on('mouseenter', function (this: SVGGElement, event: MouseEvent, d: CandleData) {
          const [mx, my] = d3.pointer(event, g.node());
          crosshair.style('display', null);
          vLine
            .attr('x1', mx)
            .attr('x2', mx)
            .attr('y1', 0)
            .attr('y2', h);
          hLine
            .attr('x1', 0)
            .attr('x2', w)
            .attr('y1', my)
            .attr('y2', my);
          tooltip
            .style('display', null)
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 30}px`)
            .html(
              `<b>${d.time}</b><br/>시가: ${d.open}<br/>고가: ${d.high}<br/>저가: ${d.low}<br/>종가: ${d.close}` +
              (typeof (d as any).volume === 'number' ? `<br/>거래량: ${(d as any).volume}` : '')
            );
          // 마우스 오버 시 해당 봉 색상 진하게
          d3.select(this).select('rect')
            .attr('fill', d.close >= d.open ? COLOR_UP_HOVER : COLOR_DOWN_HOVER);
        })
        .on('mousemove', function (event: MouseEvent, d: CandleData) {
          const [mx, my] = d3.pointer(event, g.node());
          vLine
            .attr('x1', mx)
            .attr('x2', mx)
            .attr('y1', 0)
            .attr('y2', h);
          hLine
            .attr('x1', 0)
            .attr('x2', w)
            .attr('y1', my)
            .attr('y2', my);
          tooltip
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 30}px`);
        })
        .on('mouseleave', function (this: SVGGElement) {
          crosshair.style('display', 'none');
          tooltip.style('display', 'none');
          // 마우스 아웃 시 색상 원래대로
          const d = d3.select(this).datum() as CandleData;
          d3.select(this).select('rect')
            .attr('fill', d.close >= d.open ? COLOR_UP : COLOR_DOWN);
        });
    }

    // 마지막 봉만 추가된 경우에만 애니메이션 적용 (이제 필요 없음)
    drawCandles(transformRef.current);
    prevDataLen.current = data.length;

    // 줌 이벤트 핸들러
    function zoomed(event: D3ZoomEvent<SVGSVGElement, unknown>) {
      const transform = event.transform;
      // 이동 한계: 좌우 패딩까지 clamp
      const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, transform.k));
      let tx = transform.x;
      const maxTx = 0;
      const minTx = -(w * (scale - 1));
      if (tx > maxTx) tx = maxTx;
      if (tx < minTx) tx = minTx;
      const clampedTransform = d3.zoomIdentity.translate(tx, 0).scale(scale);

      // x축 다시 그림
      const zx = clampedTransform.rescaleX(
        d3.scaleLinear()
          .domain([minIdx, maxIdx + 1])
          .range([0, w])
      );
      xAxis.call(
        d3.axisBottom(zx)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .tickFormat((d: any, i: any) => data[Math.floor(d as number)]?.time ?? '')
      );
      transformRef.current = clampedTransform;
      drawCandles(transformRef.current);
    }

    // 줌 동작 설정
    const zoom = d3.zoom()
      .scaleExtent([MIN_SCALE, MAX_SCALE])
      .translateExtent([[0, 0], [w, h]])
      .extent([[0, 0], [w, h]])
      .on('zoom', zoomed);

    svg.call(zoom);

    // 스타일 추가 (툴팁)
    if (!document.getElementById('candle-tooltip-style')) {
      const style = document.createElement('style');
      style.id = 'candle-tooltip-style';
      style.innerHTML = `.candle-tooltip { box-shadow: 0 2px 8px rgba(0,0,0,0.12); }`;
      document.head.appendChild(style);
    }

    // 정리(cleanup)
    return () => {
      tooltip.remove();
    };
  }, [data, width, height, intervalFormat, animateInitial]);

  return (
    <>
      <svg ref={svgRef} width={width} height={height} style={{ background: '#fff', borderRadius: 8 }} />
      <div ref={tooltipRef} style={{ position: 'absolute', pointerEvents: 'none', display: 'none' }} />
    </>
  );
};

export default CandleChart; 