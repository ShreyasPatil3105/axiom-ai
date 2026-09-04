// src/components/ClaimsInput/index.tsx
"use client";

import { useState } from "react";

// Function to read file content
const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    // For .txt files
    if (file.name.endsWith('.txt')) {
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    }
    // For .docx files
    else if (file.name.endsWith('.docx')) {
      // We'll use mammoth for docx
      import('mammoth').then((mammoth) => {
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const result = await mammoth.extractRawText({ arrayBuffer });
            resolve(result.value);
          } catch (error) {
            reject(new Error('Failed to parse .docx file'));
          }
        };
        reader.readAsArrayBuffer(file);
      }).catch(() => {
        reject(new Error('Please install mammoth: npm install mammoth'));
      });
    }
    // For .pdf files
    else if (file.name.endsWith('.pdf')) {
      // For now, show a message
      reject(new Error('PDF support coming soon. Please use .txt or .docx files.'));
    }
    else {
      reject(new Error('Please upload .txt or .docx files only.'));
    }
  });
};

interface ClaimsInputProps {
  onVerify: (claimsText: string, sources: Array<{
    name: string;
    text: string;
    doc_type: string;
    published_date: string;
  }>) => void;
  isLoading: boolean;
}

export default function ClaimsInput({ onVerify, isLoading }: ClaimsInputProps) {
  const [claimsText, setClaimsText] = useState(
    "AI systems should be transparent about their limitations. All AI systems are required to be open-source."
  );
  const [sourceName, setSourceName] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [docType, setDocType] = useState("statutory");
  const [publishedDate, setPublishedDate] = useState("");
  const [sources, setSources] = useState<Array<{
    name: string;
    text: string;
    doc_type: string;
    published_date: string;
  }>>([]);
  const [uploading, setUploading] = useState(false);

  // Quick test presets
  const setSupportedClaim = () => {
    setClaimsText("AI systems shall be transparent in their operation.");
    setSources([
      {
        name: "EU AI Act - Article 13",
        text: "All AI systems shall ensure transparency in their operation, regardless of risk level.",
        doc_type: "statutory",
        published_date: "2024-03-15"
      }
    ]);
  };

  const setContradictedClaim = () => {
    setClaimsText("All AI systems are required to be open-source.");
    setSources([
      {
        name: "EU AI Act - Article 14",
        text: "Open-source requirements apply only to high-risk AI systems as defined in Annex III.",
        doc_type: "statutory",
        published_date: "2024-03-15"
      }
    ]);
  };

  const setDisputedClaim = () => {
    setClaimsText("AI transparency requirements apply equally to all AI systems.");
    setSources([
      {
        name: "EU AI Act - Article 13",
        text: "All AI systems shall ensure transparency in their operation, regardless of risk level.",
        doc_type: "statutory",
        published_date: "2024-03-15"
      },
      {
        name: "Industry Position Paper - 2025",
        text: "Transparency requirements should be proportional to risk; low-risk systems require minimal disclosure.",
        doc_type: "vendor",
        published_date: "2025-01-10"
      }
    ]);
  };

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const content = await readFileContent(file);
      setSourceText(content);
      // Auto-populate source name from filename
      setSourceName(file.name.replace(/\.[^.]+$/, '')); // Remove extension
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to read file');
    } finally {
      setUploading(false);
      event.target.value = ''; // Reset input
    }
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
      {/* Quick test buttons */}
      <div className="flex flex-wrap gap-2 mb-2">
        <button
          type="button"
          onClick={setSupportedClaim}
          className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
        >
          Supported Claim
        </button>
        <button
          type="button"
          onClick={setContradictedClaim}
          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
        >
          Contradicted Claim
        </button>
        <button
          type="button"
          onClick={setDisputedClaim}
          className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
        >
          Disputed Claim
        </button>
      </div>

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
        
        {/* File Upload */}
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">
            Upload File (.txt or .docx)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".txt,.docx"
              onChange={handleFileUpload}
              disabled={uploading}
              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {uploading && <span className="text-sm text-gray-500">Reading file...</span>}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Supports .txt and .docx files. PDF support coming soon.
          </p>
        </div>

        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <span>— OR —</span>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
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
  <option value="statutory">Official Law/Regulation</option>
  <option value="vendor">Company Documentation</option>
  <option value="unattributed">Random Internet Source</option>
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
            placeholder="Paste the source text here... or upload a file above"
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
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {sources.map((source, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-white border rounded-md text-sm"
              >
                <div className="flex-1 overflow-hidden">
                  <span className="font-medium">{source.name}</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getDocTypeColor(source.doc_type)}`}>
                    {source.doc_type}
                  </span>
                  <p className="text-gray-500 text-xs truncate mt-0.5">{source.text.substring(0, 100)}...</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSource(index)}
                  className="ml-2 text-red-600 hover:text-red-800 text-sm flex-shrink-0"
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
        {isLoading ? 'Verifying...' : 'Verify Claims'}
      </button>
    </form>
  );
}