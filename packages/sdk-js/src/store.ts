import type { FFVariationDetail } from './types';

export class FlagStore {
  private storageKey: string;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  save(flags: Record<string, FFVariationDetail>): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(flags));
      }
    } catch {
      // quota exceeded or localStorage unavailable
    }
  }

  load(): Record<string, FFVariationDetail> | null {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
          return JSON.parse(raw);
        }
      }
    } catch {
      // parse error or localStorage unavailable
    }
    return null;
  }

  clear(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.storageKey);
      }
    } catch {
      // ignore
    }
  }
}
