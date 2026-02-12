"use client";

import { useEffect, useRef, useState } from "react";
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  CandlestickData, 
  HistogramData, 
  LineData,
  CandlestickSeries,
  LineSeries,
  HistogramSeries
} from "lightweight-charts";
import { exchangesService } from "@/lib/api/exchanges.service";
import type { CandlesByInterval } from "@/lib/api/exchanges.service";

interface CoinPriceChartProps {
  connectionId: string;
  symbol: string;
  interval: string;
  timeframe: string;
  /** Pre-fetched candle data from getCoinDetail (backend optimization Phase 2) */
  candlesByInterval?: CandlesByInterval;
}

export default function CoinPriceChart({
  connectionId,
  symbol,
  interval,
  timeframe,
  candlesByInterval,
}: CoinPriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const ma5SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ma10SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chartInitialized, setChartInitialized] = useState(false);
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    if (chartInitialized) return; // Prevent re-initialization

    let resizeObserver: ResizeObserver | null = null;
    let cleanup: (() => void) | null = null;

    // Wait for container to have dimensions
    const initChart = () => {
      if (!chartContainerRef.current) return;
      if (chartRef.current) return; // Already initialized

      const container = chartContainerRef.current;
      const width = container.clientWidth || container.offsetWidth || 800;
      
      // Only create chart if container has dimensions
      if (width === 0) {
        // Retry after a short delay (max 10 retries)
        const retryCount = (initChart as any).retryCount || 0;
        if (retryCount < 10) {
          (initChart as any).retryCount = retryCount + 1;
          setTimeout(initChart, 100);
        }
        return;
      }

      // Create chart
      const chart = createChart(container, {
        layout: {
          background: { color: "transparent" },
          textColor: "#94a3b8",
        },
        grid: {
          vertLines: { color: "#1e293b" },
          horzLines: { color: "#1e293b" },
        },
        width: width,
        height: 400,
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
      });

      chartRef.current = chart;

      // lightweight-charts v5 API - use addSeries with series definitions
      // Create candlestick series
      const candlestickSeriesInstance = chart.addSeries(CandlestickSeries, {
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderVisible: false,
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",
      });
      candlestickSeriesRef.current = candlestickSeriesInstance as ISeriesApi<"Candlestick">;

      // Create volume series
      const volumeSeriesInstance = chart.addSeries(HistogramSeries, {
        color: "#26a69a",
        priceFormat: {
          type: "volume",
        },
        priceScaleId: "volume",
      });
      volumeSeriesRef.current = volumeSeriesInstance as ISeriesApi<"Histogram">;
      
      // Set scale margins for volume on the price scale
      chart.priceScale("volume").applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });

      // Create MA5 series
      const ma5SeriesInstance = chart.addSeries(LineSeries, {
        color: "#fbbf24",
        lineWidth: 2,
        title: "MA(5)",
        priceScaleId: "right",
      });
      ma5SeriesRef.current = ma5SeriesInstance as ISeriesApi<"Line">;

      // Create MA10 series
      const ma10SeriesInstance = chart.addSeries(LineSeries, {
        color: "#f97316",
        lineWidth: 2,
        title: "MA(10)",
        priceScaleId: "right",
      });
      ma10SeriesRef.current = ma10SeriesInstance as ISeriesApi<"Line">;

      // Create right price scale for MAs
      chart.priceScale("right").applyOptions({
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      });

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          const width = chartContainerRef.current.clientWidth || chartContainerRef.current.offsetWidth;
          if (width > 0) {
            chartRef.current.applyOptions({
              width: width,
            });
          }
        }
      };

      // Use ResizeObserver for better resize detection
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });

      if (container) {
        resizeObserver.observe(container);
      }

      window.addEventListener("resize", handleResize);

      // Initial resize after a short delay to ensure container is ready
      setTimeout(handleResize, 100);

      // Mark chart as ready
      setChartInitialized(true);
      setChartReady(true);
      setIsLoading(false);

      cleanup = () => {
        window.removeEventListener("resize", handleResize);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
        setChartReady(false);
        setChartInitialized(false);
      };
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      initChart();
    });

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  useEffect(() => {
    let retryTimer: NodeJS.Timeout | null = null;
    
    const fetchData = async () => {
      if (!connectionId || !symbol) {
        setIsLoading(false);
        return;
      }
      
      // Wait for chart to be ready
      if (!chartReady || !candlestickSeriesRef.current) {
        // Retry after a short delay if chart isn't ready yet
        retryTimer = setTimeout(() => {
          fetchData();
        }, 200);
        return;
      }

      try {
        setIsLoading(true);

        let rawCandles: Array<{
          openTime: number;
          open: number;
          high: number;
          low: number;
          close: number;
          volume: number;
          closeTime: number;
        }> = [];

        // Phase 2 optimization: Use embedded candle data if available for this interval
        const embeddedCandles = candlesByInterval?.[interval];
        if (embeddedCandles && embeddedCandles.length > 0) {
          rawCandles = embeddedCandles;
        } else {
          // Fallback: Fetch from API (for intervals not included in embedded data)
          let limit = 100;
          if (timeframe === "3M" || timeframe === "6M") {
            limit = 200;
          }

          const response = await exchangesService.getCandlestickData(
            connectionId,
            symbol,
            interval,
            limit
          );

          if (response.success && response.data) {
            rawCandles = response.data;
          }
        }

        if (rawCandles.length > 0) {
          // Sort data by time in ascending order (lightweight-charts requirement)
          const sortedData = [...rawCandles].sort((a, b) => a.openTime - b.openTime);

          const candles = sortedData.map((c) => ({
            time: (c.openTime / 1000) as any,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }));

          const volumes = sortedData.map((c) => ({
            time: (c.openTime / 1000) as any,
            value: c.volume,
            color: c.close >= c.open ? "#22c55e80" : "#ef444480",
          }));

          // Calculate moving averages
          const ma5: any[] = [];
          const ma10: any[] = [];

          for (let i = 0; i < candles.length; i++) {
            if (i >= 4) {
              const ma5Value =
                candles.slice(i - 4, i + 1).reduce((sum, c) => sum + c.close, 0) / 5;
              ma5.push({
                time: candles[i].time,
                value: ma5Value,
              });
            }

            if (i >= 9) {
              const ma10Value =
                candles.slice(i - 9, i + 1).reduce((sum, c) => sum + c.close, 0) / 10;
              ma10.push({
                time: candles[i].time,
                value: ma10Value,
              });
            }
          }

          // Update series
          if (candlestickSeriesRef.current) {
            candlestickSeriesRef.current.setData(candles as CandlestickData[]);
          }
          if (volumeSeriesRef.current) {
            volumeSeriesRef.current.setData(volumes as HistogramData[]);
          }
          if (ma5SeriesRef.current && ma5.length > 0) {
            ma5SeriesRef.current.setData(ma5 as LineData[]);
          }
          if (ma10SeriesRef.current && ma10.length > 0) {
            ma10SeriesRef.current.setData(ma10 as LineData[]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch chart data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    return () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [connectionId, symbol, interval, timeframe, chartReady, candlesByInterval]);

  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4 relative">
      <div 
        ref={chartContainerRef} 
        style={{ 
          width: "100%", 
          height: "400px", 
          minHeight: "400px"
        }}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[--color-surface]/60 rounded-xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]"></div>
        </div>
      )}
    </div>
  );
}

