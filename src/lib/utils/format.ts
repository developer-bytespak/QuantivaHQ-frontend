/**
 * Format utilities for stocks dashboard
 */

/**
 * Format market cap to human-readable format
 * Examples: 1.2T, 45.3B, 890M
 */
export function formatMarketCap(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) {
    return 'N/A';
  }

  const absValue = Math.abs(value);

  if (absValue >= 1_000_000_000_000) {
    // Trillions
    return `${(value / 1_000_000_000_000).toFixed(2)}T`;
  } else if (absValue >= 1_000_000_000) {
    // Billions
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (absValue >= 1_000_000) {
    // Millions
    return `${(value / 1_000_000).toFixed(2)}M`;
  } else if (absValue >= 1_000) {
    // Thousands
    return `${(value / 1_000).toFixed(2)}K`;
  }

  return value.toFixed(2);
}

/**
 * Format volume to human-readable format
 * Examples: 12.5M, 1.2B
 */
export function formatVolume(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) {
    return 'N/A';
  }

  const absValue = Math.abs(value);

  if (absValue >= 1_000_000_000) {
    // Billions
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (absValue >= 1_000_000) {
    // Millions
    return `${(value / 1_000_000).toFixed(2)}M`;
  } else if (absValue >= 1_000) {
    // Thousands
    return `${(value / 1_000).toFixed(2)}K`;
  }

  return value.toFixed(0);
}

/**
 * Format price to currency format
 * Examples: $123.45, $1,234.56
 */
export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage change
 * Examples: +2.34%, -1.23%, 0.00%
 */
export function formatPercent(
  value: number | null | undefined,
  includeSign = true,
): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  const sign = value > 0 && includeSign ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format number with commas
 * Examples: 1,234,567
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Get color class for percent change
 */
export function getChangeColorClass(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) {
    return 'text-slate-300';
  }

  return value > 0 ? 'text-green-400' : 'text-red-400';
}

/**
 * Format timestamp to relative time
 * Examples: "2m ago", "1h ago", "3d ago"
 */
export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}d ago`;
  } else if (diffHours > 0) {
    return `${diffHours}h ago`;
  } else if (diffMins > 0) {
    return `${diffMins}m ago`;
  } else {
    return 'Just now';
  }
}

/**
 * Truncate text to max length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}
