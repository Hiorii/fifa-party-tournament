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
type ConsoleAssignment = boolean[];

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

function playersInPattern(pattern: MatchPattern): number[] {
  return pattern.flatMap((team) => team);
}

function scoreConsoleCounts(counts: number[], roundCount: number): number[] {
  const target = roundCount / 2;
  const deviations = counts.map((count) => Math.abs(count - target));
  return [
    Math.max(...deviations),
    deviations.reduce((sum, deviation) => sum + deviation, 0),
    deviations.reduce((sum, deviation, index) => sum + deviation * (REQUIRED_PLAYERS - index), 0),
  ];
}

function isBetterScore(score: number[], bestScore: number[] | null): boolean {
  if (!bestScore) return true;
  for (let i = 0; i < score.length; i++) {
    if (score[i] !== bestScore[i]) return score[i] < bestScore[i];
  }
  return false;
}

function buildConsoleAssignments(roundPatterns: RoundPattern[]): ConsoleAssignment {
  const assignmentCount = 2 ** roundPatterns.length;
  let bestAssignments: ConsoleAssignment = [];
  let bestScore: number[] | null = null;

  for (let mask = 0; mask < assignmentCount; mask++) {
    const consoleACounts = Array(REQUIRED_PLAYERS).fill(0) as number[];
    const assignments: ConsoleAssignment = [];

    for (let roundIndex = 0; roundIndex < roundPatterns.length; roundIndex++) {
      const swapped = Boolean(mask & (1 << roundIndex));
      assignments.push(swapped);
      const consoleAPattern = roundPatterns[roundIndex][swapped ? 1 : 0];
      for (const playerIndex of playersInPattern(consoleAPattern)) {
        consoleACounts[playerIndex]++;
      }
    }

    const score = scoreConsoleCounts(consoleACounts, roundPatterns.length);
    if (isBetterScore(score, bestScore)) {
      bestScore = score;
      bestAssignments = assignments;
    }
  }

  return bestAssignments;
}

/**
 * Generates a balanced 8-player schedule.
 * - 7 rounds per iteration.
 * - Every teammate pair appears exactly once per iteration.
 * - Every opponent pair appears exactly twice per iteration.
 * - The two matches in each round are assigned to consoles to balance per-player console usage.
 * - Returns [] when player count is not exactly 8.
 */
export function generateSchedule(
  players: Player[],
  config: TournamentConfig
): Round[] {
  if (players.length !== REQUIRED_PLAYERS || !hasUniquePlayerIds(players)) return [];

  const rounds: Round[] = [];
  const roundPatterns = Array.from({ length: config.iterations }, () => BALANCED_ROUND_PATTERNS).flat();
  const consoleAssignments = buildConsoleAssignments(roundPatterns);

  for (let iter = 1; iter <= config.iterations; iter++) {
    for (let r = 0; r < BALANCED_ROUND_PATTERNS.length; r++) {
      const scheduleIndex = (iter - 1) * BALANCED_ROUND_PATTERNS.length + r;
      const pattern = roundPatterns[scheduleIndex];
      const swapped = consoleAssignments[scheduleIndex];
      const roundId = `i${iter}r${r}`;
      rounds.push({
        index: r,
        iteration: iter,
        matches: [
          matchFromPattern(players, pattern[swapped ? 1 : 0], roundId, 'A'),
          matchFromPattern(players, pattern[swapped ? 0 : 1], roundId, 'B'),
        ],
      });
    }
  }

  return rounds;
}
