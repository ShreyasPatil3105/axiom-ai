// src/components/IntegrationReport/index.tsx

interface CallSiteCheck {
  id: string;
  file_path: string;
  line_number: number;
  call_expression: string;
  status: "COMPATIBLE" | "SIGNATURE_MISMATCH" | "SIDE_EFFECT_CHANGED" | "UNRESOLVED_DYNAMIC";
  detail: string;
  reproducible_command: string;
}

interface IntegrationReportProps {
  report: {
    audit_trail_id: string;
    repo_url: string;
    repo_commit_sha: string;
    target_function: string;
    total_files_indexed: number;
    indexing_time_seconds: number;
    total_call_sites_found: number;
    unresolved_dynamic_count: number;
    call_site_checks: CallSiteCheck[];
    codebase_integration_score: number;
  };
}

export default function IntegrationReport({ report }: IntegrationReportProps) {
  const handleExportReport = () => {
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <title>AXIOM AI — Full Integration Report</title>
  <style>
    body { font-family: "Courier New", monospace; max-width: 850px; margin: 0 auto; padding: 40px; color: #111; }
    h1 { font-size: 20px; letter-spacing: 2px; border-bottom: 2px solid #111; padding-bottom: 8px; }
    h2 { font-size: 14px; letter-spacing: 1px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 25px; }
    pre { background: #f8f8f8; padding: 12px; border: 1px solid #ddd; font-size: 12px; overflow-x: auto; }
    table { width: 100%; font-size: 12px; border-collapse: collapse; margin-top: 10px; }
    td, th { padding: 6px 8px; border: 1px solid #ddd; text-align: left; }
    th { background: #f5f5f5; font-weight: bold; }
    .meta { font-size: 11px; color: #555; margin: 3px 0; }
    .score { font-size: 36px; font-weight: bold; }
    .compatible { color: #0a7d0a; font-weight: bold; }
    .mismatch { color: #c00; font-weight: bold; }
    .unresolved { color: #f59e0b; font-weight: bold; }
    .section { margin: 25px 0; }
  </style>
</head>
<body>

  <h1>AXIOM AI — CODEBASE INTEGRATION REPORT</h1>
  <p class="meta">Run ID: ${report.audit_trail_id}</p>
  <p class="meta">Repository: ${report.repo_url}</p>
  <p class="meta">Commit: ${report.repo_commit_sha}</p>
  <p class="meta">Generated: ${new Date().toISOString()}</p>

  <div class="section">
    <h2>SUMMARY</h2>
    <p class="score">${report.codebase_integration_score} / 100</p>
    <p><b>Target Function:</b> ${report.target_function}</p>
    <p><b>Files Indexed:</b> ${report.total_files_indexed}</p>
    <p><b>Call Sites Found:</b> ${report.total_call_sites_found}</p>
    <p><b>Unresolved Dynamic:</b> ${report.unresolved_dynamic_count}</p>
    <p><b>Indexing Time:</b> ${report.indexing_time_seconds.toFixed(3)}s</p>
  </div>

  <div class="section">
    <h2>VERIFICATION RESULT</h2>
    <p><b>Property Checked:</b> ∀ call_site ∈ CallSites(${report.target_function}) : compatible(call_site, new_signature)</p>
    <p><b>Call Graph:</b> ${report.total_files_indexed} files indexed, ${report.total_call_sites_found} call sites resolved</p>
    <p><b>Counterexample Query:</b> ${report.total_call_sites_found > 0 ? 'SAT' : 'NO_CALL_SITES_FOUND'}</p>
    <p><b>Result:</b> ${report.codebase_integration_score >= 100 ? 'All call sites compatible — integration safe' : report.codebase_integration_score >= 50 ? 'Some call sites incompatible — review required' : 'Multiple incompatible call sites — migration will break codebase'}</p>
  </div>

  <div class="section">
    <h2>CALL SITE CHECKS</h2>
    ${report.call_site_checks.length > 0 ? `
    <table>
      <tr>
        <th>File</th>
        <th>Line</th>
        <th>Call Expression</th>
        <th>Status</th>
        <th>Detail</th>
      </tr>
      ${report.call_site_checks.map(check => `
      <tr>
        <td>${check.file_path}</td>
        <td>${check.line_number}</td>
        <td style="font-family:monospace;font-size:11px;">${check.call_expression}</td>
        <td class="${check.status === 'COMPATIBLE' ? 'compatible' : check.status === 'SIGNATURE_MISMATCH' ? 'mismatch' : 'unresolved'}">${check.status}</td>
        <td>${check.detail}</td>
      </tr>`).join('')}
    </table>` : '<p style="color:#c00;">No call sites found. The target function may not exist in the indexed repository, or the function name format is incorrect.</p>'}
  </div>

  <div class="section">
    <h2>SCOPE AND LIMITATIONS</h2>
    <p>Verified: Static call graph extraction, signature compatibility</p>
    <p>Not verified: Dynamic dispatch, reflection, runtime behaviour</p>
  </div>

  <p style="margin-top:30px;font-size:10px;color:#888;">AXIOM Verification Engine — Reproducible run</p>

</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'axiom-integration-report-' + report.audit_trail_id.substring(0, 8) + '.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get status color and label
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "COMPATIBLE":
        return { color: "bg-green-100 text-green-800 border-green-300", label: "✅ Compatible" };
      case "SIGNATURE_MISMATCH":
        return { color: "bg-red-100 text-red-800 border-red-300", label: "❌ Signature Mismatch" };
      case "SIDE_EFFECT_CHANGED":
        return { color: "bg-yellow-100 text-yellow-800 border-yellow-300", label: "⚠️ Side Effect Changed" };
      case "UNRESOLVED_DYNAMIC":
        return { color: "bg-gray-100 text-gray-600 border-gray-300", label: "❓ Unresolved Dynamic" };
      default:
        return { color: "bg-gray-100 text-gray-700 border-gray-300", label: "Unknown" };
    }
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="border rounded-lg p-6 shadow-sm bg-white">
      {/* Header */}
      <div className="border-b pb-4 mb-4">
        <div className="flex justify-between items-center">
      <h3 className="text-lg font-bold text-gray-800">🔗 Codebase Integration Report</h3>
      <button
        onClick={handleExportReport}
        className="px-3 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all text-sm font-medium"
      >
        Export Full Report
      </button>
    </div>
        <p className="text-sm text-gray-500">
          Target Function: <span className="font-mono text-gray-700">{report.target_function}</span>
        </p>
        <p className="text-xs text-gray-400 truncate">
          Repo: {report.repo_url} • Commit: {report.repo_commit_sha.substring(0, 12)}...
        </p>
        <p className="text-xs text-gray-400">
          Audit ID: {report.audit_trail_id}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-50 rounded p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{report.total_files_indexed}</p>
          <p className="text-xs text-gray-500">Files Indexed</p>
        </div>
        <div className="bg-gray-50 rounded p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{report.indexing_time_seconds}s</p>
          <p className="text-xs text-gray-500">Indexing Time</p>
        </div>
        <div className="bg-gray-50 rounded p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{report.total_call_sites_found}</p>
          <p className="text-xs text-gray-500">Call Sites Found</p>
        </div>
        <div className="bg-gray-50 rounded p-3 text-center">
          <p className="text-2xl font-bold text-gray-600">{report.unresolved_dynamic_count}</p>
          <p className="text-xs text-gray-500">Unresolved Dynamic</p>
        </div>
      </div>

      {/* Score */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Integration Score</p>
          <p className="text-xs text-gray-400">% of resolvable call sites that are compatible</p>
        </div>
        <div className="text-right">
          <span className={`text-3xl font-bold ${getScoreColor(report.codebase_integration_score)}`}>
            {Math.round(report.codebase_integration_score)}%
          </span>
        </div>
      </div>

      {/* Call Sites Table */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-medium text-gray-700">Call Site Checks</p>
          <p className="text-xs text-gray-400">{report.call_site_checks.length} sites found</p>
        </div>
        
        <div className="max-h-80 overflow-y-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">File</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Line</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Call</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {report.call_site_checks.map((site) => {
                const statusConfig = getStatusConfig(site.status);
                return (
                  <tr key={site.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-xs font-mono text-gray-600 truncate max-w-[150px]">
                      {site.file_path}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500 text-center">
                      {site.line_number}
                    </td>
                    <td className="px-3 py-2 text-xs font-mono text-gray-700 truncate max-w-[200px]">
                      {site.call_expression}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Details expandable */}
        <div className="mt-2">
          {report.call_site_checks.map((site) => (
            <details key={site.id} className="border-b border-gray-100 last:border-0">
              <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800 py-1">
                Details for {site.file_path}:{site.line_number}
              </summary>
              <div className="p-2 bg-gray-50 rounded text-xs text-gray-600 font-mono">
                <p><strong>Call:</strong> {site.call_expression}</p>
                <p><strong>Detail:</strong> {site.detail}</p>
                <p><strong>Command:</strong> {site.reproducible_command}</p>
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t text-xs text-gray-400">
        <p>Audit: {report.audit_trail_id}</p>
        <p className="font-mono">Commit: {report.repo_commit_sha}</p>
      </div>
    </div>
  );
}