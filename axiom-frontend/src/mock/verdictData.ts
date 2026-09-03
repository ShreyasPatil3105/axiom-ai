// src/mock/verdictData.ts
// This matches the schema from Section 3.1 exactly

// Type definitions (matching the Python schema)
export interface CodeItem {
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

export interface ClaimItem {
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

export interface Verdict {
  audit_trail_id: string;
  artefact_type: "code" | "claim_set";
  overall_trust_score: number;
  items: (CodeItem | ClaimItem)[];
  generated_at: string;
  verdict_hash: string;
}

// ============================================================
// MOCK DATA: Code Artefact (Engine A)
// Includes: PROVEN, DISPROVEN, FUZZ_PASS, FUZZ_FAIL, TIMEOUT
// ============================================================

export const mockCodeVerdict: Verdict = {
  audit_trail_id: "audit-code-001",
  artefact_type: "code",
  overall_trust_score: 62,
  generated_at: "2026-09-03T14:30:00Z",
  verdict_hash: "7a8f9e3c2d1b4a5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7",

  items: [
    // 1. PROVEN — Mathematically verified
    {
      id: "c1",
      status: "PROVEN",
      risk_tier: "GREEN",
      localisation: null,
      counterexample: null,
      repair_attempts: 0,
      reproducible_command: "python verify.py --case c1"
    },

    // 2. DISPROVEN — Found a bug
    {
      id: "c2",
      status: "DISPROVEN",
      risk_tier: "GREEN",
      localisation: {
        line: 3,
        old_snippet: "return principal * (1 + rate) ** years",
        new_snippet: "return principal * (1 + rate) * years"
      },
      counterexample: {
        x: 1000,
        y: 0.05,
        old_output: 1102.5,
        new_output: 1050
      },
      repair_attempts: 2,
      reproducible_command: "python verify.py --case c2"
    },

    // 3. FUZZ_PASS — Not provable, but passed fuzzing
    {
      id: "c3",
      status: "FUZZ_PASS",
      risk_tier: "RED",
      localisation: null,
      counterexample: null,
      repair_attempts: 0,
      reproducible_command: "python verify.py --case c3"
    },

    // 4. FUZZ_FAIL — Not provable, failed fuzzing
    {
      id: "c4",
      status: "FUZZ_FAIL",
      risk_tier: "RED",
      localisation: {
        line: 7,
        old_snippet: "return data.strip()",
        new_snippet: "return data"
      },
      counterexample: {
        x: 0,
        y: 0,
        old_output: 0,
        new_output: 0
      },
      repair_attempts: 0,
      reproducible_command: "python verify.py --case c4"
    },

    // 5. TIMEOUT_INCONCLUSIVE — Z3 hung
    {
      id: "c5",
      status: "TIMEOUT_INCONCLUSIVE",
      risk_tier: "YELLOW",
      localisation: null,
      counterexample: null,
      repair_attempts: 0,
      reproducible_command: "python verify.py --case c5"
    }
  ]
};

// ============================================================
// MOCK DATA: Claim Artefact (Engine B)
// Includes: SUPPORTED, CONTRADICTED, UNSUPPORTED, DISPUTED
// ============================================================

export const mockClaimVerdict: Verdict = {
  audit_trail_id: "audit-claim-001",
  artefact_type: "claim_set",
  overall_trust_score: 70,
  generated_at: "2026-09-03T14:35:00Z",
  verdict_hash: "b9c8d7e6f5g4h3i2j1k0l9m8n7o6p5q4r3s2t1u0v9w8x7y6z5a4b3c2d1",

  items: [
    // 1. SUPPORTED — Clear evidence
    {
      id: "cl1",
      claim_text: "AI systems should be transparent about their limitations.",
      status: "SUPPORTED",
      cited_passage: "Article 13: AI systems shall be designed and developed in such a way that their operation is sufficiently transparent to enable users to interpret the system's output and use it appropriately.",
      exact_span: "transparent to enable users to interpret the system's output",
      source_name: "EU AI Act - Article 13",
      authority_score: 1.0,
      freshness_decay: 0.95,
      conflicting_sources: null,
      confidence: 0.89,
      reproducible_command: "python verify_claims.py --case cl1"
    },

    // 2. CONTRADICTED — Source contradicts the claim
    {
      id: "cl2",
      claim_text: "All AI systems are required to be open-source.",
      status: "CONTRADICTED",
      cited_passage: "Article 14: While transparency is encouraged, open-source requirements apply only to high-risk AI systems as defined in Annex III.",
      exact_span: "open-source requirements apply only to high-risk AI systems",
      source_name: "EU AI Act - Article 14",
      authority_score: 1.0,
      freshness_decay: 0.95,
      conflicting_sources: null,
      confidence: 0.92,
      reproducible_command: "python verify_claims.py --case cl2"
    },

    // 3. UNSUPPORTED — Source says nothing relevant
    {
      id: "cl3",
      claim_text: "AI systems must be audited annually by an independent third party.",
      status: "UNSUPPORTED",
      cited_passage: "Article 15: Member States shall ensure the establishment of national competent authorities for AI oversight.",
      exact_span: null,
      source_name: "EU AI Act - Article 15",
      authority_score: 1.0,
      freshness_decay: 0.95,
      conflicting_sources: null,
      confidence: 0.34,
      reproducible_command: "python verify_claims.py --case cl3"
    },

    // 4. DISPUTED — Two sources disagree
    {
      id: "cl4",
      claim_text: "AI transparency requirements apply equally to all AI systems.",
      status: "DISPUTED",
      cited_passage: null,
      exact_span: null,
      source_name: null,
      authority_score: null,
      freshness_decay: null,
      conflicting_sources: [
        {
          name: "EU AI Act - Article 13",
          passage: "All AI systems shall ensure transparency in their operation, regardless of risk level.",
          authority_score: 1.0
        },
        {
          name: "Industry Position Paper - 2025",
          passage: "Transparency requirements should be proportional to risk; low-risk systems require minimal disclosure.",
          authority_score: 0.6
        }
      ],
      confidence: 0.78,
      reproducible_command: "python verify_claims.py --case cl4"
    }
  ]
};

// Export both for easy access
export const mockData = {
  code: mockCodeVerdict,
  claims: mockClaimVerdict
};