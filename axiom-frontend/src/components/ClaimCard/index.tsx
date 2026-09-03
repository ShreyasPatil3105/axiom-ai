// src/components/ClaimCard/index.tsx

interface ClaimItem {
  id: string;
  claim_text: string;
  status: "SUPPORTED" | "CONTRADICTED" | "UNSUPPORTED" | "DISPUTED";
  cited_passage?: string | null;
  exact_span?: string | null;
  source_name?: string | null;
  authority_score?: number | null;
  freshness_decay?: number | null;
  conflicting_sources?: Array<{
    name: string;
    passage: string;
    authority_score: number;
  }> | null;
  confidence: number;
  reproducible_command: string;
}

interface ClaimCardProps {
  claim: ClaimItem;
}

export default function ClaimCard({ claim }: ClaimCardProps) {
  // Get color and label for status badge
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "SUPPORTED":
        return { color: "bg-green-100 text-green-800 border-green-300", label: "✅ Supported" };
      case "CONTRADICTED":
        return { color: "bg-red-100 text-red-800 border-red-300", label: "❌ Contradicted" };
      case "UNSUPPORTED":
        return { color: "bg-gray-100 text-gray-700 border-gray-300", label: "⚪ No Evidence" };
      case "DISPUTED":
        return { color: "bg-yellow-100 text-yellow-800 border-yellow-300", label: "⚠️ Disputed" };
      default:
        return { color: "bg-gray-100 text-gray-700 border-gray-300", label: "Unknown" };
    }
  };

  const statusConfig = getStatusConfig(claim.status);

  // Highlight the exact span in the passage
  const highlightPassage = (passage: string, span: string | null | undefined) => {
    if (!span || !passage) return passage;
    
    const parts = passage.split(span);
    if (parts.length <= 1) return passage;
    
    return parts.map((part, index) => (
      <span key={index}>
        {part}
        {index < parts.length - 1 && (
          <mark className="bg-yellow-200 px-0.5 rounded">
            {span}
          </mark>
        )}
      </span>
    ));
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white">
      {/* Claim text */}
      <div className="mb-3">
        <p className="text-sm font-medium text-gray-700">Claim:</p>
        <p className="text-gray-900">"{claim.claim_text}"</p>
      </div>

      {/* Status badge */}
      <div className="mb-3">
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
        {claim.confidence && (
          <span className="ml-2 text-xs text-gray-400">
            confidence: {Math.round(claim.confidence * 100)}%
          </span>
        )}
      </div>

      {/* For SUPPORTED or CONTRADICTED — show the passage */}
      {(claim.status === "SUPPORTED" || claim.status === "CONTRADICTED") && claim.cited_passage && (
        <div className="mb-3 p-3 bg-gray-50 rounded border border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-1">Source:</p>
          <p className="text-sm text-gray-700">
            {highlightPassage(claim.cited_passage, claim.exact_span)}
          </p>
          {claim.source_name && (
            <p className="text-xs text-gray-400 mt-1">
              Source: {claim.source_name}
              {claim.authority_score !== null && claim.authority_score !== undefined && (
                <> • Authority: {Math.round(claim.authority_score * 100)}%</>
              )}
              {claim.freshness_decay !== null && claim.freshness_decay !== undefined && (
                <> • Freshness: {Math.round(claim.freshness_decay * 100)}%</>
              )}
            </p>
          )}
        </div>
      )}

      {/* For UNSUPPORTED — show why */}
      {claim.status === "UNSUPPORTED" && claim.cited_passage && (
        <div className="mb-3 p-3 bg-gray-50 rounded border border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-1">Source says:</p>
          <p className="text-sm text-gray-500 italic">"{claim.cited_passage}"</p>
          <p className="text-xs text-gray-400 mt-1">
            This source does not support or contradict the claim.
          </p>
        </div>
      )}

      {/* For DISPUTED — show both conflicting sources */}
      {claim.status === "DISPUTED" && claim.conflicting_sources && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-500 mb-2">⚠️ Sources disagree:</p>
          <div className="grid grid-cols-1 gap-2">
            {claim.conflicting_sources.map((source, index) => (
              <div key={index} className="p-2 rounded border text-sm">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-gray-700">{source.name}</span>
                  <span className="text-xs text-gray-400">
                    Authority: {Math.round(source.authority_score * 100)}%
                  </span>
                </div>
                <p className="text-gray-600 mt-1">"{source.passage}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reproducible command (hidden in UI but present for audit) */}
      <div className="mt-2 pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-300 font-mono truncate">
          {claim.reproducible_command}
        </p>
      </div>
    </div>
  );
}