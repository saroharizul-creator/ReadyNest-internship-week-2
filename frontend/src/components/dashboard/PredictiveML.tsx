"use client";

import { Loader2, TrendingUp, Users } from "lucide-react";

interface PredictiveMLProps {
  mlSegmentation: any[];
  mlChurn: any[];
  mlRecommendations: any[];
  isLoading: boolean;
}

export default function PredictiveML({ mlSegmentation, mlChurn, mlRecommendations, isLoading }: PredictiveMLProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
        <span className="text-slate-400 text-xs ml-2">Calculating ML predictions (K-Means & RandomForest)...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Grid for Churn and Association */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Churn Risk */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="text-sm font-semibold text-white">RandomForest Churn Risk & Projected CLV</h4>
          <div className="overflow-y-auto max-h-80">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 pl-2">Customer</th>
                  <th className="pb-3 text-right">CLV Projection</th>
                  <th className="pb-3 text-right">Churn Risk</th>
                  <th className="pb-3 text-right">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {mlChurn.map((row: any, i: number) => {
                  const badgeClass = row.riskLevel === "High" ? "bg-red-950/60 text-red-400 border-red-900" :
                                     row.riskLevel === "Medium" ? "bg-amber-950/60 text-amber-400 border-amber-900" : "bg-teal-950/60 text-teal-400 border-teal-900";
                  return (
                    <tr key={i} className="hover:bg-slate-800/10 transition">
                      <td className="py-2.5 pl-2 font-medium text-white">{row.name}</td>
                      <td className="py-2.5 text-right font-mono font-semibold text-white">${row.clv.toFixed(2)}</td>
                      <td className="py-2.5 text-right font-mono">{(row.churnProbability * 100).toFixed(1)}%</td>
                      <td className="py-2.5 text-right">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded border uppercase font-semibold ${badgeClass}`}>{row.riskLevel}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="text-sm font-semibold text-white">Market Basket Cross-Selling Recommendations</h4>
          <p className="text-xs text-slate-400">Identified associations based on purchase history correlations.</p>
          
          {mlRecommendations.length === 0 ? (
            <div className="border border-dashed border-slate-800 rounded-lg p-6 text-center text-slate-500 text-xs">
              Insufficient transaction volume to compute association correlations.
            </div>
          ) : (
            <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
              {mlRecommendations.map((row: any, i: number) => (
                <div key={i} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="space-y-1">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase">{row.category} &rarr; {row.targetCategory}</span>
                    <h5 className="text-xs font-semibold text-white">If customer buys <span className="text-teal-400">{row.product}</span></h5>
                    <h5 className="text-xs text-slate-400">Cross-sell <span className="text-indigo-400 font-semibold">{row.recommended}</span></h5>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block font-mono">Confidence Match</span>
                    <span className="text-sm font-bold text-teal-400 font-mono">{(row.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* K-Means Customer Clustering list */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <h4 className="text-sm font-semibold text-white">K-Means Customer Clustering Profiles</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["High-Value Champions", "Average Loyals", "At-Risk Inactive"].map((name) => {
            const count = mlSegmentation.filter((s: any) => s.clusterName === name).length;
            const cardClass = name === "High-Value Champions" ? "border-teal-900 bg-teal-950/10" :
                              name === "Average Loyals" ? "border-indigo-900 bg-indigo-950/10" : "border-red-900 bg-red-950/10";
            return (
              <div key={name} className={`border rounded-xl p-5 space-y-3 ${cardClass}`}>
                <div className="flex justify-between items-center">
                  <h5 className="font-semibold text-xs text-white uppercase">{name}</h5>
                  <span className="bg-slate-900 border border-slate-800 text-xs px-2.5 py-1 rounded font-bold font-mono text-white">{count} buyers</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {name === "High-Value Champions" && "Highest purchase frequency and lifetime spend. Target with exclusive VIP early access programs and custom discounts."}
                  {name === "Average Loyals" && "Average spending and standard order counts. Target with bulk category bundles and standard cross-selling campaigns."}
                  {name === "At-Risk Inactive" && "High recency (long time since last purchase). Target with discount reactivations or direct retention campaigns."}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

