"use client";

import { useEffect, useState } from "react";

interface TradingChartBackgroundProps {
  className?: string;
  opacity?: number;
}

export function TradingChartBackground({ className = "", opacity = 0.15 }: TradingChartBackgroundProps) {
  const [animatedValues, setAnimatedValues] = useState<number[]>([]);

  useEffect(() => {
    // Generate random price points for the chart
    const generateChartData = () => {
      const points = 50;
      const data: number[] = [];
      let currentPrice = 50;
      
      for (let i = 0; i < points; i++) {
        // Simulate realistic price movement
        const change = (Math.random() - 0.48) * 4; // Slight upward bias
        currentPrice = Math.max(30, Math.min(70, currentPrice + change));
        data.push(currentPrice);
      }
      
      return data;
    };

    setAnimatedValues(generateChartData());

    // Update chart data periodically for animation
    const interval = setInterval(() => {
      setAnimatedValues(generateChartData());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (animatedValues.length === 0) return null;

  const maxValue = Math.max(...animatedValues);
  const minValue = Math.min(...animatedValues);
  const range = maxValue - minValue || 1;
  const width = 400;
  const height = 200;
  const padding = 20;

  // Generate path for line chart
  const points = animatedValues.map((value, index) => {
    const x = padding + (index / (animatedValues.length - 1)) * (width - padding * 2);
    const y = padding + height - padding * 2 - ((value - minValue) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");

  // Generate candlestick data
  const candlesticks = animatedValues.map((value, index) => {
    const x = padding + (index / (animatedValues.length - 1)) * (width - padding * 2);
    const open = value;
    const close = index < animatedValues.length - 1 ? animatedValues[index + 1] : value;
    const high = Math.max(open, close) + Math.random() * 3;
    const low = Math.min(open, close) - Math.random() * 3;
    const isGreen = close >= open;
    
    return { x, open, close, high, low, isGreen };
  });

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Line Chart */}
      <svg
        className="absolute"
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ opacity }}
      >
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fc4f02" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#fc4f02" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={`grid-${i}`}
            x1={padding}
            y1={padding + (i * (height - padding * 2)) / 4}
            x2={width - padding}
            y2={padding + (i * (height - padding * 2)) / 4}
            stroke="currentColor"
            strokeWidth="0.5"
            opacity={0.1}
          />
        ))}
        
        {/* Area under curve */}
        <polygon
          points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
          fill="url(#chartGradient)"
        />
        
        {/* Main line */}
        <polyline
          points={points}
          fill="none"
          stroke="#fc4f02"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Candlestick Chart (smaller, positioned differently) */}
      <svg
        className="absolute top-1/2 right-0"
        width="300"
        height="150"
        viewBox="0 0 300 150"
        style={{ opacity: opacity * 0.8 }}
      >
        {candlesticks.slice(0, 20).map((candle, index) => {
          const candleWidth = 8;
          const candleX = candle.x * 0.75; // Scale down
          const candleHeight = Math.abs(candle.close - candle.open);
          const candleY = Math.min(candle.open, candle.close);
          const scaledY = padding + (150 - padding * 2) - ((candleY - minValue) / range) * (150 - padding * 2);
          const scaledHeight = (candleHeight / range) * (150 - padding * 2);
          
          return (
            <g key={index}>
              {/* Wick */}
              <line
                x1={candleX}
                y1={padding + (150 - padding * 2) - ((candle.high - minValue) / range) * (150 - padding * 2)}
                x2={candleX}
                y2={padding + (150 - padding * 2) - ((candle.low - minValue) / range) * (150 - padding * 2)}
                stroke={candle.isGreen ? "#10b981" : "#ef4444"}
                strokeWidth="1"
              />
              {/* Body */}
              <rect
                x={candleX - candleWidth / 2}
                y={scaledY - scaledHeight}
                width={candleWidth}
                height={Math.max(scaledHeight, 2)}
                fill={candle.isGreen ? "#10b981" : "#ef4444"}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

