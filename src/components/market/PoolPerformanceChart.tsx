"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  AreaSeries,
  type LineData,
} from "lightweight-charts";

export interface PoolPerformancePoint {
  time: string;
  value: number;
}

interface PoolPerformanceChartProps {
  data: PoolPerformancePoint[];
  height?: number;
  /** Compact mode: hide time axis labels, minimal padding */
  compact?: boolean;
  /** Line/area color (default: orange gradient) */
  positiveColor?: boolean;
}

export function PoolPerformanceChart({
  data,
  height = 140,
  compact = true,
  positiveColor = true,
}: PoolPerformanceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !data.length) return;

    const container = chartContainerRef.current;
    const width = container.clientWidth || 320;

    const chart = createChart(container, {
      layout: {
        background: { color: "transparent" },
        textColor: "#64748b",
      },
      grid: {
        vertLines: { color: "transparent" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      width,
      height,
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.15 },
        visible: !compact,
      },
      leftPriceScale: {
        visible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: !compact,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { visible: !compact },
        horzLine: { visible: !compact },
      },
    });

    chartRef.current = chart;

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: positiveColor ? "#fc4f02" : "#22c55e",
      topColor: positiveColor ? "rgba(252, 79, 2, 0.4)" : "rgba(34, 197, 94, 0.4)",
      bottomColor: positiveColor ? "rgba(252, 79, 2, 0.02)" : "rgba(34, 197, 94, 0.02)",
      lineWidth: 2,
    });
    seriesRef.current = areaSeries;

    const chartData: LineData[] = data.map((p) => ({
      time: p.time as any,
      value: p.value,
    }));
    areaSeries.setData(chartData);

    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver((entries) => {
      if (!chartRef.current || !entries.length) return;
      const { width: w } = entries[0].contentRect;
      if (w > 0) chartRef.current.applyOptions({ width: w });
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [data, height, compact, positiveColor]);

  // Update data when data reference changes (same length)
  useEffect(() => {
    if (!seriesRef.current || !data.length) return;
    const chartData: LineData[] = data.map((p) => ({
      time: p.time as any,
      value: p.value,
    }));
    seriesRef.current.setData(chartData);
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-white/[0.03] text-slate-500 text-xs"
        style={{ height }}
      >
        No data
      </div>
    );
  }

  return (
    <div
      ref={chartContainerRef}
      className="w-full rounded-lg overflow-hidden"
      style={{ height }}
    />
  );
}
