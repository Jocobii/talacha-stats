"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown, Check, Search } from "lucide-react";
import { MEXICO_CITIES } from "@/shared/lib/cities";

type Props = { activeCity: string };

export default function CitySwitcher({ activeCity }: Props) {
  const [open,    setOpen]    = useState(false);
  const [query,   setQuery]   = useState("");
  const container = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (container.current && !container.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim()
    ? MEXICO_CITIES.filter((c) => c.toLowerCase().includes(query.toLowerCase()))
    : MEXICO_CITIES;

  async function selectCity(city: string) {
    if (city === activeCity) { setOpen(false); return; }
    const res  = await fetch("/api/auth/city", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ city }),
    });
    if (res.ok) {
      window.location.reload();
    }
  }

  return (
    <div ref={container} className="relative">
      <button
        onClick={() => { setOpen((v) => !v); setQuery(""); }}
        className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <MapPin size={13} strokeWidth={2.5} />
        <span>{activeCity}</span>
        <ChevronDown size={13} strokeWidth={2.5} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-60 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-700">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar ciudad…"
                className="w-full bg-gray-800 text-white text-sm placeholder-gray-500 rounded-lg pl-7 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          {/* List */}
          <ul
            role="listbox"
            aria-label="Seleccionar ciudad"
            className="max-h-64 overflow-y-auto py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500 text-center">Sin resultados</li>
            ) : (
              filtered.map((city) => (
                <li key={city} role="option" aria-selected={city === activeCity}>
                  <button
                    onClick={() => selectCity(city)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition
                      ${city === activeCity
                        ? "bg-green-900/50 text-green-400"
                        : "text-gray-200 hover:bg-gray-800"}`}
                  >
                    {city}
                    {city === activeCity && <Check size={13} strokeWidth={2.5} />}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
