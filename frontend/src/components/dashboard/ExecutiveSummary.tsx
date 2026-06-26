"use client";

import { ShoppingBag, Users, TrendingUp, BarChart3, Clock, CheckCircle } from "lucide-react";
import {
  AreaChart,
  Area,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

interface ExecutiveSummaryProps {
  execData: any;
  analyticsData: any;
  isLoading: boolean;
}

export default function ExecutiveSummary({ execData, analyticsData, isLoading }: ExecutiveSummaryProps) {
  if (isLoading || !execData || !analyticsData) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-slate-400 text-xs animate-pulse">Retrieving Executive Summary Data...</span>
      </div>
    );
  }

  const kpis = execData.kpis || {};
  const monthlyTrends = analyticsData.monthly_trends || [];
  const regions = analyticsData.regions || [];
  const recentTransactions = analyticsData.filtered_transactions || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-15"><ShoppingBag className="w-12 h-12 text-teal-400" /></div>
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Total Revenue</span>
          <h3 className="text-xl font-bold text-white mt-1">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(kpis.total_revenue || 0)}
          </h3>
          <span className="text-[10px] text-teal-400 font-mono mt-2 block flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Gross sales less returns
          </span>
        </div>

        {/* Total Orders */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-15"><Clock className="w-12 h-12 text-indigo-400" /></div>
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Total Orders</span>
          <h3 className="text-xl font-bold text-white mt-1">
            {(kpis.total_orders || 0).toLocaleString()}
          </h3>
          <span className="text-[10px] text-indigo-400 font-mono mt-2 block flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Total unique orders
          </span>
        </div>

        {/* Total Customers */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-15"><Users className="w-12 h-12 text-teal-400" /></div>
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Total Customers</span>
          <h3 className="text-xl font-bold text-white mt-1">
            {(kpis.total_customers || 0).toLocaleString()}
          </h3>
          <span className="text-[10px] text-teal-400 font-mono mt-2 block flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Unique customer IDs
          </span>
        </div>

        {/* Average Order Value */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-15"><TrendingUp className="w-12 h-12 text-indigo-400" /></div>
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Avg Order Value</span>
          <h3 className="text-xl font-bold text-white mt-1">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(kpis.aov || 0)}
          </h3>
          <span className="text-[10px] text-indigo-400 font-mono mt-2 block flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Revenue per transaction
          </span>
        </div>

        {/* Profit Margin */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-15"><BarChart3 className="w-12 h-12 text-teal-400" /></div>
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Profit Margin</span>
          <h3 className="text-xl font-bold text-white mt-1">
            {((kpis.profit_margin || 0) * 100).toFixed(1)}%
          </h3>
          <span className="text-[10px] text-teal-400 font-mono mt-2 block flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Net Profit margins
          </span>
        </div>

        {/* Customer Retention Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-15"><Users className="w-12 h-12 text-indigo-400" /></div>
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Retention Rate</span>
          <h3 className="text-xl font-bold text-white mt-1">
            {((kpis.retention_rate || 0) * 100).toFixed(1)}%
          </h3>
          <span className="text-[10px] text-indigo-400 font-mono mt-2 block flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Repeat buyers percentage
          </span>
        </div>
      </div>

      {/* Visual Trends Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Area Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <h4 className="text-sm font-semibold text-white mb-4">Monthly Revenue & Operating Profit Trends</h4>
          <div className="h-72">
            {monthlyTrends.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">No trend data available for filters.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrends}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" style={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", fontSize: "11px" }} />
                  <Area type="monotone" dataKey="sales" name="Revenue ($)" stroke="#14b8a6" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                  <Line type="monotone" dataKey="profit" name="Profit ($)" stroke="#818cf8" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Regional Sales breakout */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <h4 className="text-sm font-semibold text-white mb-4">Geographical Sales Share</h4>
          <div className="h-72">
            {regions.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">No region data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="region" stroke="#64748b" style={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" style={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", fontSize: "11px" }} />
                  <Bar dataKey="sales" name="Sales ($)" fill="#818cf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h4 className="text-sm font-semibold text-white mb-4">Recent Invoiced Transactions</h4>
        {recentTransactions.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-8">No invoice history found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3">Order ID</th>
                  <th className="pb-3">Customer Name</th>
                  <th className="pb-3">Order Date</th>
                  <th className="pb-3">Region</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3 text-right">Sales Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {recentTransactions.slice(0, 5).map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-800/10 transition">
                    <td className="py-3 font-mono text-teal-400">{row["Order ID"]}</td>
                    <td className="py-3 font-medium">{row["Customer Name"]}</td>
                    <td className="py-3">{row["Order Date"]}</td>
                    <td className="py-3">
                      <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-400">
                        {row["Region"]}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{row["Product Category"]}</td>
                    <td className="py-3 text-right font-semibold text-white">
                      ${(row["Sales Amount"] || 0).toFixed(2)}
                    </td>
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

