'use client';

import { useState } from 'react';

const FLAG_URL = 'chrome://flags/#enable-draft-webgl-extensions';

export default function WebGLFallback() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(FLAG_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the input text
      const input = document.querySelector<HTMLInputElement>('#flag-url-input');
      input?.select();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="max-w-md w-full rounded-2xl border border-white/10 bg-[#13131a]/90 backdrop-blur-xl shadow-2xl shadow-purple-500/10 p-8">
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-white/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-purple-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25"
              />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-xl font-bold text-white text-center mb-2">
          Action Required: Enable Graphics Boost
        </h2>
        <p className="text-white/50 text-sm text-center mb-6">
          Our high-fidelity 3D dice require a specific browser flag to render correctly.
        </p>

        {/* Steps */}
        <ol className="space-y-4 mb-6">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-sm font-bold text-purple-400">
              1
            </span>
            <div>
              <p className="text-white/80 text-sm font-medium">Copy this address into your browser</p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  id="flag-url-input"
                  type="text"
                  readOnly
                  value={FLAG_URL}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-purple-300 select-all focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={handleCopy}
                  className="flex-shrink-0 px-3 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-medium transition-all"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </li>

          <li className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-sm font-bold text-purple-400">
              2
            </span>
            <p className="text-white/80 text-sm font-medium">
              Set the flag to <span className="text-purple-300 font-mono">&quot;Enabled&quot;</span>
            </p>
          </li>

          <li className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-sm font-bold text-purple-400">
              3
            </span>
            <p className="text-white/80 text-sm font-medium">
              Click <span className="text-purple-300 font-mono">&quot;Relaunch&quot;</span> at the bottom of the Chrome flags page
            </p>
          </li>
        </ol>

        {/* Refresh button */}
        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
        >
          Refresh Page
        </button>

        <p className="text-white/30 text-[11px] text-center mt-4">
          This only takes about 30 seconds. Once enabled, your dice will load automatically.
        </p>
      </div>
    </div>
  );
}
