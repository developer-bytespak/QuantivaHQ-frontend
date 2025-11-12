export function QuantivaLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="QuantivaHQ Logo"
    >
      {/* White sharp triangular/arrow shape on the left pointing right */}
      <path
        d="M 30 100 L 70 60 L 70 85 L 90 100 L 70 115 L 70 140 Z"
        fill="#FFFFFF"
        className="animate-fade-in"
      />
      
      {/* Main orange hexagonal/arrow-like form pointing right with 3D facets */}
      <path
        d="M 90 50 L 150 75 L 170 100 L 150 125 L 90 150 L 100 125 L 100 100 L 100 75 Z"
        fill="#FF6B35"
        className="animate-slide-in-right"
      />
      
      {/* Lighter orange top facet for 3D effect */}
      <path
        d="M 90 50 L 150 75 L 140 85 L 100 75 Z"
        fill="#FF8C5A"
        opacity="0.9"
        className="animate-slide-in-right"
        style={{ animationDelay: "0.1s" }}
      />
      
      {/* Lighter orange side facet */}
      <path
        d="M 150 75 L 170 100 L 160 110 L 140 85 Z"
        fill="#FF9D6B"
        opacity="0.7"
        className="animate-slide-in-right"
        style={{ animationDelay: "0.15s" }}
      />
      
      {/* Darker orange smaller arrow shape below and to the right */}
      <path
        d="M 160 130 L 180 120 L 180 140 L 160 150 Z"
        fill="#E55A2B"
        className="animate-slide-in-right"
        style={{ animationDelay: "0.2s" }}
      />
    </svg>
  );
}

