import { create } from 'zustand';
import { projectsApi, environmentsApi } from '../api/client';
import type { Project, Environment } from '../types';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  currentEnvironment: Environment | null;
  environments: Environment[];
  setCurrentProject: (project: Project) => void;
  setCurrentEnvironment: (env: Environment) => void;
  fetchProjects: () => Promise<void>;
  fetchEnvironments: (projectKey: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  currentEnvironment: null,
  environments: [],

  setCurrentProject: (project) => set({ currentProject: project }),
  setCurrentEnvironment: (env) => set({ currentEnvironment: env }),

  fetchProjects: async () => {
    const res = await projectsApi.list();
    const projects = res.data.data || res.data;
    set({ projects });
    if (!get().currentProject && projects.length > 0) {
      set({ currentProject: projects[0] });
    }
  },

  fetchEnvironments: async (projectKey) => {
    const res = await environmentsApi.list(projectKey);
    const environments = res.data.data || res.data;
    set({ environments });
    if (!get().currentEnvironment && environments.length > 0) {
      set({ currentEnvironment: environments[0] });
    }
  },
}));
