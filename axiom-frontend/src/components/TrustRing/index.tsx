// src/components/TrustRing/index.tsx

interface TrustRingProps {
  score: number;
  size?: number;
  label?: string;
}

export default function TrustRing({ score, size = 120, label = "Trust Score" }: TrustRingProps) {
  // Clamp score between 0 and 100
  const clampedScore = Math.min(100, Math.max(0, score));
  
  // Calculate color based on score
  const getColor = () => {
    if (clampedScore < 40) return "#ef4444"; // red
    if (clampedScore < 70) return "#eab308"; // yellow
    return "#22c55e"; // green
  };

  const color = getColor();
  
  // Calculate stroke-dasharray for the ring
  const circumference = 2 * Math.PI * 45; // radius = 45
  const offset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative inline-flex items-center justify-center">
        {/* Background ring */}
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
          viewBox="0 0 120 120"
        >
          <circle
            cx="60"
            cy="60"
            r="45"
            stroke="#e5e7eb"
            strokeWidth="10"
            fill="none"
          />
          {/* Score ring */}
          <circle
            cx="60"
            cy="60"
            r="45"
            stroke={color}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 0.8s ease-in-out",
            }}
          />
        </svg>
        
        {/* Score text in center */}
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-bold" style={{ color }}>
            {Math.round(clampedScore)}
          </span>
          <span className="text-xs text-gray-500">{label}</span>
        </div>
      </div>
    </div>
  );
}