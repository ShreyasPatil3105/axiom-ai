// src/components/CodeDiff/index.tsx

import { useState, useEffect } from "react";

interface CodeItem {
  id: string;
  status: "PROVEN" | "DISPROVEN" | "FUZZ_PASS" | "FUZZ_FAIL" | "TIMEOUT_INCONCLUSIVE";
  risk_tier: "GREEN" | "YELLOW" | "RED";
  localisation?: {
    line: number;
    old_snippet: string;
    new_snippet: string;
  } | null;
  counterexample?: {
    x: number;
    y: number;
    old_output: number;
    new_output: number;
  } | null;
  repair_attempts?: number;
  reproducible_command: string;
}

interface CodeDiffProps {
  item: CodeItem;
  oldCode: string;
  newCode: string;
}

export default function CodeDiff({ item, oldCode, newCode }: CodeDiffProps) {
  // Counterexample replay animation state
  const [currentLine, setCurrentLine] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    if (item.status === "DISPROVEN" && !animationComplete) {
      setIsAnimating(true);
      const totalLines = Math.max(oldCode.split("\n").length, newCode.split("\n").length);
      let line = 0;
      const interval = setInterval(() => {
        line++;
        setCurrentLine(line);
        if (line >= totalLines) {
          clearInterval(interval);
          setIsAnimating(false);
          setAnimationComplete(true);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [item.status, animationComplete, oldCode, newCode]);

  // Get color and label for status badge
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "PROVEN":
        return { 
          color: "bg-green-100 text-green-800 border-green-300", 
          label: "✅ Mathematically Proven",
          detail: "Z3 verified across ALL possible inputs"
        };
      case "DISPROVEN":
        return { 
          color: "bg-red-100 text-red-800 border-red-300", 
          label: "❌ Disproven",
          detail: "Counterexample found"
        };
      case "FUZZ_PASS":
        return { 
          color: "bg-blue-100 text-blue-800 border-blue-300", 
          label: "🔵 Passed Fuzz Testing",
          detail: "Tested with 10,000 random inputs"
        };
      case "FUZZ_FAIL":
        return { 
          color: "bg-red-100 text-red-800 border-red-300", 
          label: "❌ Fuzz Test Failed",
          detail: "Mismatch found during fuzzing"
        };
      case "TIMEOUT_INCONCLUSIVE":
        return { 
          color: "bg-gray-100 text-gray-700 border-gray-300", 
          label: "⚪ Inconclusive",
          detail: "Z3 timed out"
        };
      default:
        return { 
          color: "bg-gray-100 text-gray-700 border-gray-300", 
          label: "Unknown",
          detail: ""
        };
    }
  };

  const statusConfig = getStatusConfig(item.status);

  // Get risk tier color
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "GREEN": return "text-green-600";
      case "YELLOW": return "text-yellow-600";
      case "RED": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  // Split code into lines for display
  const oldLines = oldCode.split('\n');
  const newLines = newCode.split('\n');

  // Check if a line should be highlighted as currently executing
  const isCurrentLine = (lineIndex: number) => {
    return isAnimating && lineIndex + 1 === currentLine;
  };

  // Check if a line is the divergent line (highlighted red at animation end)
  const isDivergentLine = (lineIndex: number) => {
    if (item.status !== "DISPROVEN" || !item.localisation) return false;
    if (!animationComplete && isAnimating) return false;
    return lineIndex + 1 === item.localisation.line;
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white">
      {/* Header with status and risk tier */}
      <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
          <span className={`text-xs font-medium ${getRiskColor(item.risk_tier)}`}>
            Risk: {item.risk_tier}
          </span>
        </div>
        {item.repair_attempts !== undefined && item.repair_attempts > 0 && (
          <span className="text-xs text-gray-400">
            Repair attempts: {item.repair_attempts}
          </span>
        )}
      </div>

      {/* Status detail */}
      <p className="text-xs text-gray-500 mb-3">{statusConfig.detail}</p>

      {/* Animation indicator */}
      {isAnimating && (
        <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200 text-center">
          <p className="text-xs font-medium text-blue-700">
            🔄 Replaying execution... Line {currentLine}
          </p>
        </div>
      )}

      {/* Counterexample (for DISPROVEN) */}
      {item.status === "DISPROVEN" && item.counterexample && (
        <div className="mb-3 p-3 bg-red-50 rounded border border-red-200">
          <p className="text-xs font-medium text-red-700 mb-1">💥 Counterexample found:</p>
          <div className="grid grid-cols-3 gap-2 text-sm font-mono">
            <div>
              <span className="text-gray-500">Input:</span>
              <span className="ml-1 font-bold">
                x={item.counterexample.x}, y={item.counterexample.y}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Old output:</span>
              <span className="ml-1 font-bold text-green-600">
                {item.counterexample.old_output}
              </span>
            </div>
            <div>
              <span className="text-gray-500">New output:</span>
              <span className="ml-1 font-bold text-red-600">
                {item.counterexample.new_output}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Code diff */}
      <div className="grid grid-cols-2 gap-2 border rounded overflow-hidden">
        {/* Old code */}
        <div className="bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-500 mb-2">Old Code</p>
          <pre className="text-sm font-mono whitespace-pre-wrap">
            {oldLines.map((line, index) => (
              <div
                key={index}
                className={`${isDivergentLine(index) ? 'bg-red-100 border-l-4 border-red-500 pl-1' : ''} ${isCurrentLine(index) ? 'bg-yellow-100 border-l-4 border-yellow-500 pl-1' : ''}`}
              >
                <span className="text-xs text-gray-400 mr-2">{index + 1}</span>
                {line || ' '}
                {isDivergentLine(index) && (
                  <span className="text-xs text-red-600 ml-2">← Divergence</span>
                )}
                {isCurrentLine(index) && (
                  <span className="text-xs text-blue-600 ml-2">← Executing</span>
                )}
              </div>
            ))}
          </pre>
        </div>

        {/* New code */}
        <div className="bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-500 mb-2">New Code</p>
          <pre className="text-sm font-mono whitespace-pre-wrap">
            {newLines.map((line, index) => (
              <div
                key={index}
                className={`${isDivergentLine(index) ? 'bg-red-100 border-l-4 border-red-500 pl-1' : ''} ${isCurrentLine(index) ? 'bg-yellow-100 border-l-4 border-yellow-500 pl-1' : ''}`}
              >
                <span className="text-xs text-gray-400 mr-2">{index + 1}</span>
                {line || ' '}
                {isDivergentLine(index) && (
                  <span className="text-xs text-red-600 ml-2">← Divergence</span>
                )}
                {isCurrentLine(index) && (
                  <span className="text-xs text-blue-600 ml-2">← Executing</span>
                )}
              </div>
            ))}
          </pre>
        </div>
      </div>

      {/* Localisation details (for DISPROVEN) */}
      {item.status === "DISPROVEN" && item.localisation && (
        <div className="mt-3 p-2 bg-gray-50 rounded border border-gray-200">
          <p className="text-xs font-medium text-gray-500">Localisation:</p>
          <div className="grid grid-cols-2 gap-2 mt-1 text-sm font-mono">
            <div>
              <span className="text-gray-500">Old:</span>
              <span className="ml-1 text-gray-700">{item.localisation.old_snippet}</span>
            </div>
            <div>
              <span className="text-gray-500">New:</span>
              <span className="ml-1 text-gray-700">{item.localisation.new_snippet}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">Line {item.localisation.line}</p>
        </div>
      )}

      {/* Reproducible command */}
      <div className="mt-3 pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-300 font-mono truncate">
          {item.reproducible_command}
        </p>
      </div>
    </div>
  );
}
