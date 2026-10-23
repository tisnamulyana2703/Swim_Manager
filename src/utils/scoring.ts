/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Athlete, BestSwimmer, Club, ClubMedalTally, Heat, LaneAllocation, SwimEvent } from '../types/swim';

export const STANDARD_POINTS_TABLE: number[] = [9, 7, 6, 5, 4, 3, 2, 1];

/**
 * Calculate and assign ranks, points, and records across all heats in an event
 */
export function calculateEventResults(
  event: SwimEvent
): { updatedHeats: Heat[]; isCompleted: boolean; fastestWinner?: LaneAllocation } {
  const clonedHeats = JSON.parse(JSON.stringify(event.heats)) as Heat[];
  
  // Extract all lane allocations across all heats
  const allLanes: LaneAllocation[] = [];
  clonedHeats.forEach(h => {
    h.lanes.forEach(l => {
      allLanes.push(l);
    });
  });

  // Check if at least some lanes have final times
  const validCompletedLanes = allLanes.filter(
    l => l.status === 'OK' && l.finalTimeMs !== null && l.finalTimeMs > 0
  );

  const isCompleted = allLanes.length > 0 && allLanes.every(l => l.status !== 'PENDING');

  // Sort valid finishers by final time ascending
  validCompletedLanes.sort((a, b) => (a.finalTimeMs || 0) - (b.finalTimeMs || 0));

  // Determine ranks
  let currentRank = 1;
  for (let i = 0; i < validCompletedLanes.length; i++) {
    const lane = validCompletedLanes[i];
    if (i > 0 && lane.finalTimeMs === validCompletedLanes[i - 1].finalTimeMs) {
      // Tie with previous
      lane.rankInEvent = validCompletedLanes[i - 1].rankInEvent;
    } else {
      lane.rankInEvent = currentRank;
    }
    
    // Assign points based on rank
    const pointsIdx = (lane.rankInEvent || currentRank) - 1;
    lane.points = pointsIdx < STANDARD_POINTS_TABLE.length ? STANDARD_POINTS_TABLE[pointsIdx] : 0;

    // Check meet record
    if (event.meetRecord && event.meetRecord.timeMs > 0 && lane.finalTimeMs) {
      if (lane.finalTimeMs < event.meetRecord.timeMs) {
        lane.isNewRecord = true;
      }
    }

    currentRank++;
  }

  // Non-finisher statuses get no rank or points
  allLanes.forEach(l => {
    if (l.status !== 'OK') {
      l.rankInEvent = null;
      l.points = 0;
      l.isNewRecord = false;
    }
  });

  // Calculate heat-specific rank for each heat
  clonedHeats.forEach(h => {
    const okHeatLanes = h.lanes.filter(l => l.status === 'OK' && l.finalTimeMs !== null);
    okHeatLanes.sort((a, b) => (a.finalTimeMs || 0) - (b.finalTimeMs || 0));
    okHeatLanes.forEach((l, idx) => {
      l.rankInHeat = idx + 1;
    });

    h.isCompleted = h.lanes.length > 0 && h.lanes.every(l => l.status !== 'PENDING');
  });

  return {
    updatedHeats: clonedHeats,
    isCompleted,
    fastestWinner: validCompletedLanes[0]
  };
}

/**
 * Generate Medal Tally per Club
 */
