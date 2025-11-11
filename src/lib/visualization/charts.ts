export type ChartSeries = {
  label: string;
  data: Array<{ time: number; value: number }>;
};

export function buildProbabilityOverlay(probability: number) {
  return {
    headline: `Probability of upward movement: ${Math.round(probability * 100)}%`,
    bands: [
      { label: "Bullish", color: "#22d3ee", confidence: Math.min(probability + 0.1, 1) },
      { label: "Base", color: "#60a5fa", confidence: probability },
      { label: "Bearish", color: "#f87171", confidence: Math.max(probability - 0.15, 0) },
    ],
  };
}

export function generateSparkline(series: ChartSeries) {
  const values = series.data.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return {
    min,
    max,
    normalized: values.map((value) => (value - min) / (max - min || 1)),
  };
}
