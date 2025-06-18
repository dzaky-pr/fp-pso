"use client";

import { useEffect, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { MdOutlineKeyboardCommandKey } from "react-icons/md";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.altKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const input = document.getElementById("search-input");
        input?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="relative w-full max-w-md">
      {/* Search Icon */}
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />

      {/* Input */}
      <input
        id="search-input"
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search by title or author..."
        className="w-full pl-10 pr-20 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300 transition-all"
      />

      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-md">
        <MdOutlineKeyboardCommandKey className="text-base" />
        <span>K</span>
        <span className="mx-1 text-gray-300 dark:text-gray-600">/</span>
        <span className="font-mono text-sm">Alt</span>
        <span>K</span>
      </div>
    </div>
  );
}
