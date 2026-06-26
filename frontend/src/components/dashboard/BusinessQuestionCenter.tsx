"use client";

import { HelpCircle, CheckCircle, ShieldAlert, Sparkles, TrendingUp, Users, ShoppingBag, MapPin, Repeat } from "lucide-react";

interface BusinessQuestionCenterProps {
  questionsData: any;
  isLoading: boolean;
}

export default function BusinessQuestionCenter({ questionsData, isLoading }: BusinessQuestionCenterProps) {
  if (isLoading || !questionsData) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-slate-400 text-xs animate-pulse">Running Dynamic Business Analytics Inferences...</span>
      </div>
    );
  }

  const qaList = [
    {
      q: "Who are our top customers?",
      a: questionsData.top_customers,
      icon: <Users className="w-5 h-5 text-teal-400" />
    },
    {
      q: "Which products perform best?",
      a: questionsData.best_products,
      icon: <ShoppingBag className="w-5 h-5 text-teal-400" />
    },
    {
      q: "Which products perform worst?",
      a: questionsData.worst_products,
      icon: <ShieldAlert className="w-5 h-5 text-red-400" />
    },
    {
      q: "Which regions generate most revenue?",
      a: questionsData.top_regions,
      icon: <MapPin className="w-5 h-5 text-indigo-400" />
    },
    {
      q: "Which customer segment is most valuable?",
      a: questionsData.valuable_segment,
      icon: <TrendingUp className="w-5 h-5 text-indigo-400" />
    },
    {
      q: "How can customer retention be improved?",
      a: questionsData.improve_retention,
      icon: <Repeat className="w-5 h-5 text-teal-400" />
    },
    {
      q: "What strategies can increase sales?",
      a: questionsData.increase_sales,
      icon: <Sparkles className="w-5 h-5 text-amber-400" />
    },
    {
      q: "What products should be cross-sold?",
      a: questionsData.cross_sell,
      icon: <CheckCircle className="w-5 h-5 text-emerald-450" />
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-2">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-teal-400" /> Key Business Questions Center
        </h3>
        <p className="text-xs text-slate-400">
          These insights are compiled automatically by running cross-tab queries and modeling against your uploaded dataset filters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {qaList.map((qa, index) => (
          <div key={index} className="bg-slate-900 border border-slate-850 hover:border-slate-800 p-6 rounded-xl space-y-3.5 shadow-md hover:shadow-lg transition relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500/80 opacity-0 group-hover:opacity-100 transition" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-950 rounded-lg flex items-center justify-center border border-slate-800">
                {qa.icon}
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-teal-400 transition">{qa.q}</h4>
            </div>
            <p className="text-xs text-slate-350 leading-relaxed pl-1">
              {qa.a}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

