/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSwimData } from '../context/SwimDataContext';
import { SwimmerStatus } from '../types/swim';
import { OFFICIAL_DQ_RULES, formatMsToTime, parseTimeToMs, splitTimeComponents, combineTimeComponents } from '../utils/timeUtils';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  AlertTriangle, 
  Save, 
  Timer, 
  X, 
  Sparkles,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

export const TimekeeperView: React.FC = () => {
  const { 
    events, 
    athletes, 
    clubs, 
    championship,
    selectedEventId, 
    setSelectedEventId, 
    saveHeatResults, 
    setActiveTab, 
    openPrintModal 
  } = useSwimData();

  const currentEvent = events.find(e => e.id === selectedEventId) || events[0];
  const [selectedHeatNumber, setSelectedHeatNumber] = useState<number>(1);

  // Form states per lane for current heat
  const [laneTimes, setLaneTimes] = useState<Record<number, string>>({});
  const [laneMin, setLaneMin] = useState<Record<number, string>>({});
  const [laneSec, setLaneSec] = useState<Record<number, string>>({});
  const [laneCenti, setLaneCenti] = useState<Record<number, string>>({});
  const [laneStatuses, setLaneStatuses] = useState<Record<number, SwimmerStatus>>({});
  const [laneDQRules, setLaneDQRules] = useState<Record<number, string>>({});
  const [laneDQReasons, setLaneDQReasons] = useState<Record<number, string>>({});

  // Input refs for auto-advance
  const minInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const secInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const centiInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // DQ Modal state
  const [activeDQLane, setActiveDQLane] = useState<number | null>(null);

  // Digital Stopwatch Simulator
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchTimeMs, setStopwatchTimeMs] = useState(0);
  const stopwatchRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const athleteMap = new Map(athletes.map(a => [a.id, a]));
  const clubMap = new Map(clubs.map(c => [c.id, c]));

  const currentHeat = currentEvent?.heats.find(h => h.heatNumber === selectedHeatNumber) || currentEvent?.heats[0];

  // Initialize form state when event or heat changes
  useEffect(() => {
    if (!currentHeat) return;
    const initialTimes: Record<number, string> = {};
    const initialMin: Record<number, string> = {};
    const initialSec: Record<number, string> = {};
    const initialCenti: Record<number, string> = {};
    const initialStatuses: Record<number, SwimmerStatus> = {};
    const initialRules: Record<number, string> = {};
    const initialReasons: Record<number, string> = {};

    currentHeat.lanes.forEach(lane => {
      const timeVal = lane.finalTime || '';
      initialTimes[lane.laneNumber] = timeVal;

      const parts = splitTimeComponents(timeVal);
      initialMin[lane.laneNumber] = parts.minutes;
      initialSec[lane.laneNumber] = parts.seconds;
      initialCenti[lane.laneNumber] = parts.centiseconds;

      initialStatuses[lane.laneNumber] = lane.status === 'PENDING' ? 'OK' : lane.status;
      if (lane.dqRuleCode) initialRules[lane.laneNumber] = lane.dqRuleCode;
      if (lane.dqReason) initialReasons[lane.laneNumber] = lane.dqReason;
    });

    setLaneTimes(initialTimes);
    setLaneMin(initialMin);
    setLaneSec(initialSec);
    setLaneCenti(initialCenti);
    setLaneStatuses(initialStatuses);
    setLaneDQRules(initialRules);
    setLaneDQReasons(initialReasons);
  }, [currentEvent?.id, selectedHeatNumber]);

  // Stopwatch timer interval
  useEffect(() => {
    if (stopwatchRunning) {
      startTimeRef.current = performance.now() - stopwatchTimeMs;
      const interval = window.setInterval(() => {
        setStopwatchTimeMs(Math.round(performance.now() - startTimeRef.current));
      }, 10);
      stopwatchRef.current = interval;
    } else {
      if (stopwatchRef.current) {
        window.clearInterval(stopwatchRef.current);
      }
    }
    return () => {
      if (stopwatchRef.current) window.clearInterval(stopwatchRef.current);
    };
  }, [stopwatchRunning]);

  if (!currentEvent) {
    return <div className="p-8 text-center text-slate-400">Tidak ada nomor lomba.</div>;
  }

  const handleStartStopwatch = () => {
    setStopwatchRunning(true);
  };

  const handlePauseStopwatch = () => {
    setStopwatchRunning(false);
  };

  const handleResetStopwatch = () => {
    setStopwatchRunning(false);
    setStopwatchTimeMs(0);
  };

  // Synchronize split inputs to laneTimes and status
  const updateCombinedTime = (laneNumber: number, m: string, s: string, c: string) => {
    const combined = combineTimeComponents(m, s, c);
    setLaneTimes(prev => ({ ...prev, [laneNumber]: combined || '' }));
    if (combined && combined.trim()) {
      setLaneStatuses(prev => ({ ...prev, [laneNumber]: 'OK' }));
    }
  };

  const handleMinChange = (laneNumber: number, val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 2);
    setLaneMin(prev => ({ ...prev, [laneNumber]: digits }));
    updateCombinedTime(laneNumber, digits, laneSec[laneNumber] || '', laneCenti[laneNumber] || '');

    // Auto-advance to Detik if 2 digits entered
    if (digits.length === 2) {
      secInputRefs.current[laneNumber]?.focus();
    }
  };

  const handleSecChange = (laneNumber: number, val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 2);
    setLaneSec(prev => ({ ...prev, [laneNumber]: digits }));
    updateCombinedTime(laneNumber, laneMin[laneNumber] || '', digits, laneCenti[laneNumber] || '');

    // Auto-advance to Centiseconds if 2 digits entered
    if (digits.length === 2) {
      centiInputRefs.current[laneNumber]?.focus();
    }
  };

  const handleCentiChange = (laneNumber: number, val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 2);
    setLaneCenti(prev => ({ ...prev, [laneNumber]: digits }));
    updateCombinedTime(laneNumber, laneMin[laneNumber] || '', laneSec[laneNumber] || '', digits);
  };

  const handleClearLaneTime = (laneNumber: number) => {
    setLaneMin(prev => ({ ...prev, [laneNumber]: '' }));
    setLaneSec(prev => ({ ...prev, [laneNumber]: '' }));
    setLaneCenti(prev => ({ ...prev, [laneNumber]: '' }));
    setLaneTimes(prev => ({ ...prev, [laneNumber]: '' }));
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    laneNumber: number,
    field: 'min' | 'sec' | 'centi'
  ) => {
    if (e.key === 'Backspace') {
      if (field === 'sec' && !laneSec[laneNumber]) {
        minInputRefs.current[laneNumber]?.focus();
      } else if (field === 'centi' && !laneCenti[laneNumber]) {
        secInputRefs.current[laneNumber]?.focus();
      }
    } else if (e.key === 'ArrowRight') {
      if (field === 'min') secInputRefs.current[laneNumber]?.focus();
      else if (field === 'sec') centiInputRefs.current[laneNumber]?.focus();
    } else if (e.key === 'ArrowLeft') {
      if (field === 'centi') secInputRefs.current[laneNumber]?.focus();
      else if (field === 'sec') minInputRefs.current[laneNumber]?.focus();
    }
  };

  const handleCaptureLaneTouch = (laneNumber: number) => {
    if (stopwatchTimeMs > 0) {
      const formatted = formatMsToTime(stopwatchTimeMs);
      const parts = splitTimeComponents(formatted);
      setLaneMin(prev => ({ ...prev, [laneNumber]: parts.minutes }));
      setLaneSec(prev => ({ ...prev, [laneNumber]: parts.seconds }));
      setLaneCenti(prev => ({ ...prev, [laneNumber]: parts.centiseconds }));
      setLaneTimes(prev => ({ ...prev, [laneNumber]: formatted }));
      setLaneStatuses(prev => ({ ...prev, [laneNumber]: 'OK' }));
    }
  };

  const handleSaveAll = () => {
    if (!currentHeat) return;

    const payload = currentHeat.lanes.map(lane => {
      const timeVal = laneTimes[lane.laneNumber] || null;
      const statusVal = laneStatuses[lane.laneNumber] || 'PENDING';
      const dqRule = laneDQRules[lane.laneNumber] || null;
      const dqReason = laneDQReasons[lane.laneNumber] || null;

      return {
        laneNumber: lane.laneNumber,
        finalTime: statusVal === 'OK' && timeVal ? timeVal : null,
        status: timeVal || statusVal !== 'PENDING' ? statusVal : 'PENDING',
        dqRuleCode: statusVal === 'DQ' ? dqRule : null,
        dqReason: statusVal === 'DQ' ? dqReason : null,
      };
    });

    saveHeatResults(currentEvent.id, selectedHeatNumber, payload);
    alert(`Hasil Heat ${selectedHeatNumber} berhasil disimpan & dihitung!`);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Pencatatan & Input Waktu Hasil (Timekeeper Station)
          </h1>
          <p className="text-xs text-slate-500">
            Perekaman waktu finis, sentuhan touch-pad, dan verifikasi status DQ / DNS / DNF
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={currentEvent.id}
            onChange={e => {
              setSelectedEventId(e.target.value);
              setSelectedHeatNumber(1);
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500 max-w-xs truncate"
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>
                #{ev.eventNumber}: {ev.title}
              </option>
            ))}
          </select>

          {currentEvent.heats.length > 1 && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {currentEvent.heats.map(h => (
                <button
                  key={h.heatNumber}
                  onClick={() => setSelectedHeatNumber(h.heatNumber)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    selectedHeatNumber === h.heatNumber
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Heat {h.heatNumber}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleSaveAll}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Hasil Heat</span>
          </button>
        </div>
      </div>

      {/* Multi-Lane Electronic Stopwatch / Manual Timer Simulator */}
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
            Stopwatch Cadangan / Simulator Sentuhan Touchpad
          </span>
          <div className="text-3xl sm:text-4xl font-mono font-extrabold text-white tracking-wider tabular-nums">
            {formatMsToTime(stopwatchTimeMs, true)}
          </div>
          <span className="text-xs text-slate-400">
            Aba-aba start resmi & perekaman sentuhan dinding per lintasan
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!stopwatchRunning ? (
            <button
              onClick={handleStartStopwatch}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Aba-aba Start (Mulai)</span>
            </button>
          ) : (
            <button
              onClick={handlePauseStopwatch}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              <Pause className="w-4 h-4 fill-white" />
              <span>Jeda Timer</span>
            </button>
          )}

          <button
            onClick={handleResetStopwatch}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Lane by Lane Result Input Sheet */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              #{currentEvent.eventNumber}: {currentEvent.title} — Heat {selectedHeatNumber}
            </h2>
            <span className="text-xs text-slate-500">
              Rekor Kejuaraan: {currentEvent.meetRecord ? `${currentEvent.meetRecord.time} (${currentEvent.meetRecord.holder})` : 'Belum tercatat'}
            </span>
          </div>

          <button
            onClick={() => {
              setActiveTab('results');
            }}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            <span>Lihat Klasemen Lengkap</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-16">Lintasan</th>
                <th className="py-3 px-4">Nama Atlet & NIK</th>
                <th className="py-3 px-4">Klub / Kontingen</th>
                <th className="py-3 px-4 font-mono">Seed Time</th>
                <th className="py-3 px-4 font-mono text-center w-56">Waktu Akhir (Menit : Detik . 1/100s)</th>
                <th className="py-3 px-4">Touchpad Capture</th>
                <th className="py-3 px-4">Status & Catatan Pelanggaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentHeat && currentHeat.lanes.length > 0 ? (
                currentHeat.lanes.map(lane => {
                  const athlete = athleteMap.get(lane.athleteId);
                  const club = athlete ? clubMap.get(athlete.clubId) : null;
                  const currentStatus = laneStatuses[lane.laneNumber] || 'PENDING';
                  const dqRule = laneDQRules[lane.laneNumber];

                  return (
                    <tr key={lane.laneNumber} className="hover:bg-slate-50/70 transition-colors">
                      {/* Lane Number & Assigned Timekeeper */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                            {lane.laneNumber}
                          </div>
                          {championship.laneDetails?.[lane.laneNumber]?.timekeeperName && (
                            <div className="hidden sm:block text-[10px] text-slate-500 min-w-0">
                              <span className="font-semibold block truncate max-w-[110px] text-slate-700">
                                {championship.laneDetails[lane.laneNumber].timekeeperName}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">
                                TP: {championship.laneDetails[lane.laneNumber].touchpadStatus || 'OK'}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Swimmer Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{athlete?.name || 'Tanpa Atlet'}</div>
                        <div className="font-mono text-[11px] text-slate-400">{athlete?.nik}</div>
                      </td>

                      {/* Club */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">{club?.code}</span>
                        <span className="block text-[11px] text-slate-400 truncate max-w-[150px]">{club?.name}</span>
                      </td>

                      {/* Seed Time */}
                      <td className="py-3.5 px-4 font-mono text-slate-500 tabular-nums">
                        {lane.seedTime}
                      </td>

                      {/* Separated Final Time Inputs: Menit, Detik, and Centisecond */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1 font-mono">
                          {/* Menit (MM) */}
                          <div className="flex flex-col items-center">
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={2}
                              ref={el => { minInputRefs.current[lane.laneNumber] = el; }}
                              value={laneMin[lane.laneNumber] || ''}
                              disabled={currentStatus !== 'OK'}
                              onChange={e => handleMinChange(lane.laneNumber, e.target.value)}
                              onKeyDown={e => handleKeyDown(e, lane.laneNumber, 'min')}
                              placeholder="00"
                              title="Menit (0-59)"
                              className="w-11 px-1 py-1.5 text-center text-xs font-mono font-bold bg-white border border-slate-300 rounded-md focus:border-sky-500 focus:bg-sky-50/40 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-400 tabular-nums shadow-2xs"
                            />
                            <span className="text-[9px] text-slate-400 font-sans mt-0.5">Menit</span>
                          </div>

                          <span className="font-bold text-slate-400 text-sm pb-3">:</span>

                          {/* Detik (SS) */}
                          <div className="flex flex-col items-center">
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={2}
                              ref={el => { secInputRefs.current[lane.laneNumber] = el; }}
                              value={laneSec[lane.laneNumber] || ''}
                              disabled={currentStatus !== 'OK'}
                              onChange={e => handleSecChange(lane.laneNumber, e.target.value)}
                              onKeyDown={e => handleKeyDown(e, lane.laneNumber, 'sec')}
                              placeholder="25"
                              title="Detik (0-59)"
                              className="w-11 px-1 py-1.5 text-center text-xs font-mono font-bold bg-white border border-slate-300 rounded-md focus:border-sky-500 focus:bg-sky-50/40 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-400 tabular-nums shadow-2xs"
                            />
                            <span className="text-[9px] text-slate-400 font-sans mt-0.5">Detik</span>
                          </div>

                          <span className="font-bold text-slate-400 text-sm pb-3">.</span>

                          {/* Perseratus / Centiseconds (1/100s) */}
                          <div className="flex flex-col items-center">
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={2}
                              ref={el => { centiInputRefs.current[lane.laneNumber] = el; }}
                              value={laneCenti[lane.laneNumber] || ''}
                              disabled={currentStatus !== 'OK'}
                              onChange={e => handleCentiChange(lane.laneNumber, e.target.value)}
                              onKeyDown={e => handleKeyDown(e, lane.laneNumber, 'centi')}
                              placeholder="40"
                              title="Perseratus Detik (0-99)"
                              className="w-11 px-1 py-1.5 text-center text-xs font-mono font-bold bg-white border border-slate-300 rounded-md focus:border-sky-500 focus:bg-sky-50/40 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-400 tabular-nums shadow-2xs"
                            />
                            <span className="text-[9px] text-slate-400 font-sans mt-0.5">1/100s</span>
                          </div>

                          {/* Clear Button */}
                          {(laneMin[lane.laneNumber] || laneSec[lane.laneNumber] || laneCenti[lane.laneNumber]) && currentStatus === 'OK' && (
                            <button
                              type="button"
                              onClick={() => handleClearLaneTime(lane.laneNumber)}
                              className="p-1 text-slate-400 hover:text-rose-600 mb-3.5 transition-colors"
                              title="Kosongkan Waktu"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Touch Pad Capture Button */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleCaptureLaneTouch(lane.laneNumber)}
                          className="px-2.5 py-1 text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-md border border-sky-200 transition-colors cursor-pointer"
                        >
                          Catat Sentuh
                        </button>
                      </td>

                      {/* Status Selector & DQ Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={currentStatus}
                            onChange={e => {
                              const newStatus = e.target.value as SwimmerStatus;
                              setLaneStatuses(prev => ({ ...prev, [lane.laneNumber]: newStatus }));
                              if (newStatus === 'DQ') {
                                setActiveDQLane(lane.laneNumber);
                              }
                            }}
                            className={`px-2 py-1 text-xs font-bold rounded-lg border focus:outline-hidden ${
                              currentStatus === 'OK'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : currentStatus === 'DQ'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : currentStatus === 'DNS' || currentStatus === 'DNF'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            <option value="OK">OK (Sah)</option>
                            <option value="DQ">DQ (Diskualifikasi)</option>
                            <option value="DNS">DNS (Tidak Start)</option>
                            <option value="DNF">DNF (Tidak Selesai)</option>
                            <option value="PENDING">Belum Tanding</option>
                          </select>

                          {currentStatus === 'DQ' && (
                            <button
                              type="button"
                              onClick={() => setActiveDQLane(lane.laneNumber)}
                              className="text-[11px] font-semibold text-rose-600 underline hover:text-rose-700 truncate max-w-[140px]"
                            >
                              {dqRule || 'Pilih Aturan DQ'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada lintasan di-seeding untuk nomor ini. Silakan jalankan auto-seeding terlebih dahulu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal DQ Violation Selector */}
      {activeDQLane !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50 text-rose-950">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold">
                  Diskualifikasi (DQ) — Lintasan {activeDQLane}
                </h3>
              </div>
              <button 
                onClick={() => setActiveDQLane(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Aturan Pelanggaran World Aquatics (FINA) *
                </label>
                <select
                  value={laneDQRules[activeDQLane] || ''}
                  onChange={e => {
                    const ruleCode = e.target.value;
                    const ruleObj = OFFICIAL_DQ_RULES.find(r => r.ruleCode === ruleCode);
                    setLaneDQRules(prev => ({ ...prev, [activeDQLane]: ruleCode }));
                    if (ruleObj) {
                      setLaneDQReasons(prev => ({ ...prev, [activeDQLane]: ruleObj.description }));
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-rose-500 font-semibold"
                >
                  <option value="">-- Pilih Kode Aturan --</option>
                  {OFFICIAL_DQ_RULES.map(rule => (
                    <option key={rule.id} value={rule.ruleCode}>
                      [{rule.ruleCode}] {rule.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan Kejadian / Uraian Pelanggaran oleh Refri *
                </label>
                <textarea
                  rows={3}
                  value={laneDQReasons[activeDQLane] || ''}
                  onChange={e => {
                    const val = e.target.value;
                    setLaneDQReasons(prev => ({ ...prev, [activeDQLane]: val }));
                  }}
                  placeholder="Misal: Perenang menggerakkan tubuh di atas starting block sebelum tembakan start..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-rose-500 leading-relaxed"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600">
                Catatan diskualifikasi ini akan otomatis diteruskan dan didokumentasikan ke dalam dokumen resmi <strong>Berita Acara Pelaksanaan Lomba</strong>.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveDQLane(null)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  Konfirmasi Sanksi DQ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
