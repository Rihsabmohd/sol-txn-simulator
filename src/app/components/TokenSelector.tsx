"use client";

import { useState, useEffect } from "react";

interface Token {
  address: string;
  symbol: string;
  name: string;
  logoURI?: string;
  decimals: number;
}

interface TokenSelectorProps {
  label: string;
  selectedToken: Token | null;
  onSelect: (token: Token) => void;
}

export default function TokenSelector({
  label,
  selectedToken,
  onSelect,
}: TokenSelectorProps) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTokens() {
      try {
        setIsLoading(true);
        const res = await fetch("https://cache.jup.ag/tokens", {
          headers: { "Accept": "application/json" },
        });
        if (!res.ok) {
          console.error("Failed to fetch tokens:", res.statusText);
          return;
        }
        const data = await res.json();
        setTokens(data);
        setFilteredTokens(data.slice(0, 20)); // show 20 by default
      } catch (err) {
        console.error("Error fetching tokens:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTokens();
  }, []);

  // Search functionality
  useEffect(() => {
    if (search.trim() === "") {
      setFilteredTokens(tokens.slice(0, 20));
    } else {
      const results = tokens.filter(
        (token) =>
          token.symbol.toLowerCase().includes(search.toLowerCase()) ||
          token.name.toLowerCase().includes(search.toLowerCase()) ||
          token.address.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredTokens(results.slice(0, 50)); // Limit results
    }
  }, [search, tokens]);

  return (
    <div className="relative flex-1">
      <label className="block text-green-500/60 text-xs font-mono mb-2 tracking-wide">
        {label}
      </label>

      {/* Selected Token Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-green-950/20 border border-green-500/30 text-green-400 p-3 rounded font-mono focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 flex items-center justify-between hover:bg-green-950/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {selectedToken?.logoURI && (
            <img
              src={selectedToken.logoURI}
              alt={selectedToken.symbol}
              className="w-5 h-5 rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <span className="font-bold">
            {selectedToken ? selectedToken.symbol : "Select token"}
          </span>
          {selectedToken && (
            <span className="text-green-500/60 text-xs truncate max-w-[100px]">
              {selectedToken.name}
            </span>
          )}
        </div>
        <span className="text-green-500/60">{isOpen ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black border border-green-500/30 rounded-lg shadow-[0_0_30px_rgba(34,197,94,0.2)] z-50 max-h-96 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-green-500/20 sticky top-0 bg-black z-10">
            <input
              type="text"
              placeholder="Search by name, symbol, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-green-950/20 border border-green-500/30 text-green-400 px-3 py-2 rounded font-mono text-sm focus:outline-none focus:border-green-500 placeholder:text-green-500/40"
              autoFocus
            />
            {!isLoading && tokens.length > 0 && (
              <div className="text-green-500/60 text-xs font-mono mt-1">
                {filteredTokens.length} token{filteredTokens.length !== 1 ? "s" : ""} found
              </div>
            )}
          </div>

          {/* Token List */}
          <div className="overflow-y-auto max-h-80 custom-scrollbar">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-green-500/60 text-sm font-mono mt-2">
                  Loading tokens...
                </div>
              </div>
            ) : filteredTokens.length > 0 ? (
              filteredTokens.map((token) => (
                <button
                  key={token.address}
                  onClick={() => {
                    onSelect(token);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className="w-full px-3 py-2 hover:bg-green-950/30 transition-colors flex items-center gap-3 text-left border-b border-green-500/10 last:border-0"
                >
                  <div className="flex-shrink-0">
                    {token.logoURI ? (
                      <img
                        src={token.logoURI}
                        alt={token.symbol}
                        className="w-8 h-8 rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs font-bold">
                        {token.symbol.slice(0, 2)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-mono font-bold text-green-400 text-sm">
                      {token.symbol}
                    </div>
                    <div className="font-mono text-green-500/60 text-xs truncate">
                      {token.name}
                    </div>
                  </div>

                  {selectedToken?.address === token.address && (
                    <span className="text-green-400 flex-shrink-0">✓</span>
                  )}
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-green-500/60 text-sm font-mono">
                No tokens found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            setSearch("");
          }}
        />
      )}
    </div>
  );
}