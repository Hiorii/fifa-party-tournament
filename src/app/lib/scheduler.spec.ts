import { generateSchedule, pairKey } from './scheduler';
import { Player, TournamentConfig } from '../models/tournament.models';

function makePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    name: `Player ${i}`,
  }));
}

const cfg1: TournamentConfig = { mode: 'dual-2v2', iterations: 1 };
const cfg2: TournamentConfig = { mode: 'dual-2v2', iterations: 2 };

function teammateUsage(rounds: ReturnType<typeof generateSchedule>): Record<string, number> {
  const usage: Record<string, number> = {};
  for (const round of rounds) {
    for (const match of round.matches) {
      const k1 = pairKey(match.home.players[0], match.home.players[1]);
      const k2 = pairKey(match.away.players[0], match.away.players[1]);
      usage[k1] = (usage[k1] ?? 0) + 1;
      usage[k2] = (usage[k2] ?? 0) + 1;
    }
  }
  return usage;
}

function opponentUsage(rounds: ReturnType<typeof generateSchedule>): Record<string, number> {
  const usage: Record<string, number> = {};
  for (const round of rounds) {
    for (const match of round.matches) {
      for (const a of match.home.players) {
        for (const b of match.away.players) {
          const k = pairKey(a, b);
          usage[k] = (usage[k] ?? 0) + 1;
        }
      }
    }
  }
  return usage;
}

describe('generateSchedule', () => {
  it('returns empty array when fewer than 8 players provided', () => {
    expect(generateSchedule(makePlayers(7), cfg1)).toEqual([]);
  });

  it('returns empty array when more than 8 players provided', () => {
    expect(generateSchedule(makePlayers(9), cfg1)).toEqual([]);
  });

  it('returns empty array when player ids are not unique', () => {
    const players = makePlayers(8);
    players[7] = { ...players[7], id: players[0].id };
    expect(generateSchedule(players, cfg1)).toEqual([]);
  });

  it('produces 7 rounds for 1 iteration', () => {
    const rounds = generateSchedule(makePlayers(8), cfg1);
    expect(rounds.length).toBe(7);
  });

  it('produces 14 rounds for 2 iterations', () => {
    const rounds = generateSchedule(makePlayers(8), cfg2);
    expect(rounds.length).toBe(14);
  });

  it('each round contains exactly 2 matches (Console A and Console B)', () => {
    const rounds = generateSchedule(makePlayers(8), cfg1);
    for (const round of rounds) {
      expect(round.matches.length).toBe(2);
      expect(round.matches[0].console).toBe('A');
      expect(round.matches[1].console).toBe('B');
    }
  });

  it('all 8 players appear exactly once per round', () => {
    const players = makePlayers(8);
    const rounds = generateSchedule(players, cfg1);
    for (const round of rounds) {
      const ids = round.matches.flatMap((m) => [
        ...m.home.players,
        ...m.away.players,
      ]);
      expect(ids.length).toBe(8);
      expect(new Set(ids).size).toBe(8);
    }
  });

  it('no player appears on both consoles in the same round', () => {
    const rounds = generateSchedule(makePlayers(8), cfg1);
    for (const round of rounds) {
      const [mA, mB] = round.matches;
      const setA = new Set([...mA.home.players, ...mA.away.players]);
      const setB = new Set([...mB.home.players, ...mB.away.players]);
      for (const id of setA) {
        expect(setB.has(id)).toBe(false);
      }
    }
  });

  it('does not create duplicate players or duplicate teams inside one match', () => {
    const rounds = generateSchedule(makePlayers(8), cfg1);
    for (const round of rounds) {
      for (const match of round.matches) {
        const matchPlayerIds = [
          ...match.home.players,
          ...match.away.players,
        ];
        expect(new Set(match.home.players).size).toBe(2);
        expect(new Set(match.away.players).size).toBe(2);
        expect(new Set(matchPlayerIds).size).toBe(4);
        expect(pairKey(match.home.players[0], match.home.players[1])).not.toBe(
          pairKey(match.away.players[0], match.away.players[1])
        );
      }
    }
  });

  it('all 28 unique teammate pairs are covered in 1 iteration', () => {
    const usage = teammateUsage(generateSchedule(makePlayers(8), cfg1));
    expect(Object.keys(usage).length).toBe(28);
  });

  it('each teammate pair used exactly once in 1 iteration', () => {
    const usage = teammateUsage(generateSchedule(makePlayers(8), cfg1));
    for (const count of Object.values(usage)) {
      expect(count).toBe(1);
    }
  });

  it('each teammate pair used exactly twice in 2 iterations', () => {
    const usage = teammateUsage(generateSchedule(makePlayers(8), cfg2));
    for (const count of Object.values(usage)) {
      expect(count).toBe(2);
    }
  });

  it('each opponent pair is used exactly twice in 1 iteration', () => {
    const usage = opponentUsage(generateSchedule(makePlayers(8), cfg1));
    expect(Object.keys(usage).length).toBe(28);
    for (const count of Object.values(usage)) {
      expect(count).toBe(2);
    }
  });

  it('each opponent pair is used exactly four times in 2 iterations', () => {
    const usage = opponentUsage(generateSchedule(makePlayers(8), cfg2));
    expect(Object.keys(usage).length).toBe(28);
    for (const count of Object.values(usage)) {
      expect(count).toBe(4);
    }
  });

  it('round index and iteration are set correctly', () => {
    const rounds = generateSchedule(makePlayers(8), cfg2);
    const iter1 = rounds.filter((r) => r.iteration === 1);
    const iter2 = rounds.filter((r) => r.iteration === 2);
    expect(iter1.length).toBe(7);
    expect(iter2.length).toBe(7);
    expect(iter1.map((r) => r.index)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(iter2.map((r) => r.index)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('each match has unique id', () => {
    const rounds = generateSchedule(makePlayers(8), cfg1);
    const ids = rounds.flatMap((r) => r.matches.map((m) => m.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
