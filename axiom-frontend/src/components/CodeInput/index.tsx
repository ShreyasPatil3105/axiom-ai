// src/components/CodeInput/index.tsx
"use client";

import { useState } from "react";

interface CodeInputProps {
  onVerify: (oldCode: string, newCode: string) => void;
  isLoading: boolean;
}

export default function CodeInput({ onVerify, isLoading }: CodeInputProps) {
  // Updated with type annotations for Z3 compatibility
  const [oldCode, setOldCode] = useState(
    "def add(a: int, b: int) -> int:\n    return a + b"
  );
  const [newCode, setNewCode] = useState(
    "def add(a: int, b: int) -> int:\n    return b + a"  // Clean pair - should PROVE
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (oldCode.trim() && newCode.trim()) {
      onVerify(oldCode, newCode);
    }
  };

  // Quick test presets for demo
  const setCleanPair = () => {
    setOldCode("def add(a: int, b: int) -> int:\n    return a + b");
    setNewCode("def add(a: int, b: int) -> int:\n    return b + a");
  };

  const setBuggyPair = () => {
    setOldCode("def add(a: int, b: int) -> int:\n    return a + b");
    setNewCode("def add(a: int, b: int) -> int:\n    return a - b");
    // Auto-trigger verification after a short delay
    setTimeout(() => {
      const form = document.querySelector("form");
      if (form) form.requestSubmit();
    }, 300);
  };

  const setInterestPair = () => {
    setOldCode("def calculate_interest(principal: float, rate: float, years: int) -> float:\n    return principal * (1 + rate) ** years");
    setNewCode("def calculate_interest(principal: float, rate: float, years: int) -> float:\n    return principal * (1 + rate) * years");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Quick test buttons */}
      <div className="flex flex-wrap gap-2 mb-2">
        <button
          type="button"
          onClick={setCleanPair}
          className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
        >
          Clean Pair (should PROVE)
        </button>
        <button
          type="button"
          onClick={setBuggyPair}
          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
        >
          Buggy Pair (should DISPROVE)
        </button>
        <button
          type="button"
          onClick={setInterestPair}
          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
        >
          Interest Calculator (buggy)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Old Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Old Code (Original)
          </label>
          <textarea
            value={oldCode}
            onChange={(e) => setOldCode(e.target.value)}
            className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="Paste the original code here..."
            spellCheck={false}
          />
        </div>

        {/* New Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Code (Migrated)
          </label>
          <textarea
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="Paste the migrated code here..."
            spellCheck={false}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !oldCode.trim() || !newCode.trim()}
        className={`
          w-full py-3 rounded-lg font-medium transition-all duration-200
          ${isLoading || !oldCode.trim() || !newCode.trim()
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }
        `}
      >
        {isLoading ? 'Verifying...' : 'Verify Code Equivalence'}
      </button>
    </form>
  );
}