import { computeStandings } from './ranking';
import { Match, Player, Round } from '../models/tournament.models';

function makePlayer(id: string, name: string): Player {
  return { id, name };
}

function makeRound(matches: [Match, Match]): Round {
  return { index: 0, iteration: 1, matches };
}

function makeMatch(
  id: string,
  consoleId: 'A' | 'B',
  home: [string, string],
  away: [string, string],
  homeGoals?: number,
  awayGoals?: number
): Match {
  return {
    id,
    console: consoleId,
    home: { players: home },
    away: { players: away },
    result:
      homeGoals !== undefined && awayGoals !== undefined
        ? { homeGoals, awayGoals }
        : undefined,
  };
}

describe('computeStandings', () => {
  const p = {
    a: makePlayer('a', 'Alpha'),
    b: makePlayer('b', 'Beta'),
    c: makePlayer('c', 'Gamma'),
    d: makePlayer('d', 'Delta'),
    e: makePlayer('e', 'Epsilon'),
    f: makePlayer('f', 'Zeta'),
    g: makePlayer('g', 'Eta'),
    h: makePlayer('h', 'Theta'),
  };
  const allPlayers = Object.values(p);

  it('returns one entry per player with zero stats when no matches played', () => {
    const standings = computeStandings(allPlayers, []);
    expect(standings.length).toBe(8);
    for (const s of standings) {
      expect(s.points).toBe(0);
      expect(s.played).toBe(0);
    }
  });

  it('ignores matches with no result', () => {
    const match = makeMatch('m1', 'A', ['a', 'b'], ['c', 'd']);
    const round = makeRound([match, makeMatch('m2', 'B', ['e', 'f'], ['g', 'h'])]);
    const standings = computeStandings(allPlayers, [round]);
    for (const s of standings) {
      expect(s.played).toBe(0);
    }
  });

  it('ignores incomplete matches while counting completed matches in the same round', () => {
    const completed = makeMatch('m1', 'A', ['a', 'b'], ['c', 'd'], 3, 1);
    const incomplete = makeMatch('m2', 'B', ['e', 'f'], ['g', 'h']);
    const standings = computeStandings(allPlayers, [makeRound([completed, incomplete])]);
    const byId = Object.fromEntries(standings.map((s) => [s.playerId, s]));

    expect(byId['a'].played).toBe(1);
    expect(byId['b'].played).toBe(1);
    expect(byId['c'].played).toBe(1);
    expect(byId['d'].played).toBe(1);
    expect(byId['e'].played).toBe(0);
    expect(byId['f'].played).toBe(0);
    expect(byId['g'].played).toBe(0);
    expect(byId['h'].played).toBe(0);
  });

  it('win gives 3 points to both players on winning team', () => {
    const match = makeMatch('m1', 'A', ['a', 'b'], ['c', 'd'], 3, 1);
    const round = makeRound([match, makeMatch('m2', 'B', ['e', 'f'], ['g', 'h'])]);
    const standings = computeStandings(allPlayers, [round]);
    const byId = Object.fromEntries(standings.map((s) => [s.playerId, s]));
    expect(byId['a'].points).toBe(3);
    expect(byId['b'].points).toBe(3);
    expect(byId['c'].points).toBe(0);
    expect(byId['d'].points).toBe(0);
  });

  it('loss gives 0 points to losing team', () => {
    const match = makeMatch('m1', 'A', ['a', 'b'], ['c', 'd'], 0, 2);
    const round = makeRound([match, makeMatch('m2', 'B', ['e', 'f'], ['g', 'h'])]);
    const standings = computeStandings(allPlayers, [round]);
    const byId = Object.fromEntries(standings.map((s) => [s.playerId, s]));
    expect(byId['a'].points).toBe(0);
    expect(byId['b'].points).toBe(0);
    expect(byId['c'].points).toBe(3);
    expect(byId['d'].points).toBe(3);
  });

  it('draw gives 1 point to each player', () => {
    const match = makeMatch('m1', 'A', ['a', 'b'], ['c', 'd'], 2, 2);
    const round = makeRound([match, makeMatch('m2', 'B', ['e', 'f'], ['g', 'h'])]);
    const standings = computeStandings(allPlayers, [round]);
    const byId = Object.fromEntries(standings.map((s) => [s.playerId, s]));
    expect(byId['a'].points).toBe(1);
    expect(byId['b'].points).toBe(1);
    expect(byId['c'].points).toBe(1);
    expect(byId['d'].points).toBe(1);
  });

  it('updates wins, losses, draws, goals, goal difference and points', () => {
    const r1 = makeRound([
      makeMatch('m1', 'A', ['a', 'b'], ['c', 'd'], 4, 2),
      makeMatch('m2', 'B', ['e', 'f'], ['g', 'h'], 1, 1),
    ]);
    const standings = computeStandings(allPlayers, [r1]);
    const byId = Object.fromEntries(standings.map((s) => [s.playerId, s]));

    expect(byId['a']).toMatchObject({
      played: 1,
      wins: 1,
      draws: 0,
      losses: 0,
      points: 3,
      goalsFor: 4,
      goalsAgainst: 2,
      goalDifference: 2,
    });
    expect(byId['c']).toMatchObject({
      played: 1,
      wins: 0,
      draws: 0,
      losses: 1,
      points: 0,
      goalsFor: 2,
      goalsAgainst: 4,
      goalDifference: -2,
    });
    expect(byId['e']).toMatchObject({
      played: 1,
      wins: 0,
      draws: 1,
      losses: 0,
      points: 1,
      goalsFor: 1,
      goalsAgainst: 1,
      goalDifference: 0,
    });
  });

  it('4:2 win — home team gets GF=4 GA=2, away team gets GF=2 GA=4', () => {
    const match = makeMatch('m1', 'A', ['a', 'b'], ['c', 'd'], 4, 2);
    const round = makeRound([match, makeMatch('m2', 'B', ['e', 'f'], ['g', 'h'])]);
    const standings = computeStandings(allPlayers, [round]);
    const byId = Object.fromEntries(standings.map((s) => [s.playerId, s]));
    expect(byId['a'].goalsFor).toBe(4);
    expect(byId['a'].goalsAgainst).toBe(2);
    expect(byId['a'].goalDifference).toBe(2);
    expect(byId['c'].goalsFor).toBe(2);
    expect(byId['c'].goalsAgainst).toBe(4);
    expect(byId['c'].goalDifference).toBe(-2);
  });

  it('counts played correctly across multiple matches', () => {
    const m1 = makeMatch('m1', 'A', ['a', 'b'], ['c', 'd'], 1, 0);
    const m2 = makeMatch('m2', 'B', ['a', 'c'], ['e', 'f'], 2, 2);
    const r1 = makeRound([m1, makeMatch('m3', 'B', ['e', 'f'], ['g', 'h'])]);
    const r2 = makeRound([m2, makeMatch('m4', 'A', ['b', 'd'], ['g', 'h'])]);
    const standings = computeStandings(allPlayers, [r1, r2]);
    const byId = Object.fromEntries(standings.map((s) => [s.playerId, s]));
    expect(byId['a'].played).toBe(2);
    expect(byId['e'].played).toBe(1);
  });

  it('sorts by points descending', () => {
    const m1 = makeMatch('m1', 'A', ['a', 'b'], ['c', 'd'], 2, 0);
    const m2 = makeMatch('m2', 'B', ['e', 'f'], ['g', 'h'], 1, 1);
    const round = makeRound([m1, m2]);
    const standings = computeStandings(allPlayers, [round]);
    const topTwo = standings.slice(0, 2).map((s) => s.playerId);
    expect(topTwo).toContain('a');
    expect(topTwo).toContain('b');
  });

  it('sorts by goal difference when points are equal', () => {
    const m1 = makeMatch('m1', 'A', ['a', 'b'], ['c', 'd'], 3, 0);
    const m2 = makeMatch('m2', 'B', ['e', 'f'], ['g', 'h'], 1, 0);
    const round = makeRound([m1, m2]);
    const standings = computeStandings(allPlayers, [round]);
    const byId = Object.fromEntries(standings.map((s) => [s.playerId, s]));
    expect(byId['a'].goalDifference).toBe(3);
    expect(byId['e'].goalDifference).toBe(1);
    expect(standings.findIndex((s) => s.playerId === 'a')).toBeLessThan(
      standings.findIndex((s) => s.playerId === 'e')
    );
  });

  it('sorts by name ascending as final tiebreaker', () => {
    const standings = computeStandings(allPlayers, []);
    const names = standings.map((s) => s.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});
