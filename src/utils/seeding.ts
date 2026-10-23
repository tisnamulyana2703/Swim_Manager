/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Athlete, Heat, LaneAllocation, SwimEvent } from '../types/swim';

/**
 * Standard lane assignment pattern based on World Aquatics / FINA rules.
 * The fastest swimmer is positioned in the center lane, second fastest to their right/next lane,
 * continuing outward in a spearhead (zig-zag) formation.
 * Supports active lanes filtering and custom lane order.
 */
export function getLaneOrder(
  poolLanes: number, 
  activeLanes?: number[], 
  customOrder?: number[]
): number[] {
  let baseOrder: number[];

  if (customOrder && customOrder.length > 0) {
    baseOrder = [...customOrder];
  } else {
    switch (poolLanes) {
      case 6:
        baseOrder = [3, 4, 2, 5, 1, 6];
        break;
      case 10:
        baseOrder = [5, 6, 4, 7, 3, 8, 2, 9, 1, 10];
        break;
      case 8:
      default:
        baseOrder = [4, 5, 3, 6, 2, 7, 1, 8];
        break;
    }
  }

  // Filter only active lanes if specified
  if (activeLanes && activeLanes.length > 0) {
    const activeSet = new Set(activeLanes);
    return baseOrder.filter(lane => activeSet.has(lane));
  }

  return baseOrder;
}

/**
 * Standard World Aquatics Lane Rope Colors:
 * Lanes 4 & 5 (or center 2): Yellow
 * Outer Lanes 1 & 8/10/6: Green
 * Other Intermediate Lanes: Blue
 */
export function getDefaultLaneColor(laneNumber: number, poolLanes: number): {
  name: string;
  bgClass: string;
  borderClass: string;
  badgeClass: string;
  hex: string;
} {
  const centerLanes = poolLanes === 6 ? [3, 4] : poolLanes === 10 ? [5, 6] : [4, 5];
  const outerLanes = poolLanes === 6 ? [1, 6] : poolLanes === 10 ? [1, 10] : [1, 8];

  if (centerLanes.includes(laneNumber)) {
    return {
      name: 'Kuning (Unggulan Pusat)',
      bgClass: 'bg-amber-400',
      borderClass: 'border-amber-400',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      hex: '#f59e0b',
    };
  }

  if (outerLanes.includes(laneNumber)) {
    return {
      name: 'Hijau (Lintasan Luar / Dinding)',
      bgClass: 'bg-emerald-500',
      borderClass: 'border-emerald-500',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      hex: '#10b981',
    };
  }

  return {
    name: 'Biru (Lintasan Tengah)',
    bgClass: 'bg-blue-500',
    borderClass: 'border-blue-500',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    hex: '#3b82f6',
  };
}

export interface AthleteSeedEntry {
  athlete: Athlete;
  seedTime: string;
  seedTimeMs: number;
}

/**
 * Distribute total number of swimmers across heats.
 * Enforces World Aquatics guideline: Avoid heats with only 1 or 2 swimmers.
 * Example for 9 swimmers in 8-lane pool: 5 in heat 1, 4 in heat 2 (or 5 & 4).
 */
export function calculateHeatSizes(totalSwimmers: number, poolLanes: number): number[] {
  if (totalSwimmers <= 0) return [];
  if (totalSwimmers <= poolLanes) return [totalSwimmers];

  const heatSizes: number[] = [];
  const fullHeats = Math.floor(totalSwimmers / poolLanes);
  const remainder = totalSwimmers % poolLanes;

  if (remainder === 0) {
    for (let i = 0; i < fullHeats; i++) {
      heatSizes.push(poolLanes);
    }
    return heatSizes;
  }

  // If remainder is 1 or 2, borrow from the last full heat to maintain at least 3 swimmers per heat
  if (remainder < 3 && fullHeats >= 1) {
    const combined = poolLanes + remainder;
    const heat1 = Math.floor(combined / 2);
    const heat2 = combined - heat1;

    heatSizes.push(heat1);
    heatSizes.push(heat2);

    for (let i = 1; i < fullHeats; i++) {
      heatSizes.push(poolLanes);
    }
  } else {
    // Heat 1 gets the remainder, remaining heats are full
    heatSizes.push(remainder);
    for (let i = 0; i < fullHeats; i++) {
      heatSizes.push(poolLanes);
    }
  }

  return heatSizes;
}

/**
 * Execute automatic seeding according to standard World Aquatics Timed Finals rules.
 * Swimmers are sorted by seed time (fastest first).
 * The fastest swimmers are assigned to the last heat, with center-outward lane placement.
 * Respects activeLanes and customOrder configuration.
 */
