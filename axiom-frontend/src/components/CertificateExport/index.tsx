// src/components/CertificateExport/index.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface CertificateExportProps {
  verdict: {
    audit_trail_id: string;
    artefact_type: "code" | "claim_set";
    overall_trust_score: number;
    items: any[];
    generated_at: string;
    verdict_hash: string;
  };
  label?: string;
}

export default function CertificateExport({ verdict, label = "📄 Export Certificate" }: CertificateExportProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  // Fix hydration: only render date on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleExport = async () => {
    if (!certificateRef.current) return;

    try {
      // Capture the certificate content as an image
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`verdict-${verdict.audit_trail_id}.pdf`);
    } catch (error) {
      console.error("Failed to export certificate:", error);
      alert("Failed to export certificate. Please try again.");
    }
  };

  // Helper to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PROVEN":
      case "SUPPORTED":
        return "#22c55e";
      case "DISPROVEN":
      case "CONTRADICTED":
      case "FUZZ_FAIL":
        return "#ef4444";
      case "FUZZ_PASS":
        return "#3b82f6";
      case "UNSUPPORTED":
      case "TIMEOUT_INCONCLUSIVE":
        return "#6b7280";
      case "DISPUTED":
        return "#eab308";
      default:
        return "#6b7280";
    }
  };

  // Helper to get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PROVEN": return "✅ Mathematically Proven";
      case "DISPROVEN": return "❌ Disproven";
      case "FUZZ_PASS": return "🔵 Passed Fuzz Testing";
      case "FUZZ_FAIL": return "❌ Fuzz Test Failed";
      case "TIMEOUT_INCONCLUSIVE": return "⚪ Inconclusive";
      case "SUPPORTED": return "✅ Supported";
      case "CONTRADICTED": return "❌ Contradicted";
      case "UNSUPPORTED": return "⚪ No Evidence";
      case "DISPUTED": return "⚠️ Disputed";
      default: return status;
    }
  };

  // Format date consistently (avoid hydration mismatch)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div>
      {/* Hidden certificate content (for PDF generation) */}
      <div
        ref={certificateRef}
        className="fixed left-[-9999px] top-0 w-[210mm] bg-white p-8"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        {/* Header */}
        <div className="text-center border-b pb-4 mb-4">
          <h1 className="text-2xl font-bold text-blue-600">AXIOM AI</h1>
          <p className="text-sm text-gray-500">Universal Verification Oracle</p>
          <p className="text-xs text-gray-400 mt-1">Verdict Certificate</p>
        </div>

        {/* Audit Info */}
        <div className="text-center text-xs text-gray-400 mb-4">
          <p>Audit ID: {verdict.audit_trail_id}</p>
          <p>Generated: {isClient ? formatDate(verdict.generated_at) : ""}</p>
        </div>

        {/* Trust Score */}
        <div className="text-center mb-4">
          <div className="inline-block p-4 border-4 rounded-full" style={{ borderColor: getStatusColor(verdict.overall_trust_score >= 70 ? "PROVEN" : "DISPROVEN") }}>
            <span className="text-3xl font-bold">{Math.round(verdict.overall_trust_score)}</span>
            <span className="text-xs text-gray-500 block">Trust Score</span>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-3">
          {verdict.items.map((item: any, index: number) => {
            const isCode = 'risk_tier' in item;
            const statusColor = getStatusColor(item.status);
            
            return (
              <div key={index} className="border rounded p-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">
                    {isCode ? `Function ${index + 1}` : `Claim ${index + 1}`}
                  </span>
                  <span style={{ color: statusColor }} className="font-medium">
                    {getStatusLabel(item.status)}
                  </span>
                </div>
                
                {isCode ? (
                  // Code item
                  <>
                    <p className="text-xs text-gray-500">Risk: {item.risk_tier}</p>
                    {item.counterexample && (
                      <div className="mt-1 p-2 bg-red-50 rounded text-xs">
                        <p>Counterexample: x={item.counterexample.x}, y={item.counterexample.y}</p>
                        <p>Old: {item.counterexample.old_output} → New: {item.counterexample.new_output}</p>
                      </div>
                    )}
                  </>
                ) : (
                  // Claim item
                  <>
                    <p className="text-xs">"{item.claim_text}"</p>
                    {item.cited_passage && (
                      <div className="mt-1 p-2 bg-gray-50 rounded text-xs">
                        <p className="text-gray-500">Source: {item.source_name || "Unknown"}</p>
                        <p className="mt-0.5">"{item.cited_passage}"</p>
                      </div>
                    )}
                    {item.conflicting_sources && (
                      <div className="mt-1 p-2 bg-yellow-50 rounded text-xs">
                        <p className="font-medium text-yellow-800">⚠️ Sources Disagree:</p>
                        {item.conflicting_sources.map((source: any, idx: number) => (
                          <p key={idx} className="mt-0.5">• {source.name} (Authority: {Math.round(source.authority_score * 100)}%)</p>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">Confidence: {Math.round(item.confidence * 100)}%</p>
                  </>
                )}
                
                <p className="text-xs text-gray-300 mt-1 font-mono truncate">
                  {item.reproducible_command}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-2 border-t text-center text-xs text-gray-400">
          <p className="font-mono">Verdict Hash: {verdict.verdict_hash}</p>
          <p className="mt-1">This certificate is tamper-evident — any change produces a different hash</p>
        </div>
      </div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center gap-2 text-sm font-medium"
      >
        {label}
      </button>
    </div>
  );
}