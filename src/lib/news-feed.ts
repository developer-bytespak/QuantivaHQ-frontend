export type NewsItem = {
  id: string;
  headline: string;
  impactScore: number;
  sentiment: "bullish" | "bearish" | "neutral";
  source: string;
  publishedAt: string;
};

export function rankNewsFeed(items: NewsItem[]) {
  return [...items].sort((a, b) => b.impactScore - a.impactScore);
}

export function summarizeNews(items: NewsItem[]) {
  const bullish = items.filter((item) => item.sentiment === "bullish").length;
  const bearish = items.filter((item) => item.sentiment === "bearish").length;
  const neutral = items.length - bullish - bearish;

  return {
    total: items.length,
    bullish,
    bearish,
    neutral,
    summary: `Bullish: ${bullish}, Bearish: ${bearish}, Neutral: ${neutral}`,
  };
}
