// app/page.tsx
"use client";

import { useState } from "react";
import TrustRing from "@/src/components/TrustRing";
import CodeDiff from "@/src/components/CodeDiff";
import ClaimCard from "@/src/components/ClaimCard";
import TabButton from "@/src/components/TabButton";
import CodeInput from "@/src/components/CodeInput";
import ClaimsInput from "@/src/components/ClaimsInput";
import CertificateExport from "@/src/components/CertificateExport";
import IntegrationReport from "@/src/components/IntegrationReport";
import { verifyCode, verifyClaims } from "@/src/services/api";
import { mockCodeVerdict, mockClaimVerdict } from "@/src/mock/verdictData";
import mockIntegrationReport from "@/src/mock/integrationReportData";

// Type for verdict items
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

interface Verdict {
  audit_trail_id: string;
  artefact_type: "code" | "claim_set";
  overall_trust_score: number;
  items: (CodeItem | ClaimItem)[];
  generated_at: string;
  verdict_hash: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"code" | "claims" | "integration">("code");
  const [isLoading, setIsLoading] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Code pairs for the diff
  const codePairs: Record<string, { old: string; new: string }> = {
    "c1": {
      old: "def calculate_interest(principal, rate, years):\n    return principal * (1 + rate) ** years",
      new: "def calculate_interest(principal, rate, years):\n    return principal * (1 + rate) ** years"
    },
    "c2": {
      old: "def calculate_interest(principal, rate, years):\n    return principal * (1 + rate) ** years",
      new: "def calculate_interest(principal, rate, years):\n    return principal * (1 + rate) * years"
    },
    "c3": {
      old: "def process_data(data):\n    return data.strip()",
      new: "def process_data(data):\n    return data.strip()"
    },
    "c4": {
      old: "def process_data(data):\n    return data.strip()",
      new: "def process_data(data):\n    return data"
    },
    "c5": {
      old: "def complex_logic(x):\n    if x > 0:\n        return x * 2\n    return x",
      new: "def complex_logic(x):\n    if x > 0:\n        return x * 2\n    return x"
    }
  };

  // Handle Code Verification
  const handleCodeVerify = async (oldCode: string, newCode: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await verifyCode(oldCode, newCode);
      setVerdict(result);
    } catch (err) {
      console.error("Code verification failed:", err);
      setError(err instanceof Error ? err.message : "Failed to verify code. Is the backend running?");
      setVerdict({
        ...mockCodeVerdict,
        generated_at: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Claims Verification
  const handleClaimsVerify = async (
    claimsText: string,
    sources: Array<{ name: string; text: string; doc_type: string; published_date: string }>
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await verifyClaims(claimsText, sources);
      setVerdict(result);
    } catch (err) {
      console.error("Claims verification failed:", err);
      setError(err instanceof Error ? err.message : "Failed to verify claims. Is the backend running?");
      setVerdict({
        ...mockClaimVerdict,
        generated_at: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentVerdict = verdict || (activeTab === "code" ? mockCodeVerdict : mockClaimVerdict);
  const isCodeVerdict = currentVerdict.artefact_type === "code";
  const items = currentVerdict.items;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <h1 className="text-3xl font-bold text-center">
            <span className="text-blue-600">AXIOM</span> AI
          </h1>
          <p className="text-center text-gray-500 text-sm mt-1">
            Universal Verification Oracle
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-6">
        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <TabButton
            active={activeTab === "code"}
            onClick={() => {
              setActiveTab("code");
              setError(null);
            }}
            label="Code Verification"
            icon="🖥️"
          />
          <TabButton
            active={activeTab === "claims"}
            onClick={() => {
              setActiveTab("claims");
              setError(null);
            }}
            label="Claim Grounding"
            icon="📄"
          />
          <TabButton
            active={activeTab === "integration"}
            onClick={() => {
              setActiveTab("integration");
              setError(null);
            }}
            label="Integration Report"
            icon="🔗"
          />
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <p className="font-medium">⚠️ {error}</p>
            <p className="text-xs mt-1 text-red-500">Using mock data as fallback.</p>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === "code" && (
          <>
            <div className="mb-8 bg-white rounded-lg shadow-sm p-6 border">
              <CodeInput onVerify={handleCodeVerify} isLoading={isLoading} />
            </div>

            {currentVerdict && (
              <>
                <div className="text-center mb-6">
                  <p className="text-xs text-gray-400">Audit: {currentVerdict.audit_trail_id}</p>
                </div>
                <div className="flex flex-col items-center mb-8">
                  <TrustRing score={currentVerdict.overall_trust_score} />
                  <div className="mt-4">
                    <CertificateExport verdict={currentVerdict} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {items.map((item) => {
                    if (!('risk_tier' in item)) return null;
                    const pair = codePairs[item.id] || {
                      old: "// No code available",
                      new: "// No code available"
                    };
                    return (
                      <CodeDiff key={item.id} item={item} oldCode={pair.old} newCode={pair.new} />
                    );
                  })}
                </div>
                <div className="mt-8 text-center text-xs text-gray-400 border-t pt-4">
                  <p className="font-mono">Verdict Hash: {currentVerdict.verdict_hash}</p>
                  <p className="mt-1">Generated: {currentVerdict.generated_at}</p>
                  <p className="mt-1 text-gray-300">This certificate is tamper-evident — any change produces a different hash</p>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === "claims" && (
          <>
            <div className="mb-8 bg-white rounded-lg shadow-sm p-6 border">
              <ClaimsInput onVerify={handleClaimsVerify} isLoading={isLoading} />
            </div>

            {currentVerdict && (
              <>
                <div className="text-center mb-6">
                  <p className="text-xs text-gray-400">Audit: {currentVerdict.audit_trail_id}</p>
                </div>
                <div className="flex flex-col items-center mb-8">
                  <TrustRing score={currentVerdict.overall_trust_score} />
                  <div className="mt-4">
                    <CertificateExport verdict={currentVerdict} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {items.map((item) => {
                    if (!('claim_text' in item)) return null;
                    return <ClaimCard key={item.id} claim={item} />;
                  })}
                </div>
                <div className="mt-8 text-center text-xs text-gray-400 border-t pt-4">
                  <p className="font-mono">Verdict Hash: {currentVerdict.verdict_hash}</p>
                  <p className="mt-1">Generated: {currentVerdict.generated_at}</p>
                  <p className="mt-1 text-gray-300">This certificate is tamper-evident — any change produces a different hash</p>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === "integration" && (
          <div>
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
              <p className="font-medium">🔗 Codebase Integration</p>
              <p className="text-xs mt-1 text-blue-600">
                Shows how a migrated function integrates with the entire codebase — 
                every call site, checked for compatibility.
              </p>
            </div>
            <IntegrationReport report={mockIntegrationReport} />
          </div>
        )}
      </div>
    </main>
  );
}