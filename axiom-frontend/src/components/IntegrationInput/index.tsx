// src/components/IntegrationInput/index.tsx
"use client";

import { useState } from "react";

interface IntegrationInputProps {
  onVerify: (repoUrl: string, targetFunction: string, newCode: string) => void;
  isLoading: boolean;
}

export default function IntegrationInput({ onVerify, isLoading }: IntegrationInputProps) {
  const [repoUrl, setRepoUrl] = useState("https://github.com/psf/requests");
  const [targetFunction, setTargetFunction] = useState("requests.api.request");
  const [newCode, setNewCode] = useState(
    "def request(method, url, **kwargs):\n    # Modified version\n    return _request(method, url, **kwargs)"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoUrl.trim() && targetFunction.trim() && newCode.trim()) {
      onVerify(repoUrl, targetFunction, newCode);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          GitHub Repository URL
        </label>
        <input
          type="url"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
          placeholder="https://github.com/username/repo"
          required
        />
        <p className="text-xs text-gray-400 mt-1">
          Public repository URL. Private repos require PAT (coming soon).
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Target Function (module.function_name)
        </label>
        <input
          type="text"
          value={targetFunction}
          onChange={(e) => setTargetFunction(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
          placeholder="calculator.calculate_interest"
          required
        />
        <p className="text-xs text-gray-400 mt-1">
          The function you're migrating/updating.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          New Function Code
        </label>
        <textarea
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
          className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder="def calculate_interest(principal, rate, years):\n    return principal * (1 + rate) * years"
          required
          spellCheck={false}
        />
        <p className="text-xs text-gray-400 mt-1">
          The new version of the function with your changes.
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading || !repoUrl.trim() || !targetFunction.trim() || !newCode.trim()}
        className={`
          w-full py-3 rounded-lg font-medium transition-all duration-200
          ${isLoading || !repoUrl.trim() || !targetFunction.trim() || !newCode.trim()
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }
        `}
      >
        {isLoading ? '🔍 Scanning Repository...' : '🔗 Verify Integration'}
      </button>
    </form>
  );
}