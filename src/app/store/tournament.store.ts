import { computed, Injectable, signal } from '@angular/core';
import {
  DEFAULT_CONFIG,
  MatchResult,
  Player,
  PlayerId,
  REQUIRED_PLAYERS,
  Round,
  TournamentConfig,
  TournamentState,
} from '../models/tournament.models';
import { generateSchedule as buildSchedule } from '../lib/scheduler';
import { computeStandings } from '../lib/ranking';
import { StorageService } from '../lib/storage.service';

@Injectable({ providedIn: 'root' })
export class TournamentStore {
  readonly players = signal<Player[]>([]);
  readonly config = signal<TournamentConfig>(DEFAULT_CONFIG);
  readonly rounds = signal<Round[]>([]);

  readonly standings = computed(() => computeStandings(this.players(), this.rounds()));
  readonly playerCount = computed(() => this.players().length);
  readonly canGenerateSchedule = computed(() => this.players().length === REQUIRED_PLAYERS);
  readonly hasSchedule = computed(() => this.rounds().length > 0);
  readonly playerNamesById = computed(() => {
    const names = new Map<PlayerId, string>();
    for (const player of this.players()) names.set(player.id, player.name);
    return names;
  });

  constructor(private readonly storage: StorageService) {
    this.load();
  }

  addPlayer(name: string): boolean {
    const cleanName = name.trim();
    if (!cleanName || this.players().length >= REQUIRED_PLAYERS || this.hasSchedule()) {
      return false;
    }

    const duplicate = this.players().some(
      (player) => player.name.toLocaleLowerCase() === cleanName.toLocaleLowerCase()
    );
    if (duplicate) return false;

    this.players.update((players) => [
      ...players,
      { id: this.createId(), name: cleanName },
    ]);
    this.save();
    return true;
  }

  removePlayer(id: PlayerId): void {
    if (this.hasSchedule()) return;
    this.players.update((players) => players.filter((player) => player.id !== id));
    this.save();
  }

  setIterations(iterations: number): void {
    const safeIterations = Math.max(1, Math.min(3, Math.trunc(iterations)));
    this.config.update((config) => ({ ...config, iterations: safeIterations }));
    this.save();
  }

  generateSchedule(): void {
    if (!this.canGenerateSchedule()) return;
    this.rounds.set(buildSchedule(this.players(), this.config()));
    this.save();
  }

  enterResult(matchId: string, result: MatchResult): void {
    const cleanResult: MatchResult = {
      homeGoals: Math.max(0, Math.trunc(result.homeGoals)),
      awayGoals: Math.max(0, Math.trunc(result.awayGoals)),
    };

    this.rounds.update((rounds) =>
      rounds.map((round) => ({
        ...round,
        matches: round.matches.map((match) =>
          match.id === matchId ? { ...match, result: cleanResult } : match
        ) as Round['matches'],
      }))
    );
    this.save();
  }

  clearResult(matchId: string): void {
    this.rounds.update((rounds) =>
      rounds.map((round) => ({
        ...round,
        matches: round.matches.map((match) => {
          if (match.id !== matchId) return match;
          const { result, ...matchWithoutResult } = match;
          return matchWithoutResult;
        }) as Round['matches'],
      }))
    );
    this.save();
  }

  resetSchedule(): void {
    this.rounds.set([]);
    this.save();
  }

  resetAll(): void {
    this.players.set([]);
    this.config.set(DEFAULT_CONFIG);
    this.rounds.set([]);
    this.storage.clear();
  }

  private save(): void {
    this.storage.save({
      players: this.players(),
      config: this.config(),
      rounds: this.rounds(),
      version: 1,
    });
  }

  private load(): void {
    const state = this.storage.load();
    if (!state || state.version !== 1) return;
    this.players.set(Array.isArray(state.players) ? state.players : []);
    this.config.set(state.config ?? DEFAULT_CONFIG);
    this.rounds.set(Array.isArray(state.rounds) ? state.rounds : []);
  }

  private createId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `p-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
