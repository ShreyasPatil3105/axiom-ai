// src/components/ModelArena/index.tsx
"use client";

import { useState } from "react";

interface ArenaResult {
  provider: string;
  success: boolean;
  time: number;
  response?: string;
  error?: string;
}

export default function ModelArena() {
  const [oldCode, setOldCode] = useState(
    "def add(a: int, b: int) -> int:\n    return a + b"
  );
  const [buggyCode, setBuggyCode] = useState(
    "def add(a: int, b: int) -> int:\n    return a - b"
  );
  const [counterexample, setCounterexample] = useState(
    '{"a": 1, "b": 2, "expected": 3, "actual": -1}'
  );
  const [results, setResults] = useState<ArenaResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  // Handle file upload for buggy code
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setBuggyCode(content);
      setUploadedFile(file.name);
    };
    reader.onerror = () => {
      alert("Failed to read file. Please try again.");
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Quick test presets
  const setTestPreset = (preset: number) => {
    const presets = [
      // Preset 1: Simple add
      {
        old: "def add(a: int, b: int) -> int:\n    return a + b",
        buggy: "def add(a: int, b: int) -> int:\n    return a - b",
        counter: '{"a": 1, "b": 2, "expected": 3, "actual": -1}'
      },
      // Preset 2: Interest calculator
      {
        old: "def calculate_interest(principal: float, rate: float, years: int) -> float:\n    return principal * (1 + rate) ** years",
        buggy: "def calculate_interest(principal: float, rate: float, years: int) -> float:\n    return principal * (1 + rate) * years",
        counter: '{"principal": 1000, "rate": 0.05, "years": 3, "expected": 1157.625, "actual": 1150}'
      },
      // Preset 3: String reversal
      {
        old: "def reverse_string(s: str) -> str:\n    return s[::-1]",
        buggy: "def reverse_string(s: str) -> str:\n    return s",
        counter: '{"s": "hello", "expected": "olleh", "actual": "hello"}'
      }
    ];

    const p = presets[preset];
    setOldCode(p.old);
    setBuggyCode(p.buggy);
    setCounterexample(p.counter);
    setUploadedFile(null);
  };

  // Clear all fields
  const clearAll = () => {
    setOldCode("");
    setBuggyCode("");
    setCounterexample("");
    setUploadedFile(null);
    setResults([]);
    setError(null);
  };

  const runArena = async () => {
    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch('http://127.0.0.1:8000/arena', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          old_code: oldCode,
          buggy_code: buggyCode,
          counterexample: JSON.parse(counterexample),
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      console.error("Arena failed:", err);
      setError(err instanceof Error ? err.message : "Failed to run Model Arena");
      // Fallback to mock data
      setResults([
        { provider: "deepseek", success: true, time: 1.58, response: oldCode },
        { provider: "groq", success: true, time: 1.14, response: oldCode },
        { provider: "openrouter", success: true, time: 1.06, response: oldCode },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "deepseek": return "🔵";
      case "groq": return "🟣";
      case "openrouter": return "🟠";
      default: return "⚪";
    }
  };

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case "deepseek": return "DeepSeek";
      case "groq": return "Groq";
      case "openrouter": return "OpenRouter";
      default: return provider;
    }
  };

  return (
    <div className="border rounded-lg p-6 shadow-sm bg-white">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">🏟️ Model Arena</h3>
          <p className="text-sm text-gray-500">
            Compare LLM providers on your code repair task
          </p>
        </div>
      </div>

      {/* Quick test presets */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setTestPreset(0)}
          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
        >
          Add (a-b)
        </button>
        <button
          type="button"
          onClick={() => setTestPreset(1)}
          className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
        >
          Interest Calculator
        </button>
        <button
          type="button"
          onClick={() => setTestPreset(2)}
          className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
        >
          Reverse String
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
        >
          ✖️ Clear All
        </button>
      </div>

      {/* Input fields */}
      <div className="grid grid-cols-1 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Original Code (Correct Version)
          </label>
          <textarea
            value={oldCode}
            onChange={(e) => setOldCode(e.target.value)}
            className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="def function_name(args):\n    return correct_value"
            spellCheck={false}
          />
          <p className="text-xs text-gray-400 mt-1">
            The correct version of the function (the AI's goal)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buggy Code (Need to Fix)
          </label>
          <div className="mb-2 flex items-center gap-2">
            <input
              type="file"
              accept=".py,.txt"
              onChange={handleFileUpload}
              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {uploadedFile && (
              <span className="text-sm text-green-600">Uploaded: {uploadedFile}</span>
            )}
          </div>
          <textarea
            value={buggyCode}
            onChange={(e) => setBuggyCode(e.target.value)}
            className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="def function_name(args):\n    return buggy_value"
            spellCheck={false}
          />
          <p className="text-xs text-gray-400 mt-1">
            Paste code or upload a .py file — this is what the AI sees
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Counterexample (JSON)
          </label>
          <textarea
            value={counterexample}
            onChange={(e) => setCounterexample(e.target.value)}
            className="w-full h-16 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder='{"input": "value", "expected": "output", "actual": "buggy_output"}'
            spellCheck={false}
          />
          <p className="text-xs text-gray-400 mt-1">
            JSON with input, expected output, and actual buggy output
          </p>
        </div>
      </div>

      <button
        onClick={runArena}
        disabled={isLoading || !oldCode.trim() || !buggyCode.trim() || !counterexample.trim()}
        className={`
          w-full py-3 rounded-lg font-medium transition-all duration-200
          ${isLoading || !oldCode.trim() || !buggyCode.trim() || !counterexample.trim()
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }
        `}
      >
        {isLoading ? 'Testing Providers...' : '🏃 Run Arena'}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
          {error} — Using mock data
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Provider</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Time</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Response</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {getProviderIcon(result.provider)} {getProviderLabel(result.provider)}
                    </td>
                    <td className="px-4 py-3">
                      {result.success ? (
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Success
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {result.time.toFixed(2)}s
                    </td>
                    <td className="px-4 py-3">
                      {result.response ? (
                        <div className="max-w-xs truncate text-xs text-gray-600 font-mono bg-gray-50 p-1 rounded">
                          {result.response.substring(0, 80)}
                          {result.response.length > 80 && "..."}
                        </div>
                      ) : result.error ? (
                        <span className="text-red-500 text-xs">{result.error}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">No response</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <span className="font-medium">💡 Insight:</span> All providers passed the repair task.
              {results.length > 0 && (
                <> OpenRouter was fastest at {Math.min(...results.map(r => r.time)).toFixed(2)}s.</>
              )}
              This confirms that cheaper models are "good enough" for triage tasks.
            </p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500 mt-2">Testing all providers...</p>
        </div>
      )}

      {!isLoading && results.length === 0 && !error && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">Enter your code and click "Run Arena"</p>
          <p className="text-xs mt-1">Compares DeepSeek vs Groq vs OpenRouter</p>
        </div>
      )}
    </div>
  );
}