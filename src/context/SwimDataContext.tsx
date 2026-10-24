/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  AppUserRole, 
  Athlete, 
  BestSwimmer, 
  ChampionshipInfo, 
  Club, 
  ClubMedalTally, 
  Heat, 
  IncidentReport, 
  LaneAllocation, 
  OfficialMinutes, 
  SwimEvent, 
  SwimmerStatus 
} from '../types/swim';
import { 
  INITIAL_ATHLETES, 
  INITIAL_CHAMPIONSHIP, 
  INITIAL_CLUBS, 
  INITIAL_EVENTS, 
  INITIAL_INCIDENTS, 
  INITIAL_OFFICIAL_MINUTES 
} from '../data/sampleData';
import { autoSeedEvent, manualLaneReassign } from '../utils/seeding';
import { calculateBestSwimmers, calculateClubMedalTally, calculateEventResults } from '../utils/scoring';
import { calculateAge, determineAgeGroup, generateRegisterNumber, parseTimeToMs } from '../utils/timeUtils';

const STORAGE_KEY = 'swimrace_manager_state_v1';

export type ActiveTab = 
  | 'dashboard' 
  | 'athletes' 
  | 'events' 
  | 'entry_list'
  | 'nomor_list'
  | 'seeding' 
  | 'timekeeper' 
  | 'results' 
  | 'buku_acara'
  | 'scoreboard'
  | 'settings'
  | 'minutes';

export type PrintDocumentType = 
  | 'entry_list'
  | 'nomor_list'
  | 'start_list' 
  | 'start_list_all'
  | 'result_sheet' 
  | 'medal_tally' 
  | 'best_swimmer' 
  | 'official_minutes'
  | null;

interface SwimDataContextType {
  // Navigation & Role
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userRole: AppUserRole;
  setUserRole: (role: AppUserRole) => void;
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  
  // Print Modal
  activePrintDoc: PrintDocumentType;
  openPrintModal: (docType: PrintDocumentType, targetEventId?: string, targetClubId?: string) => void;
  closePrintModal: () => void;
  printTargetEventId: string | null;
  printTargetClubId: string | null;
  setPrintTargetClubId: (clubId: string | null) => void;

  // Data
  championship: ChampionshipInfo;
  updateChampionship: (info: Partial<ChampionshipInfo>) => void;
  clubs: Club[];
  athletes: Athlete[];
  events: SwimEvent[];
  incidents: IncidentReport[];
  officialMinutes: OfficialMinutes;

  // Club & Athlete Operations
  addClub: (club: Omit<Club, 'id'>) => void;
  deleteClub: (id: string) => void;
  addAthlete: (athleteData: {
    nik?: string;
    regNumber?: string;
    name: string;
    gender: 'MALE' | 'FEMALE';
    birthDate: string;
    clubId: string;
    registeredEvents?: { eventId: string; seedTime: string }[];
  }) => void;
  updateAthlete: (id: string, updates: Partial<Athlete>) => void;
  deleteAthlete: (id: string) => void;
  importBulkAthletes: (newRows: {
    nik?: string;
    regNumber?: string;
    name: string;
    gender: 'MALE' | 'FEMALE';
    birthDate: string;
    clubCode?: string;
    clubName?: string;
    eventNumbers?: number[];
    seedTimes?: Record<number, string>;
  }[]) => { count: number; newClubsCount: number };

  // Event Operations
  addEvent: (eventData: Omit<SwimEvent, 'id' | 'heats' | 'status'>) => void;
  updateEvent: (id: string, updates: Partial<SwimEvent>) => void;
  deleteEvent: (id: string) => void;
  
  // Seeding Operations
  runAutoSeedingForEvent: (eventId: string) => void;
  runAutoSeedingForAllEvents: () => void;
  reassignLane: (eventId: string, fromHeat: number, fromLane: number, toHeat: number, toLane: number) => void;

