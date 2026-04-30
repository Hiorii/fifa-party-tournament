import {
  Match,
  Player,
  PlayerId,
  REQUIRED_PLAYERS,
  Round,
  TournamentConfig,
} from '../models/tournament.models';

type TeamPair = [number, number];
type MatchPattern = [TeamPair, TeamPair];
type RoundPattern = [MatchPattern, MatchPattern];

const BALANCED_ROUND_PATTERNS: RoundPattern[] = [
  [
    [
      [0, 1],
      [2, 3],
    ],
    [
      [4, 5],
      [6, 7],
    ],
  ],
  [
    [
      [0, 2],
      [4, 6],
    ],
    [
      [1, 3],
      [5, 7],
    ],
  ],
  [
    [
      [0, 3],
      [4, 7],
    ],
    [
      [1, 2],
      [5, 6],
    ],
  ],
  [
    [
      [0, 4],
      [1, 5],
    ],
    [
      [2, 6],
      [3, 7],
    ],
  ],
  [
    [
      [0, 5],
      [2, 7],
    ],
    [
      [1, 4],
      [3, 6],
    ],
  ],
  [
    [
      [0, 6],
      [3, 5],
    ],
    [
      [1, 7],
      [2, 4],
    ],
  ],
  [
    [
      [0, 7],
      [1, 6],
    ],
    [
      [2, 5],
      [3, 4],
    ],
  ],
];

export function pairKey(a: PlayerId, b: PlayerId): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function hasUniquePlayerIds(players: Player[]): boolean {
  return new Set(players.map((player) => player.id)).size === players.length;
}

function teamFromPattern(players: Player[], pattern: TeamPair): [PlayerId, PlayerId] {
  return [players[pattern[0]].id, players[pattern[1]].id];
}

function matchFromPattern(
  players: Player[],
  pattern: MatchPattern,
  roundId: string,
  consoleId: 'A' | 'B'
): Match {
  return {
    id: `${roundId}-${consoleId}`,
    console: consoleId,
    home: { players: teamFromPattern(players, pattern[0]) },
    away: { players: teamFromPattern(players, pattern[1]) },
  };
}

/**
 * Generates a balanced 8-player schedule.
 * - 7 rounds per iteration.
 * - Every teammate pair appears exactly once per iteration.
 * - Every opponent pair appears exactly twice per iteration.
 * - Returns [] when player count is not exactly 8.
 */
export function generateSchedule(
  players: Player[],
  config: TournamentConfig
): Round[] {
  if (players.length !== REQUIRED_PLAYERS || !hasUniquePlayerIds(players)) return [];

  const rounds: Round[] = [];

  for (let iter = 1; iter <= config.iterations; iter++) {
    for (let r = 0; r < BALANCED_ROUND_PATTERNS.length; r++) {
      const pattern = BALANCED_ROUND_PATTERNS[r];
      const roundId = `i${iter}r${r}`;
      rounds.push({
        index: r,
        iteration: iter,
        matches: [
          matchFromPattern(players, pattern[0], roundId, 'A'),
          matchFromPattern(players, pattern[1], roundId, 'B'),
        ],
      });
    }
  }

  return rounds;
}
