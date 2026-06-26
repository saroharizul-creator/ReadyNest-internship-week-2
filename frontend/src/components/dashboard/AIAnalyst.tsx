"use client";

import { Lightbulb, Sparkles, MessageSquare, Loader2, ShieldAlert, ArrowUpRight, HelpCircle } from "lucide-react";

interface AIAnalystProps {
  execData: any;
  isLoadingInsights: boolean;
  chatQuestion: string;
  setChatQuestion: (val: string) => void;
  chatHistory: Array<{ sender: "user" | "ai"; text: string }>;
  isChatLoading: boolean;
  onSendChatMessage: () => void;
}

export default function AIAnalyst({
  execData,
  isLoadingInsights,
  chatQuestion,
  setChatQuestion,
  chatHistory,
  isChatLoading,
  onSendChatMessage,
}: AIAnalystProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Dynamic Strategic AI Insights Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Key Insights & Risks */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-5">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Lightbulb className="w-5 h-5 text-teal-400" /> Top Key Strategic Insights
            </h4>
            {isLoadingInsights || !execData ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-4">
                <Loader2 className="w-4 h-4 animate-spin text-teal-400" /> Computing insights...
              </div>
            ) : (
              <div className="space-y-2.5">
                {(execData.insights || []).map((ins: string, i: number) => (
                  <div key={i} className="flex gap-2.5 bg-slate-950/40 border border-slate-850 p-3 rounded-lg items-start">
                    <span className="text-teal-400 text-xs font-bold pt-0.5">&bull;</span>
                    <p className="text-xs text-slate-350 leading-relaxed">{ins}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldAlert className="w-5 h-5 text-red-400" /> Enterprise Risks Identified
            </h4>
            {isLoadingInsights || !execData ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-red-400" /> Scanning risks...
              </div>
            ) : (
              <div className="space-y-2.5">
                {(execData.risks || []).map((risk: string, i: number) => (
                  <div key={i} className="flex gap-2.5 bg-red-950/5 border border-red-900/35 p-3 rounded-lg items-start">
                    <span className="text-red-400 text-xs font-bold pt-0.5">&bull;</span>
                    <p className="text-xs text-red-200/85 leading-relaxed">{risk}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Growth Recommendations & Opportunities */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-5">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-5 h-5 text-indigo-400" /> Growth & Marketing Recommendations
            </h4>
            {isLoadingInsights || !execData ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-4">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> Drafting actions...
              </div>
            ) : (
              <div className="space-y-2.5">
                {(execData.recommendations || []).map((rec: string, i: number) => (
                  <div key={i} className="flex gap-2.5 bg-slate-950/40 border border-slate-850 p-3 rounded-lg items-start">
                    <span className="text-indigo-400 text-xs font-bold pt-0.5">&bull;</span>
                    <p className="text-xs text-slate-355 leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <ArrowUpRight className="w-5 h-5 text-emerald-400" /> Strategic Opportunities
            </h4>
            {isLoadingInsights || !execData ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> Aligning opportunities...
              </div>
            ) : (
              <div className="space-y-2.5">
                {(execData.opportunities || []).map((opp: string, i: number) => (
                  <div key={i} className="flex gap-2.5 bg-emerald-950/5 border border-emerald-900/35 p-3 rounded-lg items-start">
                    <span className="text-emerald-400 text-xs font-bold pt-0.5">&bull;</span>
                    <p className="text-xs text-emerald-200/85 leading-relaxed">{opp}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Revenue & Retention Specific Strategy Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue suggestions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="text-sm font-semibold text-white">Revenue Expansion Actions</h4>
          {isLoadingInsights || !execData ? (
            <div className="text-slate-500 text-xs">Computing actions...</div>
          ) : (
            <div className="space-y-2">
              {(execData.revenue_suggestions || []).map((sug: string, i: number) => (
                <div key={i} className="text-xs bg-slate-950 border border-slate-850 p-3 rounded-lg text-slate-300">
                  {sug}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Retention suggestions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="text-sm font-semibold text-white">Customer Retention Enhancement Programs</h4>
          {isLoadingInsights || !execData ? (
            <div className="text-slate-500 text-xs">Computing actions...</div>
          ) : (
            <div className="space-y-2">
              {(execData.retention_suggestions || []).map((sug: string, i: number) => (
                <div key={i} className="text-xs bg-slate-950 border border-slate-850 p-3 rounded-lg text-slate-300">
                  {sug}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RAG Chat assistant */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-[400px]">
        <h4 className="text-sm font-semibold text-white flex items-center gap-1.5 border-b border-slate-800 pb-3">
          <MessageSquare className="w-5 h-5 text-teal-400" /> Conversational AI Analyst Box
        </h4>
        
        {/* Chat window */}
        <div className="flex-1 overflow-y-auto space-y-3 p-2 my-2">
          {chatHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-550 space-y-2">
              <HelpCircle className="w-8 h-8 opacity-30" />
              <p className="text-center text-xs">
                Ask a specific transaction query (e.g. <i>"Who is our top spending customer?"</i> or <i>"Which regions generate most revenue?"</i>).
              </p>
            </div>
          )}
          {chatHistory.map((chat, i) => (
            <div key={i} className={`flex ${chat.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] px-4 py-2.5 rounded-xl text-xs leading-relaxed border ${
                chat.sender === "user" ? "bg-indigo-600 border-indigo-700 text-white rounded-br-none" : "bg-slate-950 border-slate-850 text-slate-300 rounded-bl-none"
              }`}>
                {chat.text}
              </div>
            </div>
          ))}
          {isChatLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-950 border border-slate-850 text-slate-500 px-4 py-2.5 rounded-xl text-xs rounded-bl-none flex items-center gap-1.5 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" /> AI Analyst is checking dataset...
              </div>
            </div>
          )}
        </div>

        {/* Input row */}
        <div className="flex gap-2 border-t border-slate-800 pt-3">
          <input
            type="text"
            value={chatQuestion}
            onChange={(e) => setChatQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onSendChatMessage(); }}
            placeholder="Ask a question about database trends..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
          />
          <button
            onClick={onSendChatMessage}
            className="bg-teal-500 hover:bg-teal-600 active:bg-teal-700 transition text-slate-950 font-semibold px-5 py-2 rounded-lg text-xs"
          >
            Ask AI
          </button>
        </div>
      </div>
    </div>
  );
}