  // Timekeeper & Results Operations
  saveHeatResults: (
    eventId: string, 
    heatNumber: number, 
    laneResults: {
      laneNumber: number;
      finalTime: string | null;
      status: SwimmerStatus;
      dqReason?: string | null;
      dqRuleCode?: string | null;
    }[]
  ) => void;

  // Official Minutes & Incidents
  addIncident: (incident: Omit<IncidentReport, 'id' | 'timestamp'>) => void;
  deleteIncident: (id: string) => void;
  updateOfficialMinutes: (updates: Partial<OfficialMinutes>) => void;

  // Computed Aggregations
  clubMedalTally: ClubMedalTally[];
  bestSwimmers: BestSwimmer[];
  recordBreakers: { eventTitle: string; athleteName: string; clubName: string; oldRecord: string; newTime: string }[];

  // Data persistence
  resetToDefaultData: () => void;
  exportDatabaseJSON: () => void;
  importDatabaseJSON: (jsonString: string) => boolean;
}

const SwimDataContext = createContext<SwimDataContextType | undefined>(undefined);

export const SwimDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [userRole, setUserRole] = useState<AppUserRole>('TECHNICAL_DELEGATE');
  const [selectedEventId, setSelectedEventId] = useState<string | null>('evt-101');
  const [activePrintDoc, setActivePrintDoc] = useState<PrintDocumentType>(null);
  const [printTargetEventId, setPrintTargetEventId] = useState<string | null>(null);
  const [printTargetClubId, setPrintTargetClubId] = useState<string | null>(null);

  // Core Data States
  const [championship, setChampionship] = useState<ChampionshipInfo>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_championship`);
    return saved ? { ...INITIAL_CHAMPIONSHIP, ...JSON.parse(saved) } : INITIAL_CHAMPIONSHIP;
  });

  const [clubs, setClubs] = useState<Club[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_clubs`);
    if (!saved) return INITIAL_CLUBS;
    const list: Club[] = JSON.parse(saved);
    INITIAL_CLUBS.forEach(ic => {
      if (!list.some(c => c.id === ic.id)) {
        list.push(ic);
      }
    });
    return list;
  });

  const [athletes, setAthletes] = useState<Athlete[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_athletes`);
    const list: Athlete[] = saved ? JSON.parse(saved) : INITIAL_ATHLETES;
    INITIAL_ATHLETES.forEach(ia => {
      if (!list.some(a => a.id === ia.id)) {
        list.push(ia);
      }
    });
    return list.map((a, idx) => ({
      ...a,
      regNumber: a.regNumber || generateRegisterNumber(a.name, idx + 1),
    }));
  });

  const [events, setEvents] = useState<SwimEvent[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_events`);
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });

  const [incidents, setIncidents] = useState<IncidentReport[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_incidents`);
    return saved ? JSON.parse(saved) : INITIAL_INCIDENTS;
  });

  const [officialMinutes, setOfficialMinutes] = useState<OfficialMinutes>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_minutes`);
    return saved ? JSON.parse(saved) : INITIAL_OFFICIAL_MINUTES;
  });

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_championship`, JSON.stringify(championship));
  }, [championship]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_clubs`, JSON.stringify(clubs));
  }, [clubs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_athletes`, JSON.stringify(athletes));
  }, [athletes]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_events`, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_incidents`, JSON.stringify(incidents));
  }, [incidents]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_minutes`, JSON.stringify(officialMinutes));
  }, [officialMinutes]);

  const openPrintModal = (docType: PrintDocumentType, targetEventId?: string, targetClubId?: string) => {
    setActivePrintDoc(docType);
    setPrintTargetEventId(targetEventId || selectedEventId || events[0]?.id || null);
    if (targetClubId !== undefined) {
      setPrintTargetClubId(targetClubId || null);
    }
  };

  const closePrintModal = () => {
    setActivePrintDoc(null);
    setPrintTargetEventId(null);
    setPrintTargetClubId(null);
  };

  const updateChampionship = (info: Partial<ChampionshipInfo>) => {
    setChampionship(prev => ({ ...prev, ...info }));
  };

  // Club Operations
  const addClub = (clubData: Omit<Club, 'id'>) => {
    const newClub: Club = {
      ...clubData,
      id: `club-${Date.now()}`,
    };
    setClubs(prev => [...prev, newClub]);
  };

  const deleteClub = (id: string) => {
    setClubs(prev => prev.filter(c => c.id !== id));
  };

  // Athlete Operations
  const addAthlete = (data: {
    nik?: string;
    regNumber?: string;
    name: string;
    gender: 'MALE' | 'FEMALE';
    birthDate: string;
    clubId: string;
    registeredEvents?: { eventId: string; seedTime: string }[];
  }) => {
    const age = calculateAge(data.birthDate, championship.cutoffDate);
    const ageGroup = determineAgeGroup(age);

    const regEvents = (data.registeredEvents || []).map(r => ({
      eventId: r.eventId,
      seedTime: r.seedTime || '00:00.00',
      seedTimeMs: parseTimeToMs(r.seedTime),
    }));

    const regNumber = data.regNumber || generateRegisterNumber(data.name, athletes.length + 1);

    const newAthlete: Athlete = {
      id: `ath-${Date.now()}`,
      regNumber,
      nik: data.nik || regNumber,
      name: data.name,
      gender: data.gender,
      birthDate: data.birthDate,
      clubId: data.clubId,
      age,
      ageGroup,
      registeredEvents: regEvents,
    };

    setAthletes(prev => [...prev, newAthlete]);
  };

  const updateAthlete = (id: string, updates: Partial<Athlete>) => {
    setAthletes(prev => prev.map(a => {
      if (a.id !== id) return a;
      const updated = { ...a, ...updates };
      if (updates.birthDate) {
        updated.age = calculateAge(updates.birthDate, championship.cutoffDate);
        updated.ageGroup = determineAgeGroup(updated.age);
      }
      return updated;
    }));
  };

  const deleteAthlete = (id: string) => {
    setAthletes(prev => prev.filter(a => a.id !== id));
  };

  const importBulkAthletes = (newRows: {
    nik?: string;
    regNumber?: string;
    name: string;
    gender: 'MALE' | 'FEMALE';
    birthDate: string;
    clubCode?: string;
    clubName?: string;
    eventNumbers?: number[];
    seedTimes?: Record<number, string>;
  }[]) => {
    let newClubsCreated = 0;
    const currentClubs = [...clubs];
    const clubCodeMap = new Map<string, Club>();
    currentClubs.forEach(c => {
      clubCodeMap.set(c.code.toUpperCase(), c);
      clubCodeMap.set(c.name.toLowerCase(), c);
    });

    const getOrCreateClub = (code?: string, name?: string): string => {
      const cleanCode = (code || 'IND').toUpperCase().trim();
      const cleanName = (name || cleanCode).trim();
      
      if (clubCodeMap.has(cleanCode)) {
        return clubCodeMap.get(cleanCode)!.id;
      }
      if (clubCodeMap.has(cleanName.toLowerCase())) {
        return clubCodeMap.get(cleanName.toLowerCase())!.id;
      }

      const newClubId = `club-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newClub: Club = {
        id: newClubId,
        code: cleanCode,
        name: cleanName,
        city: 'Indonesia',
        province: 'Indonesia',
        coach: '-',
        contactNumber: '-',
      };
      currentClubs.push(newClub);
      clubCodeMap.set(cleanCode, newClub);
      clubCodeMap.set(cleanName.toLowerCase(), newClub);
      newClubsCreated++;
      return newClubId;
    };

    let athletesImported = 0;
    const currentAthletes = [...athletes];

    newRows.forEach((row, idx) => {
      if (!row.name || !row.name.trim()) return;

      const clubId = getOrCreateClub(row.clubCode, row.clubName);
      const birthDate = row.birthDate || '2010-01-01';
      const age = calculateAge(birthDate, championship.cutoffDate);
      const ageGroup = determineAgeGroup(age);

      const registeredEvents: { eventId: string; seedTime: string; seedTimeMs: number }[] = [];
      if (row.eventNumbers && row.eventNumbers.length > 0) {
        row.eventNumbers.forEach(evNum => {
          const matchEv = events.find(e => e.eventNumber === evNum);
          if (matchEv) {
            const seed = (row.seedTimes && row.seedTimes[evNum]) || '00:00.00';
            registeredEvents.push({
              eventId: matchEv.id,
              seedTime: seed,
              seedTimeMs: parseTimeToMs(seed),
            });
          }
        });
      }

      const regNum = row.regNumber || generateRegisterNumber(row.name, currentAthletes.length + idx + 1);
      const cleanNik = row.nik ? row.nik.trim() : regNum;
      const existingIdx = currentAthletes.findIndex(a => 
        (a.regNumber && a.regNumber.toUpperCase() === regNum.toUpperCase()) || 
        (a.nik && a.nik === cleanNik) ||
        (a.name.toLowerCase().trim() === row.name.toLowerCase().trim() && a.birthDate === birthDate)
      );

      if (existingIdx !== -1) {
        const existing = currentAthletes[existingIdx];
        const mergedEvents = [...existing.registeredEvents];
        registeredEvents.forEach(r => {
          if (!mergedEvents.some(m => m.eventId === r.eventId)) {
            mergedEvents.push(r);
          }
        });

        currentAthletes[existingIdx] = {
          ...existing,
          regNumber: existing.regNumber || regNum,
          name: row.name.trim(),
          gender: row.gender,
          birthDate,
          clubId,
          age,
          ageGroup,
          registeredEvents: mergedEvents,
        };
      } else {
        const newAth: Athlete = {
          id: `ath-${Date.now()}-${idx}`,
          regNumber: regNum,
          nik: cleanNik,
          name: row.name.trim(),
          gender: row.gender,
          birthDate,
          clubId,
          age,
          ageGroup,
          registeredEvents,
        };
        currentAthletes.push(newAth);
      }

      athletesImported++;
    });

    setClubs(currentClubs);
    setAthletes(currentAthletes);

    return { count: athletesImported, newClubsCount: newClubsCreated };
  };

  // Event Operations
  const addEvent = (eventData: Omit<SwimEvent, 'id' | 'heats' | 'status'>) => {
    const newEvent: SwimEvent = {
      ...eventData,
      id: `evt-${Date.now()}`,
      heats: [],
      status: 'NOT_SEEDED',
    };
    setEvents(prev => [...prev, newEvent].sort((a, b) => a.eventNumber - b.eventNumber));
  };

  const updateEvent = (id: string, updates: Partial<SwimEvent>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  // Seeding Operations
  const runAutoSeedingForEvent = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    // Find all athletes registered for this event
    const entries = athletes
      .filter(a => a.registeredEvents.some(r => r.eventId === eventId))
      .map(athlete => {
        const reg = athlete.registeredEvents.find(r => r.eventId === eventId);
        return {
          athlete,
          seedTime: reg?.seedTime || 'NT',
          seedTimeMs: reg?.seedTimeMs || 0,
        };
      });

    const heats = autoSeedEvent(
      event, 
      entries, 
      championship.poolLanes, 
      championship.activeLanes, 
      championship.customLaneOrder
    );

    setEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        return {
          ...e,
          heats,
          status: heats.length > 0 ? 'SEEDED' : 'NOT_SEEDED',
        };
      }
      return e;
    }));
  };

  const runAutoSeedingForAllEvents = () => {
    setEvents(prev => prev.map(event => {
      const entries = athletes
        .filter(a => a.registeredEvents.some(r => r.eventId === event.id))
        .map(athlete => {
          const reg = athlete.registeredEvents.find(r => r.eventId === event.id);
          return {
            athlete,
            seedTime: reg?.seedTime || 'NT',
            seedTimeMs: reg?.seedTimeMs || 0,
          };
        });

      const heats = autoSeedEvent(
        event, 
        entries, 
        championship.poolLanes, 
        championship.activeLanes, 
        championship.customLaneOrder
      );
      return {
        ...event,
        heats,
        status: heats.length > 0 ? (event.status === 'COMPLETED' ? 'COMPLETED' : 'SEEDED') : 'NOT_SEEDED',
      };
    }));
  };

  const reassignLane = (
    eventId: string, 
    fromHeat: number, 
    fromLane: number, 
    toHeat: number, 
    toLane: number
  ) => {
    setEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        const updatedHeats = manualLaneReassign(e.heats, fromHeat, fromLane, toHeat, toLane);
        return {
          ...e,
          heats: updatedHeats,
        };
      }
      return e;
    }));
  };

  // Timekeeper Operations
  const saveHeatResults = (
    eventId: string,
    heatNumber: number,
    laneResults: {
      laneNumber: number;
      finalTime: string | null;
      status: SwimmerStatus;
      dqReason?: string | null;
      dqRuleCode?: string | null;
    }[]
  ) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const clonedHeats = JSON.parse(JSON.stringify(event.heats)) as Heat[];
    const targetHeat = clonedHeats.find(h => h.heatNumber === heatNumber);
    if (!targetHeat) return;

    // Update lane results in target heat
    laneResults.forEach(res => {
      const lane = targetHeat.lanes.find(l => l.laneNumber === res.laneNumber);
      if (lane) {
        lane.finalTime = res.finalTime;
        lane.finalTimeMs = parseTimeToMs(res.finalTime);
        lane.status = res.status;
        lane.dqReason = res.dqReason || null;
        lane.dqRuleCode = res.dqRuleCode || null;

        // If DQ, also auto-add an incident record if rule code provided and not already present
        if (res.status === 'DQ' && res.dqRuleCode) {
          const athlete = athletes.find(a => a.id === lane.athleteId);
          const club = clubs.find(c => c.id === athlete?.clubId);
          const existingIncident = incidents.find(
            inc => inc.eventNumber === event.eventNumber && inc.heatNumber === heatNumber && inc.laneNumber === res.laneNumber
          );
          if (!existingIncident && athlete) {
            const newInc: IncidentReport = {
              id: `inc-${Date.now()}-${res.laneNumber}`,
              timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
              eventNumber: event.eventNumber,
              eventTitle: event.title,
              heatNumber,
              laneNumber: res.laneNumber,
              athleteName: athlete.name,
              clubName: club?.name || 'Independen',
              ruleCode: res.dqRuleCode,
              reason: res.dqReason || 'Pelanggaran aturan gaya World Aquatics',
              refereeDecision: `Diskualifikasi (DQ) disahkan berdasarkan laporan Juri Lintasan ${res.laneNumber}`,
              signedByRef: true,
            };
            setIncidents(prevInc => [newInc, ...prevInc]);
          }
        }
      }
    });

    // Run scoring calculation across all heats in this event
    const updatedEventObject = {
      ...event,
      heats: clonedHeats,
    };

    const { updatedHeats, isCompleted } = calculateEventResults(updatedEventObject);

    setEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        return {
          ...e,
          heats: updatedHeats,
          status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
        };
      }
      return e;
    }));
  };

  // Official Minutes
  const addIncident = (incident: Omit<IncidentReport, 'id' | 'timestamp'>) => {
    const newInc: IncidentReport = {
      ...incident,
      id: `inc-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };
    setIncidents(prev => [newInc, ...prev]);
  };

  const deleteIncident = (id: string) => {
    setIncidents(prev => prev.filter(i => i.id !== id));
  };

  const updateOfficialMinutes = (updates: Partial<OfficialMinutes>) => {
    setOfficialMinutes(prev => ({ ...prev, ...updates }));
  };

  // Computations
  const clubMedalTally = useMemo(() => {
    return calculateClubMedalTally(clubs, events, athletes);
  }, [clubs, events, athletes]);

  const bestSwimmers = useMemo(() => {
    return calculateBestSwimmers(athletes, events, clubs);
  }, [athletes, events, clubs]);

  const recordBreakers = useMemo(() => {
    const list: { eventTitle: string; athleteName: string; clubName: string; oldRecord: string; newTime: string }[] = [];
    const athleteMap = new Map(athletes.map(a => [a.id, a]));
    const clubMap = new Map(clubs.map(c => [c.id, c]));

    events.forEach(evt => {
      evt.heats.forEach(h => {
        h.lanes.forEach(l => {
          if (l.isNewRecord && l.finalTime && evt.meetRecord) {
            const ath = athleteMap.get(l.athleteId);
            const clb = ath ? clubMap.get(ath.clubId) : undefined;
            list.push({
              eventTitle: evt.title,
              athleteName: ath ? ath.name : 'Unknown Swimmer',
              clubName: clb ? clb.name : 'Independen',
              oldRecord: evt.meetRecord.time,
              newTime: l.finalTime,
            });
          }
        });
      });
    });
    return list;
  }, [events, athletes, clubs]);

  // Reset to default data
  const resetToDefaultData = () => {
    setChampionship(INITIAL_CHAMPIONSHIP);
    setClubs(INITIAL_CLUBS);
    setAthletes(INITIAL_ATHLETES);
    setEvents(INITIAL_EVENTS);
    setIncidents(INITIAL_INCIDENTS);
    setOfficialMinutes(INITIAL_OFFICIAL_MINUTES);
    setSelectedEventId('evt-101');
    localStorage.removeItem(`${STORAGE_KEY}_championship`);
    localStorage.removeItem(`${STORAGE_KEY}_clubs`);
    localStorage.removeItem(`${STORAGE_KEY}_athletes`);
    localStorage.removeItem(`${STORAGE_KEY}_events`);
    localStorage.removeItem(`${STORAGE_KEY}_incidents`);
    localStorage.removeItem(`${STORAGE_KEY}_minutes`);
  };

  const exportDatabaseJSON = () => {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      championship,
      clubs,
      athletes,
      events,
      incidents,
      officialMinutes,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SwimRace_${championship.name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDatabaseJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.championship && Array.isArray(data.athletes) && Array.isArray(data.events)) {
        setChampionship(data.championship);
        setClubs(data.clubs || []);
        setAthletes(data.athletes || []);
        setEvents(data.events || []);
        setIncidents(data.incidents || []);
        setOfficialMinutes(data.officialMinutes || INITIAL_OFFICIAL_MINUTES);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <SwimDataContext.Provider
      value={{
        activeTab,
        setActiveTab,
        userRole,
        setUserRole,
        selectedEventId,
        setSelectedEventId,
        activePrintDoc,
        openPrintModal,
        closePrintModal,
        printTargetEventId,
        printTargetClubId,
        setPrintTargetClubId,
        championship,
        updateChampionship,
        clubs,
        athletes,
        events,
        incidents,
        officialMinutes,
        addClub,
        deleteClub,
        addAthlete,
        updateAthlete,
        deleteAthlete,
        importBulkAthletes,
        addEvent,
        updateEvent,
        deleteEvent,
        runAutoSeedingForEvent,
        runAutoSeedingForAllEvents,
        reassignLane,
        saveHeatResults,
        addIncident,
        deleteIncident,
        updateOfficialMinutes,
        clubMedalTally,
        bestSwimmers,
        recordBreakers,
        resetToDefaultData,
        exportDatabaseJSON,
        importDatabaseJSON,
      }}
    >
      {children}
    </SwimDataContext.Provider>
  );
};

export const useSwimData = () => {
  const context = useContext(SwimDataContext);
  if (!context) {
    throw new Error('useSwimData must be used within a SwimDataProvider');
  }
  return context;
};
