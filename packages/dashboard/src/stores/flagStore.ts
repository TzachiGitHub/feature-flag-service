import { create } from 'zustand';
import { flagsApi } from '../api/client';
import type { Flag } from '../types';

interface FlagFilters {
  search: string;
  tag: string;
  type: string;
  archived: boolean;
}

interface FlagState {
  flags: Flag[];
  currentFlag: Flag | null;
  loading: boolean;
  filters: FlagFilters;
  fetchFlags: (projectKey: string) => Promise<void>;
  fetchFlag: (projectKey: string, flagKey: string) => Promise<void>;
  toggleFlag: (projectKey: string, flagKey: string, envKey: string) => Promise<void>;
  setFilter: (key: string, value: any) => void;
}

export const useFlagStore = create<FlagState>((set, get) => ({
  flags: [],
  currentFlag: null,
  loading: false,
  filters: { search: '', tag: '', type: '', archived: false },

  fetchFlags: async (projectKey) => {
    set({ loading: true });
    try {
      const { filters } = get();
      const params: any = {};
      if (filters.search) params.search = filters.search;
      if (filters.tag) params.tag = filters.tag;
      if (filters.type) params.type = filters.type;
      if (filters.archived) params.archived = true;
      const res = await flagsApi.list(projectKey, params);
      const raw = res.data;
      set({ flags: raw.flags || raw.data || (Array.isArray(raw) ? raw : []) });
    } finally {
      set({ loading: false });
    }
  },

  fetchFlag: async (projectKey, flagKey) => {
    set({ loading: true });
    try {
      const res = await flagsApi.get(projectKey, flagKey);
      set({ currentFlag: res.data.data || res.data });
    } finally {
      set({ loading: false });
    }
  },

  toggleFlag: async (projectKey, flagKey, envKey) => {
    await flagsApi.toggle(projectKey, flagKey, envKey);
    await get().fetchFlags(projectKey);
  },

  setFilter: (key, value) => {
    set((state) => ({ filters: { ...state.filters, [key]: value } }));
  },
}));
