// src/components/IntegrationInput/index.tsx
"use client";

import { useState } from "react";

interface IntegrationInputProps {
  onVerify: (repoUrl: string, targetFunction: string, newCode: string) => void;
  isLoading: boolean;
}

export default function IntegrationInput({ onVerify, isLoading }: IntegrationInputProps) {
  const [repoUrl, setRepoUrl] = useState("https://github.com/psf/requests");
  const [targetFunction, setTargetFunction] = useState("request");
  const [newCode, setNewCode] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setNewCode(content);
      setFileName(file.name);
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoUrl.trim() && targetFunction.trim() && newCode.trim()) {
      onVerify(repoUrl, targetFunction, newCode);
    }
  };

  // Quick test presets
  const setTestRequest = () => {
    setRepoUrl("https://github.com/psf/requests");
    setTargetFunction("request");
    setNewCode("def request(method, url, **kwargs):\n    # Modified version\n    return _request(method, url, **kwargs)");
    setFileName("");
  };

  const setAxiomTest = () => {
    setRepoUrl("https://github.com/ShreyasPatil3105/axiom-ai.git");
    setTargetFunction("verify_code");
    setNewCode("def verify_code(old_code, new_code):\n    # Modified version\n    return old_code == new_code");
    setFileName("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Quick test buttons */}
      <div className="flex flex-wrap gap-2 mb-2">
        <button
          type="button"
          onClick={setTestRequest}
          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
        >
          Test: requests repo
        </button>
        <button
          type="button"
          onClick={setAxiomTest}
          className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
        >
          Test: axiom-ai repo
        </button>
      </div>

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
          Target Function (function name)
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
          The function you're migrating/updating. Use the simple function name (e.g. verify_code)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          New Function Code
        </label>
        
        {/* File Upload Option */}
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">
            Upload File (.py)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".py,.txt"
              onChange={handleFileUpload}
              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {fileName && <span className="text-sm text-green-600">{fileName}</span>}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Upload a .py file with your new function code. Or paste below.
          </p>
        </div>

        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <span>— OR —</span>
        </div>

        <textarea
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
          className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm mt-3"
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
        {isLoading ? 'Scanning Repository...' : 'Verify Integration'}
      </button>
    </form>
  );
}