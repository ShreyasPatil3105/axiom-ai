// src/components/CodeInput/index.tsx
"use client";

import { useState } from "react";

interface CodeInputProps {
  onVerify: (oldCode: string, newCode: string) => void;
  isLoading: boolean;
}

export default function CodeInput({ onVerify, isLoading }: CodeInputProps) {
  const [oldCode, setOldCode] = useState(
    "def calculate_interest(principal, rate, years):\n    return principal * (1 + rate) ** years"
  );
  const [newCode, setNewCode] = useState(
    "def calculate_interest(principal, rate, years):\n    return principal * (1 + rate) * years"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (oldCode.trim() && newCode.trim()) {
      onVerify(oldCode, newCode);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        {isLoading ? 'Verifying...' : '🔍 Verify Code Equivalence'}
      </button>
    </form>
  );
}