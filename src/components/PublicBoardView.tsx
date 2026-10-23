/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useSwimData } from '../context/SwimDataContext';
import { STROKE_LABELS } from '../utils/timeUtils';
import { 
  Trophy, 
  Search, 
  Tv, 
  Play, 
  Pause, 
  Clock, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

export const PublicBoardView: React.FC = () => {
  const { 
    events, 
    athletes, 
    clubs, 
    championship, 
    selectedEventId, 
    setSelectedEventId 
  } = useSwimData();

  const [searchQuery, setSearchQuery] = useState('');
  const [autoCycle, setAutoCycle] = useState(false);

  const athleteMap = new Map(athletes.map(a => [a.id, a]));
  const clubMap = new Map(clubs.map(c => [c.id, c]));

  const currentEvent = events.find(e => e.id === selectedEventId) || events[0];

  // Auto-cycle through completed/active events every 8 seconds if enabled
  useEffect(() => {
    if (!autoCycle || events.length <= 1) return;
    const interval = window.setInterval(() => {
      const currentIndex = events.findIndex(e => e.id === selectedEventId);
      const nextIndex = (currentIndex + 1) % events.length;
      setSelectedEventId(events[nextIndex].id);
    }, 8000);
    return () => window.clearInterval(interval);
  }, [autoCycle, events, selectedEventId, setSelectedEventId]);

  // Search athlete or club
  const searchResults = searchQuery.trim() ? athletes.filter(a => {
    const club = clubMap.get(a.clubId);
    return a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (club && club.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
           (club && club.code.toLowerCase().includes(searchQuery.toLowerCase()));
  }) : [];

  // Flatten lanes for current event
  const allLanes = currentEvent?.heats.flatMap(h => h.lanes) || [];
  const sortedByRank = [...allLanes].sort((a, b) => {
    if (a.rankInEvent && b.rankInEvent) return a.rankInEvent - b.rankInEvent;
    if (a.rankInEvent) return -1;
    if (b.rankInEvent) return 1;
    return (a.finalTimeMs || 9999999) - (b.finalTimeMs || 9999999);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Display Mode Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Tv className="w-5 h-5 text-sky-600" />
            <span>Papan Skor Digital Stadion (Live Arena Scoreboard)</span>
          </h1>
          <p className="text-xs text-slate-500">
            Tampilan resolusi tinggi ramah layar lebar stadion akuatik dan akses publik penonton
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoCycle(!autoCycle)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              autoCycle
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {autoCycle ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{autoCycle ? 'Auto-Cycle Aktif (8s)' : 'Mulai Bergulir Otomatis'}</span>
          </button>
        </div>
      </div>

      {/* Public Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari atlet atau klub untuk melihat jadwal heat dan lintasan..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500 focus:bg-white"
          />
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="mt-3 border-t border-slate-100 pt-3 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase block">
              Ditemukan {searchResults.length} Atlet:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {searchResults.slice(0, 6).map(ath => {
                const club = clubMap.get(ath.clubId);
                return (
                  <div key={ath.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <div className="font-bold text-slate-900">{ath.name}</div>
                    <div className="text-[11px] text-slate-500">{club?.name} · {ath.ageGroup.replace('_', ' ')}</div>
                    <div className="mt-1 space-y-0.5">
                      {ath.registeredEvents.map(r => {
                        const ev = events.find(e => e.id === r.eventId);
                        // Find lane allocation
                        let heatLaneInfo = 'Belum di-seeding';
                        ev?.heats.forEach(h => {
                          const l = h.lanes.find(lane => lane.athleteId === ath.id);
                          if (l) heatLaneInfo = `Heat ${h.heatNumber}, Lintasan ${l.laneNumber}`;
                        });

                        return (
                          <button
                            key={r.eventId}
                            onClick={() => {
                              setSelectedEventId(r.eventId);
                              setSearchQuery('');
                            }}
                            className="w-full text-left p-1 rounded bg-white border border-slate-200 hover:border-sky-400 text-[11px] text-sky-800 flex items-center justify-between font-mono"
                          >
                            <span>#{ev?.eventNumber} {ev?.title?.split(' ')[0]} {ev?.title?.split(' ')[1]}</span>
                            <span className="font-bold text-slate-700">{heatLaneInfo}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* High-Contrast Stadium LED Style Scoreboard */}
      <div className="bg-slate-950 text-white rounded-2xl border-2 border-slate-800 overflow-hidden shadow-2xl font-sans">
        
        {/* Stadium Header Bar */}
        <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-indigo-950 p-4 sm:p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-sky-400 uppercase">
              <span>{championship.venue}</span>
              <span aria-hidden="true">·</span>
              <span>KOLAM {championship.poolLength}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              #{currentEvent?.eventNumber}: {currentEvent?.title}
            </h2>
            <div className="text-xs text-slate-300">
              {currentEvent ? STROKE_LABELS[currentEvent.stroke] : ''} · {currentEvent?.round.replace('_', ' ')}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={currentEvent?.id}
              onChange={e => setSelectedEventId(e.target.value)}
              className="px-3 py-2 text-xs font-mono font-bold bg-slate-900 border border-slate-700 text-sky-300 rounded-lg focus:outline-hidden"
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>
                  #{ev.eventNumber}: {ev.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Big LED Board Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-mono uppercase text-xs">
                <th className="py-3 px-4 w-16 text-center">POS</th>
                <th className="py-3 px-4 w-16 text-center">LANE</th>
                <th className="py-3 px-4">SWIMMER</th>
                <th className="py-3 px-4">TEAM / CLUB</th>
                <th className="py-3 px-4 font-mono text-center">HEAT</th>
                <th className="py-3 px-4 font-mono text-right">SEED</th>
                <th className="py-3 px-4 font-mono text-right">FINAL TIME</th>
                <th className="py-3 px-4 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {sortedByRank.length > 0 ? (
                sortedByRank.map((lane) => {
                  const ath = athleteMap.get(lane.athleteId);
                  const clb = ath ? clubMap.get(ath.clubId) : null;
                  const isGold = lane.rankInEvent === 1;
                  const isSilver = lane.rankInEvent === 2;
                  const isBronze = lane.rankInEvent === 3;

                  return (
                    <tr 
                      key={`${lane.heatNumber}-${lane.laneNumber}`}
                      className={`hover:bg-slate-900/60 transition-colors font-mono ${
                        isGold ? 'bg-amber-950/30' : ''
                      }`}
                    >
                      {/* Rank Position */}
                      <td className="py-4 px-4 text-center font-bold text-base">
                        {lane.rankInEvent ? (
                          <span className={
                            isGold ? 'text-amber-400 text-lg font-black' :
                            isSilver ? 'text-slate-300 font-bold' :
                            isBronze ? 'text-orange-400 font-bold' : 'text-slate-400'
                          }>
                            {lane.rankInEvent}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Lane Number */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-block w-8 h-8 rounded-md bg-slate-800 text-white font-black leading-8 text-sm">
                          {lane.laneNumber}
                        </span>
                      </td>

                      {/* Swimmer Name */}
                      <td className="py-4 px-4 font-sans font-extrabold text-white text-base">
                        <div className="flex items-center gap-2">
                          <span>{ath?.name || 'Vacant'}</span>
                          {lane.isNewRecord && (
                            <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase">
                              RECORD
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Club */}
                      <td className="py-4 px-4 font-sans">
                        <span className="font-bold text-sky-400 text-sm">{clb?.code}</span>
                        <span className="text-xs text-slate-400 ml-2 hidden sm:inline">{clb?.name}</span>
                      </td>

                      {/* Heat */}
                      <td className="py-4 px-4 text-center text-slate-400">
                        H{lane.heatNumber}
                      </td>

                      {/* Seed Time */}
                      <td className="py-4 px-4 text-right text-slate-400">
                        {lane.seedTime}
                      </td>

                      {/* Final Time */}
                      <td className="py-4 px-4 text-right font-black text-lg text-white tabular-nums tracking-wide">
                        {lane.finalTime || (
                          <span className="text-slate-600 text-sm font-normal">--:--.--</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        {lane.status === 'OK' ? (
                          <span className="text-emerald-400 text-xs font-bold uppercase">FIN</span>
                        ) : lane.status === 'DQ' ? (
                          <span className="text-rose-400 text-xs font-bold uppercase">DQ</span>
                        ) : (
                          <span className="text-amber-400 text-xs font-bold uppercase">{lane.status}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-sans">
                    Belum ada atlet yang di-seeding untuk nomor lomba ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Stadium Footer Bar */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>WORLD AQUATICS TIMING & RESULTS SYSTEM</span>
          <span>SISTEM INFORMASI PERLOMBAAN RENANG INDONESIA</span>
        </div>
      </div>
    </div>
  );
};
