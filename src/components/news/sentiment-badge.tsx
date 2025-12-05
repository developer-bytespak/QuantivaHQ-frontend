interface SentimentBadgeProps {
  label: string;
  score: number;
  confidence?: number;
  size?: "sm" | "md" | "lg";
}

export function SentimentBadge({ 
  label, 
  score, 
  confidence,
  size = "md" 
}: SentimentBadgeProps) {
  // Determine color based on sentiment
  const getColorClass = () => {
    if (label === "positive") {
      return "bg-green-500/20 text-green-400 border-green-500/30";
    } else if (label === "negative") {
      return "bg-red-500/20 text-red-400 border-red-500/30";
    } else {
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  // Format score display
  const formatScore = () => {
    const sign = score >= 0 ? "+" : "";
    return `${sign}${score.toFixed(2)}`;
  };

  // Size classes
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border ${getColorClass()} ${sizeClasses[size]}`}
    >
      <span className="font-medium capitalize">{label}</span>
      <span className="font-semibold">{formatScore()}</span>
      {confidence !== undefined && (
        <span className="text-xs opacity-70">
          {(confidence * 100).toFixed(0)}%
        </span>
      )}
    </div>
  );
}

