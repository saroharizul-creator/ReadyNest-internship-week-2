import { create } from "zustand";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: typeof window !== "undefined" && localStorage.getItem("user") 
    ? JSON.parse(localStorage.getItem("user") || "null") 
    : null,
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  isLoggedIn: typeof window !== "undefined" && !!localStorage.getItem("token"),
  
  login: (user, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, token, isLoggedIn: true });
  },
  
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null, isLoggedIn: false });
  }
}));

interface Project {
  id: number;
  name: string;
  description?: string;
  industry?: string;
  datasetType?: string;
}

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;
  setProjects: (projects: Project[]) => void;
  setActiveProject: (project: Project | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  activeProject: typeof window !== "undefined" && localStorage.getItem("activeProject")
    ? JSON.parse(localStorage.getItem("activeProject") || "null")
    : null,
  
  setProjects: (projects) => set({ projects }),
  setActiveProject: (project) => {
    if (project) {
      localStorage.setItem("activeProject", JSON.stringify(project));
    } else {
      localStorage.removeItem("activeProject");
    }
    set({ activeProject: project });
  }
}));
