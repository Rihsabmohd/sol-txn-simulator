"use client";

import { useState, useEffect } from "react";

interface Token {
  address: string;
  symbol: string;
  name: string;
  logoURI?: string;
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

  useEffect(() => {
    async function fetchTokens() {
      try {
        const res = await fetch("https://cache.jup.ag/tokens", {
          headers: { "Accept": "application/json" },
        });
        if (!res.ok) {
          console.error("Failed to fetch tokens:", res.statusText);
          return;
        }
        const data = await res.json();
        setTokens(data);
        setFilteredTokens(data.slice(0, 10)); // show 20 by default
      } catch (err) {
        console.error("Error fetching tokens:", err);
      }
    }
    fetchTokens();
  }, []);
  

  // Search functionality
  useEffect(() => {
    const results = tokens.filter((token) =>
      token.symbol.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredTokens(results.slice(0, 50)); // Limit results
  }, [search, tokens]);

  return (
    <div className="relative inline-block text-left w-48">
      <label className="block mb-1 text-sm text-gray-400">{label}</label>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-gray-800 text-white p-2 rounded-lg border border-gray-700 hover:border-green-400 transition"
      >
        <div className="flex items-center space-x-2">
          {selectedToken?.logoURI && (
            <img
              src={selectedToken.logoURI}
              alt={selectedToken.symbol}
              className="w-5 h-5"
            />
          )}
          <span>{selectedToken ? selectedToken.symbol : "Select Token"}</span>
        </div>
        <span>▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-72 overflow-y-auto">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 bg-gray-800 text-white border-b border-gray-700 focus:outline-none"
          />
          {filteredTokens.map((token) => (
            <button
              key={token.address}
              onClick={() => {
                onSelect(token);
                setIsOpen(false);
              }}
              className="flex items-center space-x-2 w-full p-2 hover:bg-gray-800 text-left"
            >
              {token.logoURI && (
                <img
                  src={token.logoURI}
                  alt={token.symbol}
                  className="w-5 h-5"
                />
              )}
              <span>{token.symbol}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
