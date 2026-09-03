# AXIOM AI

The Universal Verification Oracle — Proof for Code, Grounding for Claims, One Verdict.

Built for Microsoft Innovation Club, VIT Chennai | 3–4 September 2026 | Problem Statement 1

**Team:** Shreyas (Leader) · Jayanth · Alvira

---

## What It Does

AXIOM AI verifies two types of AI-generated artefacts:

1. **Code Equivalence** (Engine A): Proves whether translated/migrated code behaves identically to the original, using Z3 Theorem Prover for formal proof and property-based fuzzing as fallback.

2. **Claim Grounding** (Engine B): Checks whether factual claims are supported by source documents, with explicit entailment checking, source authority scoring, and dispute surfacing.

Both engines produce a **Verdict Certificate** — a reproducible audit trail with a tamper-evident hash.

---

## Tech Stack

- **Backend:** Python, FastAPI, Z3, Hypothesis
- **LLM:** Groq (openai/gpt-oss-20b) via OpenAI-compatible client
- **Frontend:** Next.js, Tailwind CSS (in axiom-frontend/)
- **PDF Export:** ReportLab

---

## Quick Start

### Backend

```bash
python3 -m venv venv
source venv/bin/activate
pip install z3-solver hypothesis fastapi uvicorn python-dotenv openai sentence-transformers reportlab
cp .env.example .env
# Add your Groq API key to .env
uvicorn backend.main:app --reload --port 8000
```

### Frontend

```bash
cd axiom-frontend
npm install
npm run dev
```

---

## API Endpoints

| Endpoint | Method | Request Body | Response |
|---|---|---|---|
| /verify-code | POST | {old_code, new_code} | Verdict (code) |
| /verify-claims | POST | {claims_or_text, sources} | Verdict (claim_set) |
| /status/{id} | GET | — | Stored verdict |

---

## Demo Cases

All demo cases are in demo_cases/:

- code_clean_pair.json — PROVEN equivalence
- code_buggy_pair.json — DISPROVEN -> LLM repair -> PROVEN
- claims_supported.json — SUPPORTED claim
- claims_contradicted.json — CONTRADICTED claim
- claims_disputed_sources.json — DISPUTED with conflicting sources

---

## Model Arena

Run `python benchmark/model_arena.py` to see LLM provider comparison.

Current result: Groq (openai/gpt-oss-20b) repairs buggy code in 1 attempt, 0.05s.
