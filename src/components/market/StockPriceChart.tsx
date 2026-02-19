'use client';

import { useEffect, useRef, useState } from 'react';
import { exchangesService } from '@/lib/api/exchanges.service';
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  HistogramSeries,
} from 'lightweight-charts';

interface Bar {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockPriceChartProps {
  symbol?: string;
  interval?: string;
  timeframe?: string;
  bars?: Bar[];
  /** When provided (Alpaca), bars are fetched using the user's connection. */
  connectionId?: string | null;
}

// Map frontend timeframe to Alpaca API timeframe
const mapTimeframeToAlpaca = (timeframe: string): string => {
  const mapping: Record<string, string> = {
    '8H': '1Hour',
    '1D': '1Day',
    '1W': '1Day',
    '1M': '1Day',
    '3M': '1Day',
    '6M': '1Day',
  };
  return mapping[timeframe] || '1Day';
};

// Calculate limit based on timeframe
const getLimitForTimeframe = (timeframe: string): number => {
  const limits: Record<string, number> = {
    '8H': 8,      // 8 hourly bars
    '1D': 24,     // 24 hourly bars or 1 day
    '1W': 7,      // 7 daily bars
    '1M': 30,     // 30 daily bars
    '3M': 90,     // 90 daily bars
    '6M': 180,    // 180 daily bars
  };
  return limits[timeframe] || 30;
};

export default function StockPriceChart({ symbol, interval, timeframe = '1D', bars, connectionId }: StockPriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [data, setData] = useState<Bar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch stock chart data from API
  useEffect(() => {
    const fetchStockChartData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // If callers provide `bars`, use them directly
        if (bars && bars.length > 0) {
          setData(bars);
          return;
        }

        if (!symbol) {
          setError('No symbol provided');
          return;
        }

        const alpacaTimeframe = mapTimeframeToAlpaca(timeframe);
        const limit = getLimitForTimeframe(timeframe);

        if (connectionId) {
          const result = await exchangesService.getStockBars(connectionId, symbol.toUpperCase(), alpacaTimeframe, limit);
          const barsData: Bar[] = (result.bars || []).map((bar: any) => ({
            timestamp: bar.timestamp,
            open: bar.open,
            high: bar.high,
            low: bar.low,
            close: bar.close,
            volume: bar.volume,
          }));
          if (barsData.length === 0) setError('No chart data available for this stock');
          else setData(barsData);
          return;
        }

        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const response = await fetch(
          `${API_BASE_URL}/api/stocks-market/stocks/${symbol.toUpperCase()}/bars?timeframe=${alpacaTimeframe}&limit=${limit}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch chart data: ${response.status}`);
        }

        const result = await response.json();
        const barsData: Bar[] = (result.bars || []).map((bar: any) => ({
          timestamp: bar.timestamp,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: bar.volume,
        }));

        if (barsData.length === 0) {
          setError('No chart data available for this stock');
          return;
        }

        setData(barsData);
      } catch (err: any) {
        console.error('Failed to fetch stock chart data:', err);
        setError(err.message || 'Failed to load chart data');
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch if we have a symbol or bars were provided
    if (bars && bars.length > 0) {
      fetchStockChartData();
    } else if (symbol) {
      fetchStockChartData();
    }
  }, [symbol, interval, timeframe, bars, connectionId]);

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: '#111113' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#1e222d' },
        horzLines: { color: '#1e222d' },
      },
      crosshair: {
        mode: 1,
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Add candlestick series - v5 API
    const candlestickSeriesInstance = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    candlestickSeriesRef.current = candlestickSeriesInstance as ISeriesApi<'Candlestick'>;

    // Add volume series - v5 API
    const volumeSeriesInstance = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
    });

    volumeSeriesRef.current = volumeSeriesInstance as ISeriesApi<'Histogram'>;

    // Set volume scale margins
    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    // Transform data to lightweight-charts format
    const candlestickData = data.map((bar) => ({
      time: Math.floor(new Date(bar.timestamp).getTime() / 1000) as any,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
    }));

    const volumeData = data.map((bar) => ({
      time: Math.floor(new Date(bar.timestamp).getTime() / 1000) as any,
      value: bar.volume,
      color: bar.close >= bar.open ? '#22c55e80' : '#ef444480',
    }));

    // Set data
    candlestickSeriesInstance.setData(candlestickData);
    volumeSeriesInstance.setData(volumeData);

    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-6">
        <div className="flex items-center justify-center h-96">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-1">{symbol} Price Chart</h3>
          <p className="text-sm text-slate-400">Historical price data</p>
        </div>
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <svg className="w-12 h-12 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm text-slate-400">{error}</p>
          <p className="text-xs text-slate-500 mt-2">Chart data may be unavailable outside market hours</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">{symbol} Price Chart</h3>
        <p className="text-sm text-slate-400">Historical price data • {timeframe}</p>
      </div>
      <div ref={chartContainerRef} className="w-full h-96" />
    </div>
  );
}


