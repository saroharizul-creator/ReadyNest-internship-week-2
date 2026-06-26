"use client";

import { SlidersHorizontal } from "lucide-react";

interface FiltersPanelProps {
  filterOptions: {
    regions: string[];
    types: string[];
    categories: string[];
    minDate: string;
    maxDate: string;
  };
  selectedRegions: string[];
  setSelectedRegions: (val: string[]) => void;
  selectedTypes: string[];
  setSelectedTypes: (val: string[]) => void;
  selectedCategories: string[];
  setSelectedCategories: (val: string[]) => void;
  selectedSegments: string[];
  setSelectedSegments: (val: string[]) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  onApply: () => void;
}

export default function FiltersPanel({
  filterOptions,
  selectedRegions,
  setSelectedRegions,
  selectedTypes,
  setSelectedTypes,
  selectedCategories,
  setSelectedCategories,
  selectedSegments,
  setSelectedSegments,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onApply,
}: FiltersPanelProps) {
  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      <div className="flex items-center gap-2 text-teal-400 font-semibold text-sm pb-2 border-b border-slate-800">
        <SlidersHorizontal className="w-4 h-4" /> Global Filter Console
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Regions */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Regions</label>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {filterOptions.regions.map((reg) => (
              <label key={reg} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs cursor-pointer transition ${
                selectedRegions.includes(reg) ? "bg-teal-500/10 border-teal-500/50 text-teal-400" : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}>
                <input
                  type="checkbox"
                  checked={selectedRegions.includes(reg)}
                  onChange={() => toggleItem(selectedRegions, setSelectedRegions, reg)}
                  className="hidden"
                />
                <span>{reg}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Customer Segments */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Segments</label>
          <div className="flex flex-wrap gap-1.5">
            {["High Value", "Medium Value", "Low Value"].map((seg) => (
              <label key={seg} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs cursor-pointer transition ${
                selectedSegments.includes(seg) ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-400" : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}>
                <input
                  type="checkbox"
                  checked={selectedSegments.includes(seg)}
                  onChange={() => toggleItem(selectedSegments, setSelectedSegments, seg)}
                  className="hidden"
                />
                <span>{seg}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Product Categories */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Product Categories</label>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {filterOptions.categories.map((cat) => (
              <label key={cat} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs cursor-pointer transition ${
                selectedCategories.includes(cat) ? "bg-teal-500/10 border-teal-500/50 text-teal-400" : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}>
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat)}
                  onChange={() => toggleItem(selectedCategories, setSelectedCategories, cat)}
                  className="hidden"
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Customer Types */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Types</label>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {filterOptions.types.map((t) => (
              <label key={t} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs cursor-pointer transition ${
                selectedTypes.includes(t) ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-400" : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}>
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(t)}
                  onChange={() => toggleItem(selectedTypes, setSelectedTypes, t)}
                  className="hidden"
                />
                <span>{t}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Date Pickers */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Invoice Timeframe</label>
          <div className="flex flex-col gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={() => {
            setSelectedRegions([]);
            setSelectedTypes([]);
            setSelectedCategories([]);
            setSelectedSegments([]);
            setStartDate("");
            setEndDate("");
          }}
          className="px-4 py-2 border border-slate-800 hover:border-slate-700 rounded-lg text-xs text-slate-400 hover:text-white transition"
        >
          Reset Options
        </button>
        <button
          onClick={onApply}
          className="bg-teal-500 hover:bg-teal-600 active:bg-teal-700 transition text-slate-950 font-semibold px-6 py-2 rounded-lg text-xs"
        >
          Activate Filter Settings
        </button>
      </div>
    </div>
  );
}

