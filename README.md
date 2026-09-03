# AXIOM AI

The Universal Verification Oracle — Proof for Code, Grounding for Claims, One Verdict.

Built for Microsoft Innovation Club, VIT Chennai | 3–4 September 2026 | Problem Statement 1

**Team:** Shreyas (Leader) · Jayanth · Alvira

---

## What It Does

AXIOM AI verifies three types of AI-generated artefacts:

1. **Code Equivalence** (Engine A): Proves whether translated/migrated code behaves identically to the original, using Z3 Theorem Prover for formal proof and property-based fuzzing as fallback. Counterexample Replay Animation shows divergence in real time.

2. **Claim Grounding** (Engine B): Checks whether factual claims are supported by source documents, with explicit entailment checking, source authority scoring, and dispute surfacing. Supports .txt and .docx file uploads as sources.

3. **Codebase Integration** (Engine A2): Given a repo URL, local path, or ZIP file, indexes the entire codebase statically, finds every call site for a target function, and checks signature compatibility deterministically — no LLM for discovery.

All engines produce a **Verdict Certificate** — a reproducible audit trail with a tamper-evident SHA-256 hash.

---

## Tech Stack

- **Backend:** Python, FastAPI, Z3, Hypothesis, GitPython
- **LLM:** DeepSeek, Groq, OpenRouter (automatic fallback chain)
- **Frontend:** Next.js 16, Tailwind CSS 4, TypeScript (in axiom-frontend/)
- **PDF Export:** ReportLab

---

## Quick Start

### Backend

```bash
python3 -m venv venv
source venv/bin/activate
pip install z3-solver hypothesis fastapi uvicorn python-dotenv openai sentence-transformers reportlab GitPython
cp .env.example .env
# Add your API keys to .env
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
| /verify-integration | POST | {repo_path or repo_url, target_function, new_function_code} | IntegrationReport |
| /verify-zip | POST | {zip_path, target_function, new_function_code} | IntegrationReport |
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

Run `python benchmark/model_arena.py` to compare LLM providers on the repair task.

Current results:
| Provider | Success | Time |
|---|---|---|
| DeepSeek | ✅ | 1.58s |
| Groq | ✅ | 1.14s |
| OpenRouter | ✅ | 1.06s |