export function calculateClubMedalTally(
  clubs: Club[],
  events: SwimEvent[],
  athletes: Athlete[]
): ClubMedalTally[] {
  const athleteMap = new Map<string, Athlete>();
  athletes.forEach(a => athleteMap.set(a.id, a));

  const tallyMap = new Map<string, { gold: number; silver: number; bronze: number; points: number }>();

  clubs.forEach(c => {
    tallyMap.set(c.id, { gold: 0, silver: 0, bronze: 0, points: 0 });
  });

  events.forEach(event => {
    const allLanes: LaneAllocation[] = [];
    event.heats.forEach(h => allLanes.push(...h.lanes));

    allLanes.forEach(lane => {
      if (!lane.rankInEvent || lane.status !== 'OK') return;

      const athlete = athleteMap.get(lane.athleteId);
      if (!athlete) return;

      const clubTally = tallyMap.get(athlete.clubId) || { gold: 0, silver: 0, bronze: 0, points: 0 };

      if (lane.rankInEvent === 1) clubTally.gold++;
      else if (lane.rankInEvent === 2) clubTally.silver++;
      else if (lane.rankInEvent === 3) clubTally.bronze++;

      clubTally.points += lane.points || 0;
      tallyMap.set(athlete.clubId, clubTally);
    });
  });

  const results: ClubMedalTally[] = clubs.map(club => {
    const item = tallyMap.get(club.id) || { gold: 0, silver: 0, bronze: 0, points: 0 };
    return {
      clubId: club.id,
      clubCode: club.code,
      clubName: club.name,
      city: club.city,
      gold: item.gold,
      silver: item.silver,
      bronze: item.bronze,
      totalMedals: item.gold + item.silver + item.bronze,
      points: item.points,
      rank: 0,
    };
  });

  // Sort by Gold (desc), then Silver (desc), then Bronze (desc), then Total Points (desc)
  results.sort((a, b) => {
    if (b.gold !== a.gold) return b.gold - a.gold;
    if (b.silver !== a.silver) return b.silver - a.silver;
    if (b.bronze !== a.bronze) return b.bronze - a.bronze;
    return b.points - a.points;
  });

  // Assign ranking numbers
  results.forEach((item, index) => {
    item.rank = index + 1;
  });

  return results;
}

/**
 * Determine Best Swimmer (Perenang Terbaik) per Age Group & Gender
 */
export function calculateBestSwimmers(
  athletes: Athlete[],
  events: SwimEvent[],
  clubs: Club[]
): BestSwimmer[] {
  const clubMap = new Map<string, Club>();
  clubs.forEach(c => clubMap.set(c.id, c));

  const athleteMap = new Map<string, Athlete>();
  athletes.forEach(a => athleteMap.set(a.id, a));

  const statsMap = new Map<string, { gold: number; silver: number; bronze: number; points: number; records: number }>();

  athletes.forEach(a => {
    statsMap.set(a.id, { gold: 0, silver: 0, bronze: 0, points: 0, records: 0 });
  });

  events.forEach(event => {
    const allLanes: LaneAllocation[] = [];
    event.heats.forEach(h => allLanes.push(...h.lanes));

    allLanes.forEach(lane => {
      if (lane.status !== 'OK' || !lane.rankInEvent) return;

      const stats = statsMap.get(lane.athleteId);
      if (!stats) return;

      if (lane.rankInEvent === 1) stats.gold++;
      else if (lane.rankInEvent === 2) stats.silver++;
      else if (lane.rankInEvent === 3) stats.bronze++;

      stats.points += lane.points || 0;
      if (lane.isNewRecord) stats.records++;
    });
  });

  const bestSwimmerList: BestSwimmer[] = athletes.map(athlete => {
    const stats = statsMap.get(athlete.id) || { gold: 0, silver: 0, bronze: 0, points: 0, records: 0 };
    const club = clubMap.get(athlete.clubId);

    return {
      athleteId: athlete.id,
      athleteName: athlete.name,
      clubName: club ? club.name : 'Independen',
      gender: athlete.gender,
      ageGroup: athlete.ageGroup,
      gold: stats.gold,
      silver: stats.silver,
      bronze: stats.bronze,
      totalMedals: stats.gold + stats.silver + stats.bronze,
      totalPoints: stats.points,
      recordsBroken: stats.records,
    };
  });

  // Filter out swimmers with 0 points
  const activeSwimmers = bestSwimmerList.filter(s => s.totalPoints > 0 || s.totalMedals > 0);

  // Sort by Gold, Silver, Bronze, then Total Points
  activeSwimmers.sort((a, b) => {
    if (b.gold !== a.gold) return b.gold - a.gold;
    if (b.silver !== a.silver) return b.silver - a.silver;
    if (b.bronze !== a.bronze) return b.bronze - a.bronze;
    return b.totalPoints - a.totalPoints;
  });

  return activeSwimmers;
}