export function autoSeedEvent(
  event: SwimEvent,
  entries: AthleteSeedEntry[],
  poolLanes: 6 | 8 | 10 = 8,
  activeLanes?: number[],
  customOrder?: number[]
): Heat[] {
  if (entries.length === 0) {
    return [];
  }

  // Determine active lane order
  const laneOrder = getLaneOrder(poolLanes, activeLanes, customOrder);
  const effectiveCapacity = Math.max(1, laneOrder.length);

  // Sort entries: fastest time first (lowest seedTimeMs > 0). If seedTimeMs is 0 (NT), put at the end.
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.seedTimeMs === 0 && b.seedTimeMs === 0) return a.athlete.name.localeCompare(b.athlete.name);
    if (a.seedTimeMs === 0) return 1;
    if (b.seedTimeMs === 0) return -1;
    return a.seedTimeMs - b.seedTimeMs;
  });

  const totalSwimmers = sortedEntries.length;
  const heatSizes = calculateHeatSizes(totalSwimmers, effectiveCapacity);
  const totalHeats = heatSizes.length;

  // Split sorted entries among heats.
  // In Timed Finals:
  // Heat 1 has the slowest swimmers.
  // Last Heat (heat totalHeats) has the fastest swimmers.
  const heatSwimmerGroups: AthleteSeedEntry[][] = [];
  let currentIdx = totalSwimmers;

  // We assign from the last heat (fastest) backwards
  for (let h = totalHeats - 1; h >= 0; h--) {
    const count = heatSizes[h];
    const startIndex = Math.max(0, currentIdx - count);
    const swimmersForThisHeat = sortedEntries.slice(startIndex, currentIdx);
    heatSwimmerGroups[h] = swimmersForThisHeat;
    currentIdx = startIndex;
  }

  const generatedHeats: Heat[] = [];

  for (let h = 0; h < totalHeats; h++) {
    const heatNumber = h + 1;
    const swimmersInHeat = heatSwimmerGroups[h] || [];
    
    // Sort within heat: fastest swimmers first so they get optimal center lanes
    const sortedInHeat = [...swimmersInHeat].sort((a, b) => {
      if (a.seedTimeMs === 0 && b.seedTimeMs === 0) return 0;
      if (a.seedTimeMs === 0) return 1;
      if (b.seedTimeMs === 0) return -1;
      return a.seedTimeMs - b.seedTimeMs;
    });

    const lanes: LaneAllocation[] = [];

    // Assign swimmers to lanes according to spearhead lane order
    for (let i = 0; i < sortedInHeat.length; i++) {
      const entry = sortedInHeat[i];
      const targetLane = laneOrder[i];

      lanes.push({
        heatNumber,
        laneNumber: targetLane,
        athleteId: entry.athlete.id,
        seedTime: entry.seedTime,
        seedTimeMs: entry.seedTimeMs,
        finalTime: null,
        finalTimeMs: null,
        status: 'PENDING',
        rankInHeat: null,
        rankInEvent: null,
        points: 0,
        isNewRecord: false,
      });
    }

    // Sort lanes by laneNumber ascending (1, 2, 3...) for easy reading and pool deck presentation
    lanes.sort((a, b) => a.laneNumber - b.laneNumber);

    generatedHeats.push({
      heatNumber,
      isCompleted: false,
      lanes,
    });
  }

  return generatedHeats;
}

/**
 * Helper to swap or move an athlete between lanes/heats manually
 */
export function manualLaneReassign(
  heats: Heat[],
  fromHeat: number,
  fromLane: number,
  toHeat: number,
  toLane: number
): Heat[] {
  const newHeats = JSON.parse(JSON.stringify(heats)) as Heat[];
  
  const sourceHeatObj = newHeats.find(h => h.heatNumber === fromHeat);
  const targetHeatObj = newHeats.find(h => h.heatNumber === toHeat);

  if (!sourceHeatObj || !targetHeatObj) return heats;

  const sourceLaneIdx = sourceHeatObj.lanes.findIndex(l => l.laneNumber === fromLane);
  const targetLaneIdx = targetHeatObj.lanes.findIndex(l => l.laneNumber === toLane);

  if (sourceLaneIdx === -1) return heats;

  if (targetLaneIdx !== -1) {
    // Both occupied: swap
    const sourceData = sourceHeatObj.lanes[sourceLaneIdx];
    const targetData = targetHeatObj.lanes[targetLaneIdx];

    const tempAthleteId = sourceData.athleteId;
    const tempSeed = sourceData.seedTime;
    const tempSeedMs = sourceData.seedTimeMs;

    sourceData.athleteId = targetData.athleteId;
    sourceData.seedTime = targetData.seedTime;
    sourceData.seedTimeMs = targetData.seedTimeMs;

    targetData.athleteId = tempAthleteId;
    targetData.seedTime = tempSeed;
    targetData.seedTimeMs = tempSeedMs;
  } else {
    // Target lane is empty: move
    const [moved] = sourceHeatObj.lanes.splice(sourceLaneIdx, 1);
    moved.heatNumber = toHeat;
    moved.laneNumber = toLane;
    targetHeatObj.lanes.push(moved);
    targetHeatObj.lanes.sort((a, b) => a.laneNumber - b.laneNumber);
  }

  return newHeats;
}
