import {
  Match,
  Player,
  PlayerId,
  PlayerStats,
  Round,
} from '../models/tournament.models';

function emptyStats(player: Player): PlayerStats {
  return {
    playerId: player.id,
    name: player.name,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    points: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
  };
}

function applyMatchToStats(
  statsMap: Map<PlayerId, PlayerStats>,
  match: Match
): void {
  if (!match.result) return;

  const { homeGoals, awayGoals } = match.result;
  const [hp1, hp2] = match.home.players;
  const [ap1, ap2] = match.away.players;
  const homeWon = homeGoals > awayGoals;
  const awayWon = awayGoals > homeGoals;
  const draw = homeGoals === awayGoals;

  const update = (
    id: PlayerId,
    gf: number,
    ga: number,
    won: boolean,
    drew: boolean
  ) => {
    const s = statsMap.get(id);
    if (!s) return;
    s.played++;
    s.goalsFor += gf;
    s.goalsAgainst += ga;
    s.goalDifference = s.goalsFor - s.goalsAgainst;
    if (won) {
      s.wins++;
      s.points += 3;
    } else if (drew) {
      s.draws++;
      s.points += 1;
    } else {
      s.losses++;
    }
  };

  update(hp1, homeGoals, awayGoals, homeWon, draw);
  update(hp2, homeGoals, awayGoals, homeWon, draw);
  update(ap1, awayGoals, homeGoals, awayWon, draw);
  update(ap2, awayGoals, homeGoals, awayWon, draw);
}

/**
 * Computes individual standings from all completed matches.
 * Sort order: points desc → goal diff desc → goals for desc → name asc.
 */
export function computeStandings(
  players: Player[],
  rounds: Round[]
): PlayerStats[] {
  const statsMap = new Map<PlayerId, PlayerStats>();
  for (const p of players) statsMap.set(p.id, emptyStats(p));

  for (const round of rounds) {
    for (const match of round.matches) {
      applyMatchToStats(statsMap, match);
    }
  }

  return [...statsMap.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference)
      return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.name.localeCompare(b.name);
  });
}
