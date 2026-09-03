// src/components/ClaimsInput/index.tsx
"use client";

import { useState } from "react";

interface ClaimsInputProps {
  onVerify: (claimsText: string, sources: Array<{ name: string; text: string; doc_type: string; published_date: string }>) => void;
  isLoading: boolean;
}

export default function ClaimsInput({ onVerify, isLoading }: ClaimsInputProps) {
  const [claimsText, setClaimsText] = useState(
    "AI systems should be transparent about their limitations. All AI systems are required to be open-source."
  );
  const [sourceName, setSourceName] = useState("EU AI Act - Article 13");
  const [sourceText, setSourceText] = useState(
    "Article 13: AI systems shall be designed and developed in such a way that their operation is sufficiently transparent to enable users to interpret the system's output and use it appropriately."
  );
  const [docType, setDocType] = useState("statutory");
  const [publishedDate, setPublishedDate] = useState("2024-03-15");
  const [sources, setSources] = useState<Array<{ name: string; text: string; doc_type: string; published_date: string }>>([]);

  const handleAddSource = () => {
    if (sourceName.trim() && sourceText.trim()) {
      setSources([
        ...sources,
        {
          name: sourceName.trim(),
          text: sourceText.trim(),
          doc_type: docType,
          published_date: publishedDate || new Date().toISOString().split('T')[0]
        }
      ]);
      setSourceName("");
      setSourceText("");
      setDocType("statutory");
      setPublishedDate("");
    }
  };

  const handleRemoveSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (claimsText.trim() && sources.length > 0) {
      onVerify(claimsText, sources);
    }
  };

  // Get doc type color
  const getDocTypeColor = (type: string) => {
    switch (type) {
      case "statutory": return "bg-green-100 text-green-800";
      case "vendor": return "bg-blue-100 text-blue-800";
      case "unattributed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Claims text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Claims or Text to Verify
        </label>
        <textarea
          value={claimsText}
          onChange={(e) => setClaimsText(e.target.value)}
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder="Paste text containing factual claims to verify..."
        />
      </div>

      {/* Add source section */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <p className="text-sm font-medium text-gray-700 mb-3">Add a Source Document</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            placeholder="Source name (e.g., EU AI Act)"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="statutory">📜 Statutory (1.0)</option>
            <option value="vendor">🏢 Vendor Docs (0.6)</option>
            <option value="unattributed">🌐 Unattributed Web (0.2)</option>
          </select>
        </div>

        <div className="mt-3">
          <input
            type="date"
            value={publishedDate}
            onChange={(e) => setPublishedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Published date"
          />
        </div>

        <div className="mt-3">
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Paste the source text here..."
          />
        </div>

        <button
          type="button"
          onClick={handleAddSource}
          disabled={!sourceName.trim() || !sourceText.trim()}
          className={`
            mt-3 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
            ${!sourceName.trim() || !sourceText.trim()
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          + Add Source
        </button>
      </div>

      {/* Sources list */}
      {sources.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Sources ({sources.length}):
          </p>
          <div className="space-y-2">
            {sources.map((source, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-white border rounded-md text-sm"
              >
                <div className="flex-1">
                  <span className="font-medium">{source.name}</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getDocTypeColor(source.doc_type)}`}>
                    {source.doc_type}
                  </span>
                  <p className="text-gray-500 text-xs truncate mt-0.5">{source.text.substring(0, 100)}...</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSource(index)}
                  className="ml-2 text-red-600 hover:text-red-800 text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !claimsText.trim() || sources.length === 0}
        className={`
          w-full py-3 rounded-lg font-medium transition-all duration-200
          ${isLoading || !claimsText.trim() || sources.length === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }
        `}
      >
        {isLoading ? 'Verifying...' : '🔍 Verify Claims'}
      </button>
    </form>
  );
}