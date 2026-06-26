const API_BASE_URL = "http://localhost:8000/api";

// Helper: Get JWT from localStorage
const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  // Authentication
  async register(data: any) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || "Registration failed");
    return json;
  },

  async login(data: any) {
    const payload = {
      email: data.email || data.username,
      password: data.password,
    };
    const res = await fetch(`${API_BASE_URL}/auth/login-json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) {
      let errorDetail = "Login failed";
      try {
        const json = await res.json();
        if (typeof json.detail === "string") {
          errorDetail = json.detail;
        } else if (Array.isArray(json.detail)) {
          errorDetail = json.detail.map((err: any) => err.msg).join(", ");
        } else if (json.detail) {
          errorDetail = JSON.stringify(json.detail);
        }
      } catch (_) {
        // Fallback if not JSON
      }
      throw new Error(errorDetail);
    }
    return res.json();
  },

  // Projects CRUD
  async listProjects() {
    const res = await fetch(`${API_BASE_URL}/projects`, {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error("Failed to fetch projects");
    return res.json();
  },

  async createProject(data: any) {
    const res = await fetch(`${API_BASE_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || "Failed to create project");
    return json;
  },

  async deleteProject(projectId: number) {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error("Failed to delete project");
    return true;
  },

  // Upload Dataset
  async uploadDataset(projectId: number, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/upload`, {
      method: "POST",
      headers: { ...getAuthHeaders() },
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || "Failed to upload dataset");
    return json;
  },

  // Reset Dataset to default
  async resetDataset(projectId: number) {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/reset`, {
      method: "POST",
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || "Failed to reset dataset");
    return json;
  },

  // Get dynamic filters
  async getFilterOptions(projectId: number) {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/filter-options`, {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error("Failed to fetch filter options");
    return res.json();
  },

  // Get Analytics Dashboard data
  async getAnalytics(projectId: number, filters: any = {}) {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/analytics`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(filters),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || "Failed to fetch analytics");
    return json;
  },

  // Expanded Modules Endpoints
  async getEDA(projectId: number, filters: any = {}) {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/eda`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(filters),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || "Failed to fetch EDA metrics");
    return json;
  },

  async getProductAnalytics(projectId: number, filters: any = {}) {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/products-analytics`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(filters),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || "Failed to fetch product analytics");
    return json;
  },

  async getCustomerAnalytics(projectId: number, filters: any = {}) {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/customers-analytics`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(filters),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || "Failed to fetch customer analytics");
    return json;
  },

  async getRegionalAnalytics(projectId: number, filters: any = {}) {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/regional-analytics`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(filters),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || "Failed to fetch regional analytics");
    return json;
  },

  async getBusinessQuestions(projectId: number, filters: any = {}) {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/business-questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(filters),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || "Failed to fetch question-center answers");
    return json;
  },

  async getExecutiveSummary(projectId: number, filters: any = {}) {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/executive-summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(filters),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || "Failed to fetch executive summary");
    return json;
  },

  // ML Predictions
  async getMLSegmentation(projectId: number) {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/ml/segmentation`, {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error("Failed to fetch segmentation clustering");
    return res.json();
  },

  async getMLChurn(projectId: number) {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/ml/churn`, {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error("Failed to fetch churn predictions");
    return res.json();
  },

  async getMLRecommendations(projectId: number) {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/ml/recommendations`, {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error("Failed to fetch ML recommendations");
    return res.json();
  },

  // AI Chat and Insights
  async getAIInsights(projectId: number) {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/ai/insights`, {
      method: "POST",
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error("Failed to fetch AI insights");
    return res.json();
  },

  async askAIChat(projectId: number, question: string) {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ question }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || "Failed to send chat message");
    return json;
  },

  // Report downloads (Helper returns URL helper)
  getExportUrl(projectId: number, type: "pdf" | "excel" | "powerpoint") {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
    const typePath = type === "powerpoint" ? "powerpoint" : (type === "excel" ? "excel" : "pdf");
    return `${API_BASE_URL}/projects/${projectId}/reports/${typePath}?token=${token}`;
  }
};
