import { Injectable } from '@angular/core';
import { TournamentState } from '../models/tournament.models';

const STORAGE_KEY = 'fifa-party-tournament-v1';

@Injectable({ providedIn: 'root' })
export class StorageService {
  save(state: TournamentState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Silently ignore — quota exceeded or private browsing
    }
  }

  load(): TournamentState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as TournamentState) : null;
    } catch {
      return null;
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
