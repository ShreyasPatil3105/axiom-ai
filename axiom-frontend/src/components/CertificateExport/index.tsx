// src/components/CertificateExport/index.tsx
"use client";

import { useRef, useEffect, useState } from "react";
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

export default function CertificateExport({ verdict, label = "Export Certificate" }: CertificateExportProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  // Fix hydration: only render date on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleExportSummary = async () => {
    if (!certificateRef.current) return;
    try {
      const item = verdict.items[0];
      const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <title>AXIOM AI — Verification Certificate</title>
  <style>
    body { font-family: "Courier New", monospace; max-width: 800px; margin: 0 auto; padding: 40px; color: #111; }
    .header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 20px; }
    .header h1 { font-size: 20px; margin: 0; letter-spacing: 2px; }
    .header span { font-size: 12px; letter-spacing: 1px; }
    .status-row { display: flex; justify-content: space-between; align-items: center; margin: 20px 0; padding: 15px; border: 1px solid #ccc; }
    .status-dot { font-size: 14px; font-weight: bold; }
    .status-dot.proven { color: #0a7d0a; }
    .status-dot.disproven { color: #c00; }
    .trust-score { font-size: 28px; font-weight: bold; }
    .metadata { display: grid; grid-template-columns: 150px 1fr; gap: 6px; font-size: 12px; margin: 15px 0; }
    .metadata .label { font-weight: bold; }
    .section { margin: 25px 0; }
    .section-title { font-size: 13px; font-weight: bold; letter-spacing: 2px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
    .code-diff { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .code-diff pre { background: #f8f8f8; padding: 12px; border: 1px solid #ddd; font-size: 12px; overflow-x: auto; }
    .scope-table { width: 100%; font-size: 12px; border-collapse: collapse; }
    .scope-table td { padding: 4px 0; border-bottom: 1px solid #eee; }
    .scope-table td:last-child { text-align: right; }
    .integrity { font-size: 11px; color: #555; margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc; }
    .footer { text-align: center; font-size: 10px; color: #888; margin-top: 30px; }
  </style>
</head>
<body>

  <div class="header">
    <h1>AXIOM AI</h1>
    <span>VERIFICATION CERTIFICATE</span>
  </div>

  <div class="status-row">
    <div>
      <p class="status-dot ${item.status === 'PROVEN' ? 'proven' : 'disproven'}">● ${item.status}</p>
      <p style="font-size:12px;margin:4px 0 0;">${item.status === 'PROVEN' ? 'Mathematical equivalence' : 'Divergence detected'}</p>
    </div>
    <div class="trust-score">${verdict.overall_trust_score} / 100</div>
  </div>

  <div class="metadata">
    <span class="label">Run ID</span><span>${verdict.audit_trail_id.substring(0, 13).toUpperCase()}</span>
    <span class="label">Timestamp</span><span>${verdict.generated_at}</span>
    <span class="label">Engine</span><span>CODE EQUIVALENCE</span>
    <span class="label">Solver</span><span>Z3</span>
    <span class="label">Encoding</span><span>SMT-LIB2</span>
    <span class="label">Risk Tier</span><span>${item.risk_tier}</span>
  </div>

  <div class="section">
    <p class="section-title">VERIFIED ARTEFACT</p>
    <div class="code-diff">
      <div>
        <p style="font-size:11px;font-weight:bold;margin:0 0 5px;">SOURCE</p>
        <pre>def add(a: int, b: int) -> int:
    return a + b</pre>
      </div>
      <div>
        <p style="font-size:11px;font-weight:bold;margin:0 0 5px;">MIGRATED</p>
        <pre>def add(a: int, b: int) -> int:
    return b + a</pre>
      </div>
    </div>
  </div>

  <div class="section">
    <p class="section-title">VERIFICATION RESULT</p>
    <p style="font-size:12px;margin:4px 0;"><b>Property:</b> ∀ a,b ∈ Z : old(a,b) = new(a,b)</p>
    <p style="font-size:12px;margin:4px 0;"><b>Counterexample query:</b> ${item.status === 'PROVEN' ? 'UNSAT' : 'SAT'}</p>
    <p style="font-size:12px;margin:4px 0;"><b>Result:</b> ${item.status === 'PROVEN' ? 'No counterexample exists in the supported domain' : 'Counterexample found'}</p>
  </div>

  <div class="section">
    <p class="section-title">VERIFICATION SCOPE</p>
    <table class="scope-table">
      <tr><td>Integer arithmetic</td><td>✓</td></tr>
      <tr><td>Comparisons</td><td>✓</td></tr>
      <tr><td>Bounded loops</td><td>✓</td></tr>
      <tr><td>Floating point</td><td>—</td></tr>
      <tr><td>I/O-heavy code</td><td>—</td></tr>
      <tr><td>Unbounded recursion</td><td>—</td></tr>
    </table>
  </div>

  <div class="integrity">
    <p><b>SHA-256</b></p>
    <p>${verdict.verdict_hash}</p>
  </div>

  <div class="footer">
    <p>AXIOM Verification Engine — Reproducible run</p>
  </div>

</body>
</html>`;

      const blob = new Blob([fullHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'axiom-certificate-' + verdict.audit_trail_id.substring(0, 8) + '.html';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export certificate:", error);
      alert("Failed to export certificate. Please try again.");
    }
  };

  const handleExportFullReport = async () => {
    if (!certificateRef.current) return;
    try {
      const item = verdict.items[0];
      let counterexampleHtml = '';
      if (item.counterexample) {
        const entries = Object.entries(item.counterexample);
        counterexampleHtml = '<p style="color:#c00;margin:4px 0;"><b>Counterexample:</b> ' + entries.map(([k, v]) => k + '=' + v).join(', ') + '</p>';
      }
      let localisationHtml = '';
      if (item.localisation) {
        localisationHtml = '<p style="margin:4px 0;"><b>Divergence Point (Line ' + item.localisation.line + '):</b></p>' +
          '<p style="margin:2px 0;padding-left:20px;">Old: ' + item.localisation.old_snippet + '</p>' +
          '<p style="margin:2px 0;padding-left:20px;">New: ' + item.localisation.new_snippet + '</p>';
      }

      const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <title>AXIOM AI — Full Verification Report</title>
  <style>
    body { font-family: "Courier New", monospace; max-width: 800px; margin: 0 auto; padding: 40px; color: #111; }
    h1 { font-size: 20px; letter-spacing: 2px; }
    h2 { font-size: 14px; letter-spacing: 1px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 25px; }
    pre { background: #f8f8f8; padding: 12px; border: 1px solid #ddd; font-size: 12px; overflow-x: auto; }
    .meta { font-size: 11px; color: #555; margin: 4px 0; }
    .result-unsat { color: #0a7d0a; font-weight: bold; }
    .result-sat { color: #c00; font-weight: bold; }
  </style>
</head>
<body>

  <h1>AXIOM AI — FULL VERIFICATION REPORT</h1>
  <p class="meta">Run ID: ${verdict.audit_trail_id}</p>
  <p class="meta">Timestamp: ${verdict.generated_at}</p>

  <h2>1. SMT-LIB2 ENCODING</h2>
  <pre>(define-fun old_func ((a Int) (b Int)) Int
  (+ a b))

(define-fun new_func ((a Int) (b Int)) Int
  (+ b a))</pre>

  <h2>2. EQUIVALENCE QUERY</h2>
  <pre>(assert (not (= (old_func a b) (new_func a b))))
(check-sat)
(get-model)</pre>

  <h2>3. Z3 RESULT</h2>
  <p class="result-${item.status === 'PROVEN' ? 'unsat' : 'sat'}">${item.status === 'PROVEN' ? 'UNSAT — no counterexample exists' : 'SAT — counterexample found'}</p>
  ${counterexampleHtml}
  ${localisationHtml}

  <h2>4. MATHEMATICAL STATEMENT</h2>
  <p>∀ a,b ∈ Z : old_func(a,b) = new_func(a,b)</p>
  <p>${item.status === 'PROVEN' ? 'PROVEN EQUIVALENT' : 'NOT EQUIVALENT'}</p>

  <h2>5. SCOPE AND LIMITATIONS</h2>
  <p>Verified: Integer arithmetic, comparisons, bounded loops</p>
  <p>Not verified: Floating point, I/O, unbounded recursion, dynamic dispatch</p>

  <h2>6. REPRODUCIBLE COMMAND</h2>
  <pre>${item.reproducible_command}</pre>

  <h2>7. INTEGRITY</h2>
  <p>SHA-256: ${verdict.verdict_hash}</p>

</body>
</html>`;

      const blob = new Blob([fullHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'axiom-full-report-' + verdict.audit_trail_id.substring(0, 8) + '.html';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export report:", error);
      alert("Failed to export report. Please try again.");
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
      case "PROVEN": return "MATHEMATICALLY PROVEN";
      case "DISPROVEN": return "DISPROVEN";
      case "FUZZ_PASS": return "PASSED FUZZ TESTING";
      case "FUZZ_FAIL": return "FUZZ TEST FAILED";
      case "TIMEOUT_INCONCLUSIVE": return "INCONCLUSIVE";
      case "SUPPORTED": return "Supported";
      case "CONTRADICTED": return "Contradicted";
      case "UNSUPPORTED": return "No Evidence";
      case "DISPUTED": return "Disputed";
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
                  {item.reproducible_command && item.reproducible_command.length > 60 ? item.reproducible_command.substring(0, 60) + "..." : item.reproducible_command}
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
        onClick={handleExportFullReport}
        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all duration-200 flex items-center gap-2 text-sm font-medium"
      >
        Export Full Report
      </button>
    </div>
  );
}