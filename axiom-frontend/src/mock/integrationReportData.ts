// src/mock/integrationReportData.ts

export interface CallSiteCheck {
  id: string;
  file_path: string;
  line_number: number;
  call_expression: string;
  status: "COMPATIBLE" | "SIGNATURE_MISMATCH" | "SIDE_EFFECT_CHANGED" | "UNRESOLVED_DYNAMIC";
  detail: string;
  reproducible_command: string;
}

export interface IntegrationReport {
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
}

// ============================================================
// MOCK DATA: Integration Report
// Includes all 4 statuses: COMPATIBLE, SIGNATURE_MISMATCH,
// SIDE_EFFECT_CHANGED, UNRESOLVED_DYNAMIC
// ============================================================

export const mockIntegrationReport: IntegrationReport = {
  audit_trail_id: "integration-audit-001",
  repo_url: "https://github.com/example/calculator-app",
  repo_commit_sha: "a1b2c3d4e5f67890abcdef1234567890abcdef12",
  target_function: "calculator.calculate_interest",
  total_files_indexed: 42,
  indexing_time_seconds: 3.47,
  total_call_sites_found: 8,
  unresolved_dynamic_count: 1,
  codebase_integration_score: 85.7,

  call_site_checks: [
    // 1. COMPATIBLE — works fine
    {
      id: "call_1",
      file_path: "src/loan/amortization.py",
      line_number: 47,
      call_expression: "calculate_interest(principal=10000, rate=0.05, years=5)",
      status: "COMPATIBLE",
      detail: "All arguments match the new signature. Function call is fully compatible.",
      reproducible_command: "python verify_integration.py --call call_1"
    },

    // 2. COMPATIBLE — works fine
    {
      id: "call_2",
      file_path: "src/savings/compound.py",
      line_number: 23,
      call_expression: "calculate_interest(principal, rate, years)",
      status: "COMPATIBLE",
      detail: "Positional arguments match new signature in order.",
      reproducible_command: "python verify_integration.py --call call_2"
    },

    // 3. SIGNATURE_MISMATCH — arguments don't match
    {
      id: "call_3",
      file_path: "src/deposits/fixed.py",
      line_number: 112,
      call_expression: "calculate_interest(principal=10000, rate=0.05)",
      status: "SIGNATURE_MISMATCH",
      detail: "Missing required argument 'years'. New signature requires 3 arguments (principal, rate, years).",
      reproducible_command: "python verify_integration.py --call call_3"
    },

    // 4. SIGNATURE_MISMATCH — wrong argument order
    {
      id: "call_4",
      file_path: "src/investment/bonds.py",
      line_number: 56,
      call_expression: "calculate_interest(years=5, rate=0.05, principal=10000)",
      status: "SIGNATURE_MISMATCH",
      detail: "Argument order mismatch. New signature expects (principal, rate, years) but received (years, rate, principal).",
      reproducible_command: "python verify_integration.py --call call_4"
    },

    // 5. SIDE_EFFECT_CHANGED — function now writes to a file
    {
      id: "call_5",
      file_path: "src/reports/annual.py",
      line_number: 89,
      call_expression: "calculate_interest(principal, rate, years)",
      status: "SIDE_EFFECT_CHANGED",
      detail: "New function writes to disk (creates a log file) which the old function did not. This may affect dependent workflows.",
      reproducible_command: "python verify_integration.py --call call_5"
    },

    // 6. COMPATIBLE — works fine
    {
      id: "call_6",
      file_path: "src/portfolio/calculator.py",
      line_number: 34,
      call_expression: "calculate_interest(10000, 0.05, 5)",
      status: "COMPATIBLE",
      detail: "All arguments match the new signature. Function call is fully compatible.",
      reproducible_command: "python verify_integration.py --call call_6"
    },

    // 7. COMPATIBLE — works fine
    {
      id: "call_7",
      file_path: "src/banking/interest.py",
      line_number: 78,
      call_expression: "calc = calculate_interest(principal=5000, rate=0.03, years=10)",
      status: "COMPATIBLE",
      detail: "All arguments match the new signature. Function call is fully compatible.",
      reproducible_command: "python verify_integration.py --call call_7"
    },

    // 8. UNRESOLVED_DYNAMIC — can't statically resolve
    {
      id: "call_8",
      file_path: "src/legacy/dynamic.py",
      line_number: 156,
      call_expression: "getattr(calculator_module, 'calculate_interest')(principal, rate, years)",
      status: "UNRESOLVED_DYNAMIC",
      detail: "Dynamic dispatch via getattr() — cannot statically verify this call. Manual review required.",
      reproducible_command: "python verify_integration.py --call call_8"
    }
  ]
};

// Export for easy access
export default mockIntegrationReport;