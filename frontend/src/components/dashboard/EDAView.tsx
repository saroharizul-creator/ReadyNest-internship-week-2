"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";
import { FileSpreadsheet, Percent, AlertTriangle, ShieldCheck } from "lucide-react";

interface EDAViewProps {
  edaData: any;
  isLoading: boolean;
}

export default function EDAView({ edaData, isLoading }: EDAViewProps) {
  const [selectedHistCol, setSelectedHistCol] = useState("sales_amount");

  if (isLoading || !edaData) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-slate-400 text-xs animate-pulse">Running Exploratory Data Analysis (EDA) Profiler...</span>
      </div>
    );
  }

  const { overview = {}, stats_summary = {}, histograms = {}, boxplots = {}, correlation = {}, pairwise = [], category_frequencies = {}, outliers_report = {} } = edaData;

  // Format bytes helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Overview Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Dimensions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Dataset Scale</span>
            <h3 className="text-xl font-bold text-white mt-1">
              {(overview.row_count || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">rows</span>
            </h3>
            <span className="text-[10px] text-slate-500 mt-1 block">
              {overview.column_count || 0} unique database fields
            </span>
          </div>
          <div className="w-10 h-10 bg-teal-950 text-teal-400 rounded-lg flex items-center justify-center border border-teal-900">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>

        {/* File Size */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">RAM Footprint</span>
            <h3 className="text-xl font-bold text-white mt-1">
              {formatBytes(overview.dataset_size_bytes || 0)}
            </h3>
            <span className="text-[10px] text-slate-500 mt-1 block">Memory usage on server</span>
          </div>
          <div className="w-10 h-10 bg-indigo-950 text-indigo-400 rounded-lg flex items-center justify-center border border-indigo-900">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        {/* Quality Score */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Data Quality Rating</span>
            <h3 className="text-xl font-bold text-teal-400 mt-1">
              {overview.quality_score || 95}%
            </h3>
            <span className="text-[10px] text-slate-500 mt-1 block">Calculated from missing & schema rules</span>
          </div>
          <div className="w-10 h-10 bg-teal-950 text-teal-400 rounded-lg flex items-center justify-center border border-teal-900">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Duplicate check */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Duplicate Rows</span>
            <h3 className="text-xl font-bold text-white mt-1">
              {overview.duplicate_count || 0}
            </h3>
            <span className="text-[10px] text-slate-500 mt-1 block">Identical rows dropped</span>
          </div>
          <div className="w-10 h-10 bg-amber-950 text-amber-400 rounded-lg flex items-center justify-center border border-amber-900">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Statistical Summary Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h4 className="text-sm font-semibold text-white mb-4">Numeric Columns Statistical Descriptions</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3">Column Name</th>
                <th className="pb-3 text-right">Mean</th>
                <th className="pb-3 text-right">Median</th>
                <th className="pb-3 text-right">Mode</th>
                <th className="pb-3 text-right">Std Dev</th>
                <th className="pb-3 text-right">Min</th>
                <th className="pb-3 text-right">Max</th>
                <th className="pb-3 text-right">25% (Q1)</th>
                <th className="pb-3 text-right">75% (Q3)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {Object.keys(stats_summary).map((col) => {
                const s = stats_summary[col];
                return (
                  <tr key={col} className="hover:bg-slate-800/10 transition">
                    <td className="py-3 font-semibold text-white">{col}</td>
                    <td className="py-3 text-right">{s.mean.toFixed(2)}</td>
                    <td className="py-3 text-right">{s.median.toFixed(2)}</td>
                    <td className="py-3 text-right">{s.mode.toFixed(2)}</td>
                    <td className="py-3 text-right">{s.std_dev.toFixed(2)}</td>
                    <td className="py-3 text-right">{s.min.toFixed(2)}</td>
                    <td className="py-3 text-right">{s.max.toFixed(2)}</td>
                    <td className="py-3 text-right">{s.q25.toFixed(2)}</td>
                    <td className="py-3 text-right">{s.q75.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Histograms & Frequency Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Histograms */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-white">Dynamic Column Distribution Histograms</h4>
            <select
              value={selectedHistCol}
              onChange={(e) => setSelectedHistCol(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded text-xs px-2.5 py-1 text-teal-400 focus:outline-none focus:border-teal-500"
            >
              <option value="sales_amount">Sales Amount</option>
              <option value="profit">Operating Profit</option>
              <option value="quantity">Units Quantity</option>
            </select>
          </div>
          
          <div className="h-64">
            {!histograms[selectedHistCol] ? (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">Histogram data unavailable.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histograms[selectedHistCol]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="bin_start" tickFormatter={(v) => v.toFixed(0)} stroke="#64748b" style={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" style={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", fontSize: "11px" }} />
                  <Bar dataKey="count" name="Frequency Count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Categorical Frequencies */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="text-sm font-semibold text-white">Product Category Frequency share</h4>
          <div className="h-64">
            {!category_frequencies["product_category"] ? (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">Category frequency unavailable.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={category_frequencies["product_category"]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" stroke="#64748b" style={{ fontSize: 9 }} />
                  <YAxis stroke="#64748b" style={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", fontSize: "11px" }} />
                  <Bar dataKey="value" name="Order count" fill="#818cf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Correlation Grid and Pairwise Scatter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heatmap Grid */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="text-sm font-semibold text-white">Feature Correlation Heatmap Grid</h4>
          {correlation.columns ? (
            <div className="flex flex-col space-y-1">
              {/* Header row */}
              <div className="grid grid-cols-5 gap-1 text-center font-bold text-[10px] text-slate-400 mb-1">
                <div />
                {correlation.columns.map((c: string) => (
                  <div key={c} className="truncate">{c}</div>
                ))}
              </div>
              
              {/* Data rows */}
              {correlation.columns.map((col: string, rowIndex: number) => (
                <div key={col} className="grid grid-cols-5 gap-1 items-center">
                  <div className="text-[10px] font-bold text-slate-400 truncate pr-1 text-right">{col}</div>
                  {correlation.data[rowIndex].map((val: number, colIndex: number) => {
                    // Map val (-1 to 1) to red/blue HSL color intensity
                    const absVal = Math.abs(val);
                    const backgroundColor = val >= 0 ? `rgba(20, 184, 166, ${absVal})` : `rgba(239, 68, 68, ${absVal})`;
                    return (
                      <div
                        key={colIndex}
                        title={`Correlation between ${col} and ${correlation.columns[colIndex]}: ${val.toFixed(3)}`}
                        style={{ backgroundColor }}
                        className="h-10 rounded border border-slate-950 flex items-center justify-center text-xs font-semibold text-white shadow-inner font-mono"
                      >
                        {val.toFixed(2)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-500 text-xs py-12">Correlation data unavailable.</div>
          )}
        </div>

        {/* Pairwise Scatter */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="text-sm font-semibold text-white">Pairwise Relationships (Revenue vs. Operating Profit)</h4>
          <div className="h-64">
            {pairwise.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">No pairwise coordinate data.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <CartesianGrid stroke="#e2e8f0" />
                  <XAxis type="number" dataKey="sales_amount" name="Revenue ($)" unit="$" stroke="#64748b" style={{ fontSize: 9 }} />
                  <YAxis type="number" dataKey="profit" name="Profit ($)" unit="$" stroke="#64748b" style={{ fontSize: 9 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", fontSize: "11px" }} />
                  <Scatter name="Transactions" data={pairwise} fill="#14b8a6" />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Outlier Detection List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h4 className="text-sm font-semibold text-white mb-4">Outlier Detection Report (Standard IQR rules)</h4>
        {outliers_report.list?.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-8">No outliers detected in numeric distributions.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3">Customer Name</th>
                  <th className="pb-3">Invoice Order ID</th>
                  <th className="pb-3">Metric Type</th>
                  <th className="pb-3 text-right">Outlier Value</th>
                  <th className="pb-3 text-right">Net Sales</th>
                  <th className="pb-3 text-right">Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {outliers_report.list?.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-800/10 transition">
                    <td className="py-2.5 font-medium">{row.customer_name}</td>
                    <td className="py-2.5 font-mono text-indigo-400">{row.order_id}</td>
                    <td className="py-2.5 font-semibold text-teal-400 uppercase tracking-wider">{row.column_name}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-white">${row.value.toFixed(2)}</td>
                    <td className="py-2.5 text-right">${row.sales_amount.toFixed(2)}</td>
                    <td className="py-2.5 text-right text-slate-400">${row.profit.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

