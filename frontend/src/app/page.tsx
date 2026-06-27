"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore, useProjectStore } from "../store";
import { api } from "../services/api";
import {
  BarChart3,
  TrendingUp,
  Users,
  UploadCloud,
  RotateCcw,
  SlidersHorizontal,
  FolderOpen,
  LogOut,
  Shield,
  FileSpreadsheet,
  FileText,
  Presentation,
  CheckCircle,
  AlertTriangle,
  Loader2,
  HelpCircle,
  Globe,
  Sparkles,
  Search,
  Plus,
  Trash2,
} from "lucide-react";

// Dashboard sub-components
import FiltersPanel from "../components/dashboard/FiltersPanel";
import ExecutiveSummary from "../components/dashboard/ExecutiveSummary";
import EDAView from "../components/dashboard/EDAView";
import ProductPerformance from "../components/dashboard/ProductPerformance";
import CustomerOverview from "../components/dashboard/CustomerOverview";
import RegionalPerformance from "../components/dashboard/RegionalPerformance";
import BusinessQuestionCenter from "../components/dashboard/BusinessQuestionCenter";
import PredictiveML from "../components/dashboard/PredictiveML";
import AIAnalyst from "../components/dashboard/AIAnalyst";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auth state
  const { user, token, isLoggedIn, login, logout } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Projects state
  const { projects, activeProject, setProjects, setActiveProject } = useProjectStore();
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjIndustry, setNewProjIndustry] = useState("");
  const [newProjDatasetType, setNewProjDatasetType] = useState("");
  const [projError, setProjError] = useState("");

  // Workspace layout & navigation
  const [activeTab, setActiveTab] = useState("executive");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Dynamic filter lists
  const [filterOptions, setFilterOptions] = useState<any>({
    regions: [],
    types: [],
    categories: [],
    minDate: "",
    maxDate: "",
  });
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Tab Loaders and Datasets
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  const [execData, setExecData] = useState<any>(null);
  const [isLoadingExec, setIsLoadingExec] = useState(false);

  const [edaData, setEdaData] = useState<any>(null);
  const [isLoadingEDA, setIsLoadingEDA] = useState(false);

  const [productData, setProductData] = useState<any>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  const [customerData, setCustomerData] = useState<any>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);

  const [regionalData, setRegionalData] = useState<any>(null);
  const [isLoadingRegional, setIsLoadingRegional] = useState(false);

  const [questionsData, setQuestionsData] = useState<any>(null);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // ML data
  const [mlSegmentation, setMlSegmentation] = useState<any[]>([]);
  const [mlChurn, setMlChurn] = useState<any[]>([]);
  const [mlRecommendations, setMlRecommendations] = useState<any[]>([]);
  const [isLoadingML, setIsLoadingML] = useState(false);

  // Conversational QA State
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ sender: "user" | "ai"; text: string }>>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Ingestion data
  const [dragOver, setDragOver] = useState(false);
  const [valReport, setValReport] = useState<any>(null);
  const [cleanLog, setCleanLog] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  // General toast notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Auth Action Handlers
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      if (isRegister) {
        await api.register({ name: authName, email: authEmail, password: authPassword });
        setIsRegister(false);
        showToast("Registration successful! Please login.", "success");
      } else {
        const response = await api.login({ username: authEmail, password: authPassword });
        login(response.user, response.access_token);
        showToast(`Welcome back, ${response.user.name}!`, "success");
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed");
    }
  };

  // 2. Project Action Handlers
  const fetchProjectsList = async () => {
    try {
      const data = await api.listProjects();
      setProjects(data);
    } catch (err) {
      console.error("Failed to load projects", err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setProjError("");
    if (!newProjName.trim()) return;
    try {
      const newProj = await api.createProject({
        name: newProjName,
        description: newProjDesc,
        industry: newProjIndustry,
        dataset_type: newProjDatasetType,
      });
      setNewProjName("");
      setNewProjDesc("");
      setNewProjIndustry("");
      setNewProjDatasetType("");
      await fetchProjectsList();
      showToast("Project created successfully!", "success");
      handleSelectProject(newProj);
    } catch (err: any) {
      setProjError(err.message || "Failed to create project");
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await api.deleteProject(id);
      if (activeProject?.id === id) {
        setActiveProject(null);
        setAnalyticsData(null);
      }
      await fetchProjectsList();
      showToast("Project deleted", "info");
    } catch (err) {
      showToast("Failed to delete project", "error");
    }
  };

  const handleSelectProject = (project: any) => {
    setActiveProject(project);
    setAnalyticsData(null);
    setExecData(null);
    setEdaData(null);
    setProductData(null);
    setCustomerData(null);
    setRegionalData(null);
    setQuestionsData(null);
    setValReport(null);
    setCleanLog(null);
    setChatHistory([]);
  };

  // 3. Tab Specific Data Loading
  const loadTabMetrics = async () => {
    if (!activeProject) return;

    // Abort any active request in this workspace before initiating new ones
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    const filters = {
      regions: selectedRegions,
      types: selectedTypes,
      categories: selectedCategories,
      segments: selectedSegments,
      startDate: startDate || null,
      endDate: endDate || null,
    };

    switch (activeTab) {
      case "executive":
        setIsLoadingExec(true);
        setIsLoadingAnalytics(true);
        try {
          const [execSummary, analyticResult] = await Promise.all([
            api.getExecutiveSummary(activeProject.id, filters, signal),
            api.getAnalytics(activeProject.id, filters, signal),
          ]);
          setExecData(execSummary);
          setAnalyticsData(analyticResult);
        } catch (err: any) {
          if (err.name !== "AbortError") {
            showToast("Failed to load executive summary analytics", "error");
          }
        } finally {
          setIsLoadingExec(false);
          setIsLoadingAnalytics(false);
        }
        break;

      case "eda":
        setIsLoadingEDA(true);
        try {
          const res = await api.getEDA(activeProject.id, filters, signal);
          setEdaData(res);
        } catch (err: any) {
          if (err.name !== "AbortError") {
            showToast("Failed to run EDA metrics", "error");
          }
        } finally {
          setIsLoadingEDA(false);
        }
        break;

      case "product":
        setIsLoadingProduct(true);
        try {
          const res = await api.getProductAnalytics(activeProject.id, filters, signal);
          setProductData(res);
        } catch (err: any) {
          if (err.name !== "AbortError") {
            showToast("Failed to compute product rankings", "error");
          }
        } finally {
          setIsLoadingProduct(false);
        }
        break;

      case "customer":
        setIsLoadingCustomer(true);
        try {
          const res = await api.getCustomerAnalytics(activeProject.id, filters, signal);
          setCustomerData(res);
        } catch (err: any) {
          if (err.name !== "AbortError") {
            showToast("Failed to run customer analytics", "error");
          }
        } finally {
          setIsLoadingCustomer(false);
        }
        break;

      case "regional":
        setIsLoadingRegional(true);
        try {
          const res = await api.getRegionalAnalytics(activeProject.id, filters, signal);
          setRegionalData(res);
        } catch (err: any) {
          if (err.name !== "AbortError") {
            showToast("Failed to load regional analytics", "error");
          }
        } finally {
          setIsLoadingRegional(false);
        }
        break;

      case "questions":
        setIsLoadingQuestions(true);
        try {
          const res = await api.getBusinessQuestions(activeProject.id, filters, signal);
          setQuestionsData(res);
        } catch (err: any) {
          if (err.name !== "AbortError") {
            showToast("Failed to solve business questions", "error");
          }
        } finally {
          setIsLoadingQuestions(false);
        }
        break;

      case "ml":
        setIsLoadingML(true);
        try {
          const [segments, churns, recommends] = await Promise.all([
            api.getMLSegmentation(activeProject.id, signal),
            api.getMLChurn(activeProject.id, signal),
            api.getMLRecommendations(activeProject.id, signal),
          ]);
          setMlSegmentation(segments);
          setMlChurn(churns);
          setMlRecommendations(recommends);
        } catch (err: any) {
          if (err.name !== "AbortError") {
            showToast("Failed to load ML models", "error");
          }
        } finally {
          setIsLoadingML(false);
        }
        break;

      case "ai":
        setIsLoadingExec(true); // AI analyst relies on executive insights engine
        try {
          const execSummary = await api.getExecutiveSummary(activeProject.id, filters, signal);
          setExecData(execSummary);
        } catch (err: any) {
          if (err.name !== "AbortError") {
            showToast("Failed to load AI executive insights", "error");
          }
        } finally {
          setIsLoadingExec(false);
        }
        break;

      default:
        break;
    }
  };

  const fetchFiltersInfo = async () => {
    if (!activeProject) return;
    try {
      const data = await api.getFilterOptions(activeProject.id);
      setFilterOptions(data);
      // Initialize select dates
      setStartDate(data.minDate);
      setEndDate(data.maxDate);
    } catch (err) {
      console.error("Failed to load filter metadata", err);
    }
  };

  // Conversational QA Chat handler
  const handleSendChatMessage = async () => {
    if (!activeProject || !chatQuestion.trim()) return;
    setIsChatLoading(true);
    const q = chatQuestion;
    setChatQuestion("");
    setChatHistory((prev) => [...prev, { sender: "user", text: q }]);

    try {
      const response = await api.askAIChat(activeProject.id, q);
      setChatHistory((prev) => [...prev, { sender: "ai", text: response.answer }]);
    } catch (err) {
      setChatHistory((prev) => [...prev, { sender: "ai", text: "I ran into an issue analyzing the database. Please try again." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // 4. File Upload & Ingestion actions
  const handleFileUpload = async (file: File) => {
    if (!activeProject) return;
    setIsUploading(true);
    setValReport(null);
    setCleanLog(null);
    try {
      const result = await api.uploadDataset(activeProject.id, file);
      setValReport(result.validation_report);
      setCleanLog(result.cleaning_report);
      showToast("Dataset successfully processed!", "success");
      await fetchFiltersInfo();
      await loadTabMetrics();
    } catch (err: any) {
      showToast(err.message || "File upload failed", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetSampleDataset = async () => {
    if (!activeProject) return;
    setIsUploading(true);
    try {
      await api.resetDataset(activeProject.id);
      showToast("Seeded sample dataset successfully", "success");
      setValReport(null);
      setCleanLog(null);
      await fetchFiltersInfo();
      await loadTabMetrics();
    } catch (err) {
      showToast("Reset failed", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // Effects
  useEffect(() => {
    if (isLoggedIn) {
      fetchProjectsList();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (activeProject) {
      fetchFiltersInfo();
      // loadTabMetrics is omitted here; the activeTab/activeProject effect handles it cleanly.
    }
  }, [activeProject]);

  useEffect(() => {
    if (activeProject) {
      loadTabMetrics();
    }
  }, [activeTab, activeProject]);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Hydration Guard
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
      </div>
    );
  }

  // Auth Guard
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-500 to-indigo-500" />
          
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center text-teal-400 mb-3 border border-slate-700">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-white">InsightFlow AI</h2>
            <p className="text-sm text-slate-400 mt-1">Autonomous Customer Analytics & Recommendation Engine</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authError && (
              <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg text-xs text-red-400">
                {authError}
              </div>
            )}

            {isRegister && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-slate-400 block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Password</label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 active:bg-teal-700 transition text-slate-950 text-sm font-semibold py-2.5 rounded-lg mt-2 flex items-center justify-center">
              {isRegister ? "Create Account" : "Access Platform"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setAuthError("");
              }}
              className="text-xs text-teal-400 hover:text-teal-300 font-medium"
            >
              {isRegister ? "Already have an account? Sign In" : "New to InsightFlow? Register Here"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Project Selection Guard
  if (!activeProject) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        {/* Header */}
        <header className="border-b border-slate-900 bg-slate-900/50 backdrop-blur-md px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <Sparkles className="text-teal-400 w-5 h-5" />
            <span className="font-bold text-lg text-white">InsightFlow AI</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-500" />
              <span className="text-xs text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded uppercase">{user?.role}</span>
            </div>
            <button onClick={logout} className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </header>

        {/* Workspace Portal */}
        <div className="flex-1 max-w-5xl mx-auto w-full p-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Create Form */}
          <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-teal-400" /> Create Workspace
            </h3>
            <p className="text-xs text-slate-400">Initialize a new analytics project for custom dataset ingestion.</p>
            
            {projError && (
              <div className="p-3 bg-red-950/30 border border-red-800 rounded-lg text-xs text-red-400">
                {projError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="eCommerce Sales 2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Industry</label>
                <input
                  type="text"
                  value={newProjIndustry}
                  onChange={(e) => setNewProjIndustry(e.target.value)}
                  placeholder="Retail, SaaS, Healthcare"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Dataset Type</label>
                <input
                  type="text"
                  value={newProjDatasetType}
                  onChange={(e) => setNewProjDatasetType(e.target.value)}
                  placeholder="Customer Transactions"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Description</label>
                <textarea
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  placeholder="Write a brief overview..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white h-20 resize-none focus:outline-none focus:border-teal-500"
                />
              </div>

              <button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 transition text-slate-950 font-semibold py-2 rounded-lg text-xs">
                Create Workspace
              </button>
            </form>
          </div>

          {/* Project List */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-indigo-400" /> Active Workspaces
              </h3>
              <span className="text-xs text-slate-400">{projects.length} projects found</span>
            </div>

            {projects.length === 0 ? (
              <div className="border border-dashed border-slate-800 rounded-xl p-12 text-center text-slate-500">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No workspaces initialized yet.</p>
                <p className="text-xs text-slate-600 mt-1">Use the panel on the left to start a project.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.map((proj) => (
                  <div key={proj.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition flex flex-col justify-between group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                    <div>
                      <div className="flex justify-between items-start mb-2 pl-2">
                        <h4 className="font-semibold text-white group-hover:text-teal-400 transition text-sm">{proj.name}</h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(proj.id);
                          }}
                          className="text-slate-500 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-4 pl-2 h-8">{proj.description || "No description provided."}</p>
                    </div>

                    <div className="flex justify-between items-center pl-2 pt-2 border-t border-slate-800/50">
                      <div className="flex gap-1.5">
                        {proj.industry && <span className="bg-slate-800 text-[10px] px-2 py-0.5 rounded text-indigo-300 border border-slate-700">{proj.industry}</span>}
                        {proj.datasetType && <span className="bg-slate-800 text-[10px] px-2 py-0.5 rounded text-teal-300 border border-slate-700">{proj.datasetType}</span>}
                      </div>
                      <button
                        onClick={() => handleSelectProject(proj)}
                        className="text-xs font-semibold text-teal-400 group-hover:underline flex items-center gap-1"
                      >
                        Enter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Toast notification wrapper */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg border flex items-center gap-2 shadow-2xl animate-bounce bg-slate-900 border-slate-850">
          <CheckCircle className="w-5 h-5 text-teal-400" />
          <span className="text-xs font-medium text-white">{toast.message}</span>
        </div>
      )}

      {/* Primary Top Header bar */}
      <header className="border-b border-slate-900 bg-slate-900/50 backdrop-blur-md px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-teal-400 w-5 h-5" />
            <span className="font-bold text-lg text-white">InsightFlow AI</span>
          </div>
          <span className="text-slate-700">|</span>
          <button
            onClick={() => setActiveProject(null)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition"
          >
            <FolderOpen className="w-4 h-4" /> Workspaces
          </button>
          <span className="text-xs text-slate-500 font-mono">/ {activeProject.name}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* File Exports link cluster */}
          <div className="flex gap-1 bg-slate-900 p-1 border border-slate-800 rounded-lg mr-2">
            <a href={api.getExportUrl(activeProject.id, "excel")} title="Download Excel Report" className="p-1.5 text-slate-400 hover:text-teal-400 rounded transition">
              <FileSpreadsheet className="w-4 h-4" />
            </a>
            <a href={api.getExportUrl(activeProject.id, "pdf")} title="Download PDF Executive Report" className="p-1.5 text-slate-400 hover:text-indigo-400 rounded transition">
              <FileText className="w-4 h-4" />
            </a>
            <a href={api.getExportUrl(activeProject.id, "powerpoint")} title="Download PPTX Presentation" className="p-1.5 text-slate-400 hover:text-amber-400 rounded transition">
              <Presentation className="w-4 h-4" />
            </a>
          </div>

          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition ${
              isFilterOpen ? "bg-teal-500 text-slate-950 border-teal-500" : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>

          <button onClick={logout} className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      {/* Interactive filter dropdown drawer */}
      {isFilterOpen && (
        <div className="bg-slate-950 px-8 py-5 border-b border-slate-900 animate-fade-in">
          <FiltersPanel
            filterOptions={filterOptions}
            selectedRegions={selectedRegions}
            setSelectedRegions={setSelectedRegions}
            selectedTypes={selectedTypes}
            setSelectedTypes={setSelectedTypes}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            selectedSegments={selectedSegments}
            setSelectedSegments={setSelectedSegments}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            onApply={() => {
              setIsFilterOpen(false);
              loadTabMetrics();
            }}
          />
        </div>
      )}

      {/* Main Grid Workspace area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-64 border-r border-slate-900 bg-slate-950/80 p-6 flex flex-col justify-between overflow-y-auto">
          <nav className="space-y-6">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Analytics Views</span>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab("executive")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition ${
                    activeTab === "executive" ? "bg-slate-900 text-teal-400 border-l-2 border-teal-400" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" /> Executive Summary
                </button>

                <button
                  onClick={() => setActiveTab("eda")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition ${
                    activeTab === "eda" ? "bg-slate-900 text-teal-400 border-l-2 border-teal-400" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" /> Exploratory Data (EDA)
                </button>

                <button
                  onClick={() => setActiveTab("product")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition ${
                    activeTab === "product" ? "bg-slate-900 text-teal-400 border-l-2 border-teal-400" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <TrendingUp className="w-4 h-4" /> Product Performance
                </button>

                <button
                  onClick={() => setActiveTab("customer")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition ${
                    activeTab === "customer" ? "bg-slate-900 text-teal-400 border-l-2 border-teal-400" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Users className="w-4 h-4" /> Customer Overview
                </button>

                <button
                  onClick={() => setActiveTab("regional")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition ${
                    activeTab === "regional" ? "bg-slate-900 text-teal-400 border-l-2 border-teal-400" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Globe className="w-4 h-4" /> Regional Performance
                </button>

                <button
                  onClick={() => setActiveTab("questions")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition ${
                    activeTab === "questions" ? "bg-slate-900 text-teal-400 border-l-2 border-teal-400" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <HelpCircle className="w-4 h-4" /> Business Questions
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">AI & Predictions</span>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab("ml")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition ${
                    activeTab === "ml" ? "bg-slate-900 text-teal-400 border-l-2 border-teal-400" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <TrendingUp className="w-4 h-4" /> Predictive ML
                </button>

                <button
                  onClick={() => setActiveTab("ai")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition ${
                    activeTab === "ai" ? "bg-slate-900 text-teal-400 border-l-2 border-teal-400" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-4 h-4" /> AI Analyst & Chat
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Configuration</span>
              <button
                onClick={() => setActiveTab("ingestion")}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition ${
                  activeTab === "ingestion" ? "bg-slate-900 text-teal-400 border-l-2 border-teal-400" : "text-slate-400 hover:text-white"
                }`}
              >
                <UploadCloud className="w-4 h-4" /> Upload & Clean Data
              </button>
            </div>
          </nav>

          <div className="border-t border-slate-900 pt-4 space-y-1.5">
            <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider block">Status Profile</span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-350 bg-slate-900 px-3 py-2 rounded-lg border border-slate-850">
              <CheckCircle className="w-4 h-4 text-teal-400" />
              <span className="truncate max-w-[140px] font-mono">Dataset Active</span>
            </div>
          </div>
        </aside>

        {/* Dynamic viewport panel */}
        <main className="flex-1 p-8 overflow-y-auto bg-slate-950 space-y-6">
          
          {/* TAB 1: EXECUTIVE SUMMARY */}
          {activeTab === "executive" && (
            <ExecutiveSummary
              execData={execData}
              analyticsData={analyticsData}
              isLoading={isLoadingExec || isLoadingAnalytics}
            />
          )}

          {/* TAB 2: EXPLORATORY DATA ANALYSIS */}
          {activeTab === "eda" && (
            <EDAView
              edaData={edaData}
              isLoading={isLoadingEDA}
            />
          )}

          {/* TAB 3: PRODUCT PERFORMANCE */}
          {activeTab === "product" && (
            <ProductPerformance
              productData={productData}
              isLoading={isLoadingProduct}
            />
          )}

          {/* TAB 4: CUSTOMER OVERVIEW */}
          {activeTab === "customer" && (
            <CustomerOverview
              customerData={customerData}
              isLoading={isLoadingCustomer}
            />
          )}

          {/* TAB 5: REGIONAL PERFORMANCE */}
          {activeTab === "regional" && (
            <RegionalPerformance
              regionalData={regionalData}
              isLoading={isLoadingRegional}
            />
          )}

          {/* TAB 6: BUSINESS QUESTION CENTER */}
          {activeTab === "questions" && (
            <BusinessQuestionCenter
              questionsData={questionsData}
              isLoading={isLoadingQuestions}
            />
          )}

          {/* TAB 7: PREDICTIVE ML */}
          {activeTab === "ml" && (
            <PredictiveML
              mlSegmentation={mlSegmentation}
              mlChurn={mlChurn}
              mlRecommendations={mlRecommendations}
              isLoading={isLoadingML}
            />
          )}

          {/* TAB 8: AI ANALYST & CHAT */}
          {activeTab === "ai" && (
            <AIAnalyst
              execData={execData}
              isLoadingInsights={isLoadingExec}
              chatQuestion={chatQuestion}
              setChatQuestion={setChatQuestion}
              chatHistory={chatHistory}
              isChatLoading={isChatLoading}
              onSendChatMessage={handleSendChatMessage}
            />
          )}

          {/* TAB 9: DATA INGESTION & AUTO CLEANING */}
          {activeTab === "ingestion" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Upload zone */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-5">
                  <h4 className="text-sm font-semibold text-white">Dataset File Ingestion Portal</h4>
                  
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const file = e.dataTransfer.files[0];
                      if (file) handleFileUpload(file);
                    }}
                    onClick={() => document.getElementById("file-picker")?.click()}
                    className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                      dragOver ? "border-teal-500 bg-teal-500/5" : "border-slate-800 hover:border-slate-700 bg-slate-950/40"
                    }`}
                  >
                    <UploadCloud className="w-12 h-12 text-slate-500 mb-3" />
                    <h5 className="text-xs font-semibold text-white">Drag & drop your CSV or Excel file</h5>
                    <p className="text-[10px] text-slate-550 mt-1">Accepts CSV, XLSX, JSON formats up to 500 MB</p>
                    <input
                      type="file"
                      id="file-picker"
                      accept=".csv, .xlsx, .json"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                  </div>

                  {isUploading && (
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <Loader2 className="w-4 h-4 animate-spin text-teal-400" /> Reading file and writing database tables...
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[11px] text-slate-500">Need sample database data to test?</span>
                    <button
                      onClick={handleResetSampleDataset}
                      className="bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 font-semibold px-4 py-1.5 rounded-lg text-[10px] flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Seed Default CSV
                    </button>
                  </div>
                </div>

                {/* Profiler feedback */}
                <div className="space-y-6">
                  {valReport && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-semibold text-white">Validation Quality Profiler</h4>
                        <span className="text-xs font-bold text-teal-400 font-mono">Score: {valReport.quality_score || 95}%</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Total Ingested Rows</span>
                          <span className="font-mono text-white">{valReport.total_rows?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Detected Duplicate Rows</span>
                          <span className="font-mono text-white">{valReport.duplicate_rows}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Columns with Missing Cells</span>
                          <span className="font-mono text-white">{Object.keys(valReport.missing_values || {}).length}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {cleanLog && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
                      <h4 className="text-sm font-semibold text-white">Auto-Cleaning Engine Logs</h4>
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <CheckCircle className="w-4 h-4 text-teal-400" />
                          <span>Removed <strong>{cleanLog.duplicates_removed}</strong> duplicate records.</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <CheckCircle className="w-4 h-4 text-teal-400" />
                          <span>Standardized <strong>{cleanLog.dates_standardized}</strong> date strings.</span>
                        </div>
                        {cleanLog.invalid_rows_removed > 0 && (
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <span>Dropped <strong>{cleanLog.invalid_rows_removed}</strong> rows due to unparseable values.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

