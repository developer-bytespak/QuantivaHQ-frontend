'use client';

import { useEffect, useRef, useState } from 'react';
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
}

export default function StockPriceChart({ symbol, interval, timeframe, bars }: StockPriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [data, setData] = useState<Bar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch stock chart data
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

        // Otherwise, generate mock data since we don't have a stock chart API endpoint
        const mockData: Bar[] = [];
        const basePrice = 250; // Mock base price
        const now = new Date();

        for (let i = 30; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const randomVariation = (Math.random() - 0.5) * 10;
          const open = basePrice + randomVariation;
          const close = open + (Math.random() - 0.5) * 5;
          const high = Math.max(open, close) + Math.random() * 3;
          const low = Math.min(open, close) - Math.random() * 3;

          mockData.push({
            timestamp: date.toISOString(),
            open,
            high,
            low,
            close,
            volume: Math.floor(Math.random() * 1000000) + 100000,
          });
        }

        setData(mockData);
      } catch (err: any) {
        console.error('Failed to fetch stock chart data:', err);
        setError(err.message || 'Failed to load chart data');
      } finally {
        setIsLoading(false);
      }
    };

    // Only attempt to fetch/generate if we have a symbol or bars were provided
    if (bars && bars.length > 0) {
      // bars already set in fetchStockChartData early return, but call to keep lifecycle consistent
      fetchStockChartData();
    } else if (symbol) {
      fetchStockChartData();
    }
  }, [symbol, interval, timeframe]);

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

  return (
    <div className="rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">{symbol} Price Chart</h3>
        <p className="text-sm text-slate-400">Historical price data</p>
      </div>
      <div ref={chartContainerRef} className="w-full h-96" />
    </div>
  );
}


