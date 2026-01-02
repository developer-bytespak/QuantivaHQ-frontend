'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import chart component (client-side only)
const StockPriceChart = dynamic(
  () => import('@/components/market/StockPriceChart'),
  { ssr: false }
);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface StockDetail {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number | null;
  sector: string;
  high24h: number;
  low24h: number;
  prevClose: number;
  open: number;
  timestamp: string;
}

interface Bar {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = params.symbol as string;

  const [stock, setStock] = useState<StockDetail | null>(null);
  const [bars, setBars] = useState<Bar[]>([]);
  const [timeframe, setTimeframe] = useState('1Day');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timeframes = [
    { value: '1Day', label: '1D' },
    { value: '1Hour', label: '1H' },
    { value: '15Min', label: '15M' },
  ];

  // Fetch stock details and bars
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch stock detail
        const detailRes = await fetch(
          `${API_BASE_URL}/api/stocks-market/stocks/${symbol.toUpperCase()}`
        );
        if (!detailRes.ok) throw new Error('Failed to fetch stock detail');
        const detailData = await detailRes.json();
        setStock(detailData);

        // Fetch bars for chart
        const barsRes = await fetch(
          `${API_BASE_URL}/api/stocks-market/stocks/${symbol.toUpperCase()}/bars?timeframe=${timeframe}&limit=100`
        );
        if (!barsRes.ok) throw new Error('Failed to fetch bars');
        const barsData = await barsRes.json();
        setBars(barsData.bars || []);
      } catch (err: any) {
        console.error('Error fetching stock data:', err);
        setError(err.message || 'Failed to load stock data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, timeframe]);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatVolume = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatMarketCap = (value: number | null) => {
    if (!value) return 'N/A';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-4">
        <div className="text-red-500 text-xl mb-4">
          {error || 'Stock not found'}
        </div>
        <button
          onClick={() => router.back()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isPositive = stock.change24h >= 0;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">{stock.symbol}</h1>
            <p className="text-gray-400">{stock.name}</p>
          </div>
        </div>

        {/* Price Info */}
        <div className="bg-[#111113] rounded-xl p-6 border border-white/5">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <div className="text-4xl font-bold">
                {formatPrice(stock.price)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {isPositive ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
                <span
                  className={`text-lg font-semibold ${
                    isPositive ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {isPositive ? '+' : ''}
                  {formatPrice(stock.change24h)} (
                  {stock.changePercent24h.toFixed(2)}%)
                </span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 ml-auto">
              <div>
                <div className="text-xs text-gray-400">24h High</div>
                <div className="text-lg font-semibold">
                  {formatPrice(stock.high24h)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">24h Low</div>
                <div className="text-lg font-semibold">
                  {formatPrice(stock.low24h)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">24h Volume</div>
                <div className="text-lg font-semibold">
                  {formatVolume(stock.volume24h)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Market Cap</div>
                <div className="text-lg font-semibold">
                  {formatMarketCap(stock.marketCap)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-[#111113] rounded-xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Price Chart</h2>
            <div className="flex gap-2">
              {timeframes.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    timeframe === tf.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {bars.length > 0 ? (
            <StockPriceChart data={bars} />
          ) : (
            <div className="h-96 flex items-center justify-center text-gray-400">
              No chart data available
            </div>
          )}
        </div>

        {/* Stock Info */}
        <div className="bg-[#111113] rounded-xl p-6 border border-white/5">
          <h2 className="text-xl font-bold mb-4">Stock Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between py-3 border-b border-white/5">
              <span className="text-gray-400">Sector</span>
              <span className="font-semibold">{stock.sector}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-white/5">
              <span className="text-gray-400">Previous Close</span>
              <span className="font-semibold">
                {formatPrice(stock.prevClose)}
              </span>
            </div>
            <div className="flex justify-between py-3 border-b border-white/5">
              <span className="text-gray-400">Open</span>
              <span className="font-semibold">{formatPrice(stock.open)}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-white/5">
              <span className="text-gray-400">24h High</span>
              <span className="font-semibold">
                {formatPrice(stock.high24h)}
              </span>
            </div>
            <div className="flex justify-between py-3 border-b border-white/5">
              <span className="text-gray-400">24h Low</span>
              <span className="font-semibold">{formatPrice(stock.low24h)}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-white/5">
              <span className="text-gray-400">24h Volume</span>
              <span className="font-semibold">
                {formatVolume(stock.volume24h)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
