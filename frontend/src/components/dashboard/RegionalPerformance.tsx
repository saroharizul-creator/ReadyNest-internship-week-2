"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { Globe, MapPin, DollarSign, Award, Target } from "lucide-react";

interface RegionalPerformanceProps {
  regionalData: any;
  isLoading: boolean;
}

const COLORS = ["#14b8a6", "#818cf8", "#f43f5e", "#fbbf24"];

export default function RegionalPerformance({ regionalData, isLoading }: RegionalPerformanceProps) {
  if (isLoading || !regionalData) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-slate-400 text-xs animate-pulse">Running Regional Performance Diagnostics...</span>
      </div>
    );
  }

  const { region_summary = [], top_region = {}, lowest_region = {}, growth_trends = [], insights = [] } = regionalData;

  // Resolve keys for trend line charts
  const regionsList = region_summary.map((r: any) => r.region);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Top Region */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Leading Territory</span>
            <h3 className="text-lg font-bold text-teal-400 mt-1 truncate max-w-[150px]">
              {top_region.region || "N/A"}
            </h3>
            <span className="text-[10px] text-slate-500 mt-1 block">
              ${(top_region.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="w-10 h-10 bg-teal-950 text-teal-400 rounded-lg flex items-center justify-center border border-teal-900">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Lowest Region */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Lowest Territory</span>
            <h3 className="text-lg font-bold text-red-400 mt-1 truncate max-w-[150px]">
              {lowest_region.region || "N/A"}
            </h3>
            <span className="text-[10px] text-slate-500 mt-1 block">
              ${(lowest_region.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="w-10 h-10 bg-red-950 text-red-450 rounded-lg flex items-center justify-center border border-red-900">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* Total Regions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Regions</span>
            <h3 className="text-xl font-bold text-white mt-1">
              {region_summary.length}
            </h3>
            <span className="text-[10px] text-slate-500 mt-1 block">Geographic divisions in database</span>
          </div>
          <div className="w-10 h-10 bg-indigo-950 text-indigo-400 rounded-lg flex items-center justify-center border border-indigo-900">
            <Globe className="w-5 h-5" />
          </div>
        </div>

        {/* Top Region Orders */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Top Region Orders</span>
            <h3 className="text-xl font-bold text-white mt-1">
              {(top_region.orders || 0).toLocaleString()}
            </h3>
            <span className="text-[10px] text-slate-500 mt-1 block">Invoiced order count</span>
          </div>
          <div className="w-10 h-10 bg-teal-950 text-teal-400 rounded-lg flex items-center justify-center border border-teal-900">
            <MapPin className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Regional Business Insights */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
          Geographical Business Analysis Findings
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((ins: string, idx: number) => (
            <div key={idx} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex gap-2.5 items-start">
              <span className="text-teal-400 text-sm font-bold">&bull;</span>
              <p className="text-xs text-slate-300 leading-relaxed">{ins}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Chart Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Ranking (Sales and Profit side-by-side) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="text-sm font-semibold text-white">Regional Financial Ranking (Revenue vs. Operating Profit)</h4>
          <div className="h-64">
            {region_summary.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">No records available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={region_summary}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="region" stroke="#64748b" style={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" style={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", fontSize: "11px" }} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="revenue" name="Sales Revenue ($)" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="Net Profit ($)" fill="#818cf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Growth Trends Line Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="text-sm font-semibold text-white">Regional Growth Trends over Time</h4>
          <div className="h-64">
            {growth_trends.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">No regional monthly trends available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growth_trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" style={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", fontSize: "11px" }} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  {regionsList.map((regName: string, index: number) => (
                    <Line
                      key={regName}
                      type="monotone"
                      dataKey={regName}
                      name={regName}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Complete Regional Summary Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h4 className="text-sm font-semibold text-white mb-4">Territory Sales & Profit Contribution Table</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3 pl-2">Region Name</th>
                <th className="pb-3 text-right">Invoiced Orders</th>
                <th className="pb-3 text-right">Units Sold</th>
                <th className="pb-3 text-right">Gross Sales ($)</th>
                <th className="pb-3 text-right">Gross Profit ($)</th>
                <th className="pb-3 text-right">Operating Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-305">
              {region_summary.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-slate-800/10 transition">
                  <td className="py-3 pl-2 font-medium text-white">{row.region}</td>
                  <td className="py-3 text-right font-mono">{row.orders.toLocaleString()}</td>
                  <td className="py-3 text-right font-mono">{row.quantity_sold.toLocaleString()}</td>
                  <td className="py-3 text-right font-mono">${row.revenue.toFixed(2)}</td>
                  <td className="py-3 text-right font-mono text-emerald-400">${row.profit.toFixed(2)}</td>
                  <td className="py-3 text-right font-mono font-semibold text-teal-400">{row.margin.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

