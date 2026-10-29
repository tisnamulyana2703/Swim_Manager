/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Gender = 'MALE' | 'FEMALE' | 'MIXED';

export type Stroke = 
  | 'FREESTYLE' 
  | 'BACKSTROKE' 
  | 'BREASTSTROKE' 
  | 'BUTTERFLY' 
  | 'INDIVIDUAL_MEDLEY' 
  | 'RELAY_FREESTYLE' 
  | 'RELAY_MEDLEY';

export type AgeGroupCode = 
  | 'AGE_6_UNDER' 
  | 'AGE_7' 
  | 'AGE_8' 
  | 'AGE_9' 
  | 'AGE_10' 
  | 'AGE_11' 
  | 'AGE_12' 
  | 'AGE_13' 
  | 'AGE_14' 
  | 'AGE_15' 
  | 'AGE_16_18' 
  | 'AGE_19_ABOVE' 
  | 'AGE_14_ABOVE'
  | 'OPEN'
  // Legacy aliases for backwards compatibility
  | 'SENIOR' 
  | 'KU_I' 
  | 'KU_II' 
  | 'KU_III' 
  | 'KU_IV' 
  | 'KU_V';

export interface AgeGroupConfig {
  code: AgeGroupCode;
  name: string;
  minAge: number;
  maxAge: number;
  description: string;
}

export interface Club {
  id: string;
  code: string;
  name: string;
  city: string;
  province: string;
  coach: string;
  contactNumber: string;
}

export interface Athlete {
  id: string;
  regNumber?: string; // Nomor register otomatis sistem
  nik?: string; // Optional legacy / identitas kependudukan
  name: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string; // YYYY-MM-DD
  clubId: string;
  age: number;
  ageGroup: AgeGroupCode;
  registeredEvents: {
    eventId: string;
    seedTime: string; // "00:26.45"
    seedTimeMs: number;
  }[];
}

export type EventRound = 'TIMED_FINAL' | 'PRELIM' | 'FINAL';
export type EventStatus = 'NOT_SEEDED' | 'SEEDED' | 'IN_PROGRESS' | 'COMPLETED';
export type SwimmerStatus = 'OK' | 'DQ' | 'DNS' | 'DNF' | 'PENDING';

export interface MeetRecord {
  time: string;
  timeMs: number;
  holder: string;
  club: string;
  year: number;
}

export interface LaneAllocation {
  heatNumber: number;
  laneNumber: number;
  athleteId: string;
  seedTime: string;
  seedTimeMs: number;
  finalTime: string | null;
  finalTimeMs: number | null;
  status: SwimmerStatus;
  dqReason?: string | null;
  dqRuleCode?: string | null;
  reactionTime?: string | null;
  rankInHeat?: number | null;
  rankInEvent?: number | null;
  points?: number;
  isNewRecord?: boolean;
}

export interface Heat {
  heatNumber: number;
  isCompleted: boolean;
  lanes: LaneAllocation[];
}

export interface SwimEvent {
  id: string;
  eventNumber: number;
  title: string;
  distance: number; // 50, 100, 200, 400, 800, 1500
  stroke: Stroke;
  gender: Gender;
  ageGroup: AgeGroupCode;
  round: EventRound;
  session: number; // Sesi 1 (Pagi), Sesi 2 (Sore), dst.
  status: EventStatus;
  nationalRecord?: MeetRecord;
  meetRecord?: MeetRecord;
  heats: Heat[];
}

export interface DQViolation {
  id: string;
  ruleCode: string;
  title: string;
  description: string;
  stroke?: Stroke | 'GENERAL';
}

export interface IncidentReport {
  id: string;
  timestamp: string;
  eventNumber: number;
  eventTitle: string;
  heatNumber: number;
  laneNumber: number;
  athleteName: string;
  clubName: string;
  ruleCode: string;
  reason: string;
  refereeDecision: string;
  signedByRef: boolean;
}

export interface LaneDetailConfig {
  laneNumber: number;
  isActive: boolean;
  timekeeperName?: string;
  touchpadStatus?: 'OK' | 'BACKUP_ONLY' | 'OFFLINE';
  backupWatches?: number;
  customRopeColor?: string;
  notes?: string;
}

export type LaneSeedingMode = 'STANDARD_SPEARHEAD' | 'CENTER_TO_OUTWARD' | 'ASCENDING' | 'CUSTOM';

export interface ChampionshipInfo {
  id: string;
  name: string;
  subTitle: string;
  venue: string;
  poolLength: '50m' | '25m';
  poolLanes: 6 | 8 | 10;
  startDate: string;
  endDate: string;
  cutoffDate: string; // Date used to calculate age group
  organizer: string;
  city: string;
  technicalDelegate: string;
  referee: string;
  chiefJudge: string;
  chiefRecorder: string;
  starter?: string;
  chiefTimekeeper?: string;
  strokeJudge?: string;
  turnJudge?: string;
  clerkOfCourse?: string;
  announcer?: string;
  timingDeviceType?: 'AUTOMATIC_TOUCHPAD' | 'SEMI_AUTOMATIC' | 'MANUAL_STOPWATCH';
  timingBrand?: string;
  // Pengaturan Khusus Lintasan Kolam
  activeLanes?: number[];
  laneWidthMeters?: number;
  laneSeedingMode?: LaneSeedingMode;
  customLaneOrder?: number[];
  laneDetails?: Record<number, LaneDetailConfig>;
  officialMinutesNumber: string;
  officialNotes: string;
  isLocked: boolean;
}

export interface OfficialMinutes {
  docNumber: string;
  generatedDate: string;
  signedTD: boolean;
  signedReferee: boolean;
  signedChiefJudge: boolean;
  signedRecorder: boolean;
  weatherNotes: string;
  waterTemp: string;
  generalNotes: string;
}

export type AppUserRole = 'TECHNICAL_DELEGATE' | 'TIMEKEEPER_OPERATOR' | 'CLUB_OFFICIAL' | 'PUBLIC_SPECTATOR';

export interface ClubMedalTally {
  clubId: string;
  clubCode: string;
  clubName: string;
  city: string;
  gold: number;
  silver: number;
  bronze: number;
  totalMedals: number;
  points: number;
  rank: number;
}

export interface BestSwimmer {
  athleteId: string;
  athleteName: string;
  clubName: string;
  gender: Gender;
  ageGroup: AgeGroupCode;
  gold: number;
  silver: number;
  bronze: number;
  totalMedals: number;
  totalPoints: number;
  recordsBroken: number;
}
