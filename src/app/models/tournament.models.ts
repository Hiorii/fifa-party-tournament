export interface Player {
  id: string;
  name: string;
}

export type PlayerId = string;

export interface Team {
  players: [PlayerId, PlayerId];
}

export interface MatchResult {
  homeGoals: number;
  awayGoals: number;
}

export interface Match {
  id: string;
  console: 'A' | 'B';
  home: Team;
  away: Team;
  result?: MatchResult;
}

export interface Round {
  index: number;
  iteration: number;
  matches: [Match, Match];
}

export interface TournamentConfig {
  mode: 'dual-2v2';
  iterations: number;
}

export interface ConsoleNames {
  A: string;
  B: string;
}

export interface PlayerStats {
  playerId: PlayerId;
  name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface TournamentState {
  players: Player[];
  config: TournamentConfig;
  consoleNames?: ConsoleNames;
  rounds: Round[];
  version: number;
}

export const REQUIRED_PLAYERS = 8;
export const DEFAULT_CONFIG: TournamentConfig = { mode: 'dual-2v2', iterations: 1 };
export const DEFAULT_CONSOLE_NAMES: ConsoleNames = { A: 'Console A', B: 'Console B' };
