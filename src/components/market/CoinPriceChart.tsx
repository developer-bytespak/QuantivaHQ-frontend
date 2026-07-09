"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  CandlestickSeries,
  HistogramSeries
} from "lightweight-charts";
import { exchangesService } from "@/lib/api/exchanges.service";
import type { CandlesByInterval } from "@/lib/api/exchanges.service";
import { getPublicKlines } from "@/lib/api/public-market.service";
import { ChartIndicators } from "@/lib/indicators/manager";
import { useChartIndicators } from "@/lib/indicators/useChartIndicators";
import { chartHeightFor } from "@/lib/indicators/layout";
import ChartIndicatorMenu from "./ChartIndicatorMenu";

interface CoinPriceChartProps {
  /** When omitted, the chart runs in public mode and pulls data from
   *  Binance's anonymous market endpoints. */
  connectionId?: string;
  symbol: string;
  interval: string;
  timeframe: string;
  /** Pre-fetched candle data from getCoinDetail (backend optimization Phase 2) */
  candlesByInterval?: CandlesByInterval;
  /** Optional initial candles for public mode (avoids a second fetch on
   *  first render when the page already pulled klines via getPublicKlines). */
  initialCandles?: Array<{
    openTime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    closeTime: number;
  }>;
}

export default function CoinPriceChart({
  connectionId,
  symbol,
  interval,
  timeframe,
  candlesByInterval,
  initialCandles,
}: CoinPriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const indicatorsRef = useRef<ChartIndicators | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chartInitialized, setChartInitialized] = useState(false);
  const [chartReady, setChartReady] = useState(false);

  const { active, toggle, clear, getActive } = useChartIndicators();

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
        height: chartHeightFor(getActive()),
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

      // Create right price scale (shared by candles + moving-average overlays)
      chart.priceScale("right").applyOptions({
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      });

      // Technical-study manager (SMA/EMA overlays + RSI/MACD panes).
      indicatorsRef.current = new ChartIndicators(chart);

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
        if (indicatorsRef.current) {
          indicatorsRef.current.dispose();
          indicatorsRef.current = null;
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
      if (!symbol) {
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
          // Fallback: Fetch from API (for intervals not included in embedded data).
          // Public mode (no connectionId) pulls from Binance's anonymous
          // klines endpoint; connected mode goes through the exchange.
          // 300 candles gives the 200-period moving averages enough history to
          // render (Binance klines weight is still just 2 at this size).
          let limit = 300;
          if (timeframe === "3M" || timeframe === "6M") {
            limit = 400;
          }

          if (connectionId) {
            const response = await exchangesService.getCandlestickData(
              connectionId,
              symbol,
              interval,
              limit,
            );
            if (response.success && response.data) {
              rawCandles = response.data;
            }
          } else {
            // Public mode — first try the initialCandles for the default
            // interval, then fall back to fetching public klines for the
            // selected timeframe.
            if (interval === "1d" && initialCandles && initialCandles.length > 0) {
              rawCandles = initialCandles;
            } else {
              try {
                rawCandles = await getPublicKlines(symbol, interval, limit);
              } catch (err) {
                console.warn("[CoinPriceChart] public klines fetch failed", err);
              }
            }
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

          // Update price + volume series
          if (candlestickSeriesRef.current) {
            candlestickSeriesRef.current.setData(candles as CandlestickData[]);
          }
          if (volumeSeriesRef.current) {
            volumeSeriesRef.current.setData(volumes as HistogramData[]);
          }

          // Feed the technical studies from the same candles and (re)draw the
          // user's active selection.
          if (indicatorsRef.current) {
            indicatorsRef.current.setCandles(
              candles.map((c) => ({ time: c.time as number, close: c.close })),
            );
            indicatorsRef.current.apply(getActive());
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
  }, [connectionId, symbol, interval, timeframe, chartReady, candlesByInterval, initialCandles]);

  // Re-draw studies when the user toggles them (no refetch needed — the
  // manager already holds the latest candles). Also grow the chart so added
  // oscillator panes don't crush the price pane.
  useEffect(() => {
    indicatorsRef.current?.apply(active);
    chartRef.current?.applyOptions({ height: chartHeightFor(active) });
  }, [active]);

  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4 relative">
      <div className="mb-3 flex items-center justify-end">
        <ChartIndicatorMenu active={active} onToggle={toggle} onClear={clear} />
      </div>
      <div
        ref={chartContainerRef}
        style={{
          width: "100%",
          height: `${chartHeightFor(active)}px`,
          minHeight: `${chartHeightFor(active)}px`
        }}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[--color-surface]/60 rounded-xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[var(--primary)]"></div>
        </div>
      )}
    </div>
  );
}

