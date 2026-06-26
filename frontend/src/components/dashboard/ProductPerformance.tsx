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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { CheckCircle, AlertTriangle, Lightbulb, BarChart3, TrendingUp, Layers } from "lucide-react";

interface ProductPerformanceProps {
  productData: any;
  isLoading: boolean;
}

const COLORS = ["#14b8a6", "#818cf8", "#f43f5e", "#fbbf24", "#a78bfa", "#f472b6"];

export default function ProductPerformance({ productData, isLoading }: ProductPerformanceProps) {
  if (isLoading || !productData) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-slate-400 text-xs animate-pulse">Running Product Performance Engine...</span>
      </div>
    );
  }

  const { top_selling = [], least_selling = [], category_analysis = [], product_trends = [], insights = { best_performing: [], underperforming: [], recommendations: [] } } = productData;

  // Formatting for Recharts line chart data
  // Product trends is a list of {month, Product1_name: revenue, Product2_name: revenue...}
  const productsList = top_selling.slice(0, 3).map((p: any) => p.product_name);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Visual Business Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Best performing */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <CheckCircle className="w-4 h-4 text-teal-400" /> Catalog Highlights
          </h4>
          <div className="space-y-2.5">
            {insights.best_performing.map((ins: string, idx: number) => (
              <div key={idx} className="flex gap-2 items-start text-xs text-slate-350 leading-relaxed">
                <span className="text-teal-400 font-bold">&bull;</span>
                <p>{ins}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Underperforming */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" /> Margin Leak Risks
          </h4>
          <div className="space-y-2.5">
            {insights.underperforming.map((ins: string, idx: number) => (
              <div key={idx} className="flex gap-2 items-start text-xs text-slate-350 leading-relaxed">
                <span className="text-red-400 font-bold">&bull;</span>
                <p>{ins}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Lightbulb className="w-4 h-4 text-amber-400" /> Product Recommendations
          </h4>
          <div className="space-y-2.5">
            {insights.recommendations.map((ins: string, idx: number) => (
              <div key={idx} className="flex gap-2 items-start text-xs text-slate-350 leading-relaxed">
                <span className="text-amber-400 font-bold">&bull;</span>
                <p>{ins}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Chart Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Product Rankings */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
            <BarChart3 className="w-4.5 h-4.5 text-teal-400" /> Top Selling Product Rankings by Sales ($)
          </h4>
          <div className="h-64">
            {top_selling.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">No records available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top_selling.slice(0, 5)} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" style={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="product_name" stroke="#64748b" style={{ fontSize: 9 }} width={100} />
                  <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", fontSize: "11px" }} />
                  <Bar dataKey="revenue" name="Sales ($)" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category breakdown (Pie Chart) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
            <Layers className="w-4.5 h-4.5 text-indigo-400" /> Category Contribution % Share
          </h4>
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="col-span-1 h-60 flex items-center justify-center">
              {category_analysis.length === 0 ? (
                <div className="text-slate-500 text-xs">No records.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={category_analysis}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="revenue"
                      nameKey="product_category"
                    >
                      {category_analysis.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Legend checklist */}
            <div className="col-span-1 space-y-2.5 text-xs">
              {category_analysis.map((entry: any, index: number) => (
                <div key={entry.product_category} className="flex items-center justify-between text-slate-350 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="font-medium truncate max-w-[120px]">{entry.product_category}</span>
                  </div>
                  <span className="font-mono text-white font-semibold">{entry.contribution_pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly trends lines of top 3 products */}
      {product_trends.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
            <TrendingUp className="w-4.5 h-4.5 text-teal-400" /> Leading Products Revenue Monthly Growth Trends
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={product_trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" style={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", fontSize: "11px" }} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                {productsList.map((pName: string, index: number) => (
                  <Line
                    key={pName}
                    type="monotone"
                    dataKey={pName}
                    name={pName}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2.5}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Complete Product Summary Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h4 className="text-sm font-semibold text-white mb-4">Detailed Product Catalogue Performance Table</h4>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3 pl-2">Product Name</th>
                <th className="pb-3">Product Category</th>
                <th className="pb-3 text-right">Units Sold</th>
                <th className="pb-3 text-right">Gross Sales ($)</th>
                <th className="pb-3 text-right">Gross Profit ($)</th>
                <th className="pb-3 text-right">Revenue Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {top_selling.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-slate-800/10 transition">
                  <td className="py-3 pl-2 font-medium text-white">{row.product_name}</td>
                  <td className="py-3 text-slate-400">{row.category}</td>
                  <td className="py-3 text-right font-mono">{(row.quantity_sold || row.quantity || 0).toLocaleString()}</td>
                  <td className="py-3 text-right font-mono">${row.revenue.toFixed(2)}</td>
                  <td className="py-3 text-right font-mono text-emerald-400">${(row.profit_generated || row.profit || 0).toFixed(2)}</td>
                  <td className="py-3 text-right font-mono font-semibold text-teal-400">{row.contribution_pct.toFixed(2)}%</td>
                </tr>
              ))}
              {/* Also render remaining lower selling products */}
              {least_selling.map((row: any, i: number) => {
                // Deduplicate if already in top_selling
                if (top_selling.some((p: any) => p.product_name === row.product_name)) return null;
                return (
                  <tr key={`low-${i}`} className="hover:bg-slate-800/10 bg-red-950/5 transition">
                    <td className="py-3 pl-2 font-medium text-white">{row.product_name}</td>
                    <td className="py-3 text-slate-400">{row.category}</td>
                    <td className="py-3 text-right font-mono">{(row.quantity_sold || row.quantity || 0).toLocaleString()}</td>
                    <td className="py-3 text-right font-mono">${row.revenue.toFixed(2)}</td>
                    <td className="py-3 text-right font-mono text-red-400">${(row.profit_generated || row.profit || 0).toFixed(2)}</td>
                    <td className="py-3 text-right font-mono font-semibold text-teal-400">{row.contribution_pct.toFixed(2)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

