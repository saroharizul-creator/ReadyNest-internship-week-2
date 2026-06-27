"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Users, UserCheck, RefreshCw, BarChart3, TrendingUp, Lightbulb } from "lucide-react";

interface CustomerOverviewProps {
  customerData: any;
  isLoading: boolean;
}

const COLORS = ["#14b8a6", "#818cf8"];

export default function CustomerOverview({ customerData, isLoading }: CustomerOverviewProps) {
  if (isLoading || !customerData) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-slate-400 text-xs animate-pulse">Running Customer Cohort Analyzer...</span>
      </div>
    );
  }

  const { kpis = {}, growth_trend = [], new_vs_returning = {}, acquisition_timeline = [], retention_trend = [], cohort_matrix = [], insights = {} } = customerData;

  const acquisitionAnalysis = insights?.acquisition_analysis || [];
  const retentionAnalysis = insights?.retention_analysis || [];
  const growthRecommendations = insights?.growth_recommendations || [];

  const pieData = [
    { name: "New Buyers", value: new_vs_returning.new || 0 },
    { name: "Returning Buyers", value: new_vs_returning.returning || 0 }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Total Customers */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Customer Pool</span>
            <h3 className="text-xl font-bold text-white mt-1">
              {(kpis.total_customers || 0).toLocaleString()}
            </h3>
            <span className="text-[10px] text-slate-500 mt-1 block">Lifetime distinct accounts</span>
          </div>
          <div className="w-10 h-10 bg-teal-950 text-teal-400 rounded-lg flex items-center justify-center border border-teal-900">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* New Customers */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">New Customer Pool</span>
            <h3 className="text-xl font-bold text-white mt-1">
              {(kpis.new_customers || 0).toLocaleString()}
            </h3>
            <span className="text-[10px] text-slate-500 mt-1 block">Single purchase cohort</span>
          </div>
          <div className="w-10 h-10 bg-indigo-950 text-indigo-400 rounded-lg flex items-center justify-center border border-indigo-900">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Returning Customers */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Returning Shoppers</span>
            <h3 className="text-xl font-bold text-teal-400 mt-1">
              {(kpis.returning_customers || 0).toLocaleString()}
            </h3>
            <span className="text-[10px] text-slate-500 mt-1 block">Buyers with &gt;1 orders</span>
          </div>
          <div className="w-10 h-10 bg-teal-950 text-teal-400 rounded-lg flex items-center justify-center border border-teal-900">
            <RefreshCw className="w-5 h-5" />
          </div>
        </div>

        {/* Customer Growth Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Database Growth Rate</span>
            <h3 className="text-xl font-bold text-white mt-1">
              {kpis.growth_rate || 0.0}%
            </h3>
            <span className="text-[10px] text-slate-500 mt-1 block">MoM cumulative change</span>
          </div>
          <div className="w-10 h-10 bg-indigo-950 text-indigo-400 rounded-lg flex items-center justify-center border border-indigo-900">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Repeat Purchase Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Repeat Purchase Rate</span>
            <h3 className="text-xl font-bold text-teal-400 mt-1">
              {kpis.repeat_purchase_rate || 0.0}%
            </h3>
            <span className="text-[10px] text-slate-500 mt-1 block">Loyalty cohort percentage</span>
          </div>
          <div className="w-10 h-10 bg-teal-950 text-teal-400 rounded-lg flex items-center justify-center border border-teal-900">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Cohort Business Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Acquisition */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Users className="w-4 h-4 text-teal-400" /> Acquisition Analysis
          </h4>
          <div className="space-y-2.5">
            {acquisitionAnalysis.map((ins: string, idx: number) => (
              <div key={idx} className="flex gap-2 items-start text-xs text-slate-350 leading-relaxed">
                <span className="text-teal-400 font-bold">&bull;</span>
                <p>{ins}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Retention */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <RefreshCw className="w-4 h-4 text-indigo-400" /> Retention Analysis
          </h4>
          <div className="space-y-2.5">
            {retentionAnalysis.map((ins: string, idx: number) => (
              <div key={idx} className="flex gap-2 items-start text-xs text-slate-350 leading-relaxed">
                <span className="text-indigo-400 font-bold">&bull;</span>
                <p>{ins}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Growth recommendations */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Lightbulb className="w-4 h-4 text-amber-400" /> Growth Recommendations
          </h4>
          <div className="space-y-2.5">
            {growthRecommendations.map((ins: string, idx: number) => (
              <div key={idx} className="flex gap-2 items-start text-xs text-slate-350 leading-relaxed">
                <span className="text-amber-400 font-bold">&bull;</span>
                <p>{ins}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cumulative customer growth trend */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="text-sm font-semibold text-white">Database Growth Trend (Cumulative Customers)</h4>
          <div className="h-64">
            {growth_trend.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">No records available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growth_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" style={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", fontSize: "11px" }} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line type="monotone" dataKey="cumulative_customers" name="Cumulative Customers" stroke="#14b8a6" strokeWidth={2} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="active_customers" name="Monthly Active Customers" stroke="#818cf8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* New vs Returning Buyers (Pie Chart) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="text-sm font-semibold text-white">New vs. Returning Customer Share</h4>
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="col-span-1 h-60 flex items-center justify-center">
              {pieData[0].value === 0 && pieData[1].value === 0 ? (
                <div className="text-slate-500 text-xs">No records.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
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
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-slate-350 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="font-medium">{entry.name}</span>
                  </div>
                  <span className="font-mono text-white font-semibold">{(entry.value || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Acquisition Timeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="text-sm font-semibold text-white">Acquisition Timeline (New Customers per Month)</h4>
          <div className="h-64">
            {acquisition_timeline.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">No timeline data.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={acquisition_timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" style={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", fontSize: "11px" }} />
                  <Bar dataKey="new_customers" name="New Customers" fill="#818cf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Retention Trend Curve */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="text-sm font-semibold text-white">Repeat Customer Activity Trend (Active Cohort %)</h4>
          <div className="h-64">
            {retention_trend.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">No retention trend.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={retention_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" style={{ fontSize: 10 }} unit="%" />
                  <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", fontSize: "11px" }} />
                  <Line type="monotone" dataKey="retention_rate" name="Active Cohort %" stroke="#14b8a6" strokeWidth={2.5} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Customer Cohort Retention Heatmap */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-white">Cohort Retention Heatmap (Monthly Cohorts)</h4>
          <p className="text-xs text-slate-400 mt-1">Tracks customer retention cohorts over time based on initial acquisition month.</p>
        </div>
        
        {cohort_matrix.length === 0 ? (
          <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
            Insufficient transaction history or time periods to generate a cohort matrix.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3 pl-2 w-24">Cohort Month</th>
                  <th className="pb-3 w-20 text-center">Cohort Size</th>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <th key={i} className="pb-3 text-center w-12">M{i}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {cohort_matrix.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-800/10 transition">
                    <td className="py-2.5 pl-2 font-medium text-white">{row.cohort}</td>
                    <td className="py-2.5 text-center font-mono text-slate-350">{row.size} buyers</td>
                    {row.rates.map((rate: number, idx: number) => {
                      // Determine cell background color opacity based on retention rate
                      const opacity = rate > 0 ? Math.max(rate / 100, 0.08) : 0;
                      // Use clean visible styling
                      const cellStyle = rate > 0 ? { backgroundColor: `rgba(20, 184, 166, ${opacity * 0.75})` } : {};
                      
                      return (
                        <td
                          key={idx}
                          className="py-2.5 text-center font-mono text-[10px] border border-slate-800/40"
                          style={cellStyle}
                        >
                          <span className={rate > 50 ? "text-white font-semibold" : "text-slate-200"}>
                            {rate > 0 ? `${rate}%` : "-"}
                          </span>
                        </td>
                      );
                    })}
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

