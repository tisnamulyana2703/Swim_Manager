/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSwimData } from '../context/SwimDataContext';
import { LaneAllocation } from '../types/swim';
import { STROKE_LABELS, formatTimeDifference } from '../utils/timeUtils';
import { 
  Trophy, 
  Award, 
  Printer, 
  Sparkles, 
  Medal, 
  Flag, 
  Users, 
  ArrowUpRight 
} from 'lucide-react';

export const ResultsView: React.FC = () => {
  const { 
    events, 
    athletes, 
    clubs, 
    selectedEventId, 
    setSelectedEventId, 
    clubMedalTally, 
    bestSwimmers, 
    openPrintModal 
  } = useSwimData();

  const [activeTab, setActiveTab] = useState<'event_results' | 'medal_tally' | 'best_swimmer'>('event_results');
  const currentEvent = events.find(e => e.id === selectedEventId) || events[0];

  const athleteMap = new Map(athletes.map(a => [a.id, a]));
  const clubMap = new Map(clubs.map(c => [c.id, c]));

  // Flatten and sort results for currentEvent across all heats
  const allLanes: LaneAllocation[] = [];
  if (currentEvent) {
    currentEvent.heats.forEach(h => {
      h.lanes.forEach(l => {
        allLanes.push(l);
      });
    });
  }

  // Sort: OK swimmers with rankInEvent first, then DQ/DNS/DNF/PENDING
  const sortedResults = [...allLanes].sort((a, b) => {
    if (a.rankInEvent && b.rankInEvent) return a.rankInEvent - b.rankInEvent;
    if (a.rankInEvent) return -1;
    if (b.rankInEvent) return 1;
    return (a.finalTimeMs || 9999999) - (b.finalTimeMs || 9999999);
  });

  const winnerLane = sortedResults.find(l => l.rankInEvent === 1 && l.finalTimeMs);
  const winnerTimeMs = winnerLane?.finalTimeMs || 0;

  return (
    <div className="space-y-6">
      {/* Title & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Rekapitulasi Hasil, Medali & Perenang Terbaik
          </h1>
          <p className="text-xs text-slate-500">
            Hasil resmi perlombaan renang, penentuan podium medali, dan poin kontingen
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented control */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setActiveTab('event_results')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'event_results' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hasil Per Nomor
            </button>
            <button
              onClick={() => setActiveTab('medal_tally')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'medal_tally' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Perolehan Medali Klub
            </button>
            <button
              onClick={() => setActiveTab('best_swimmer')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'best_swimmer' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Perenang Terbaik
            </button>
          </div>

          <button
            onClick={() => {
              if (activeTab === 'event_results') openPrintModal('result_sheet', currentEvent?.id);
              else if (activeTab === 'medal_tally') openPrintModal('medal_tally');
              else openPrintModal('best_swimmer');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Rekapan</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Event Results */}
      {activeTab === 'event_results' && (
        <div className="space-y-6">
          {/* Event Selector Ribbon */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center font-mono font-bold text-sky-700 text-sm">
                #{currentEvent?.eventNumber}
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">{currentEvent?.title}</h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span>{STROKE_LABELS[currentEvent?.stroke || 'FREESTYLE']}</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentEvent?.distance}m</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentEvent?.ageGroup?.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            <select
              value={currentEvent?.id}
              onChange={e => setSelectedEventId(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500 max-w-xs truncate"
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>
                  #{ev.eventNumber}: {ev.title} ({ev.status === 'COMPLETED' ? 'Selesai' : 'Belum Selesai'})
                </option>
              ))}
            </select>
          </div>

          {/* Podium Cards for Top 3 (Gold, Silver, Bronze) */}
          {sortedResults.filter(l => l.rankInEvent && l.rankInEvent <= 3).length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Emas / Gold */}
              {(() => {
                const gold = sortedResults.find(l => l.rankInEvent === 1);
                const ath = gold ? athleteMap.get(gold.athleteId) : null;
                const clb = ath ? clubMap.get(ath.clubId) : null;
                if (!gold || !ath) return null;
                return (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-amber-600 fill-amber-500" /> Medali Emas
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-900">9 Poin</span>
                    </div>
                    <div className="text-base font-bold text-slate-900 truncate">{ath.name}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{clb?.name} ({clb?.code})</div>
                    <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-amber-200/60 font-mono">
                      <span className="text-[11px] text-slate-500">Waktu Finis:</span>
                      <span className="text-base font-extrabold text-amber-900">{gold.finalTime}</span>
                    </div>
                    {gold.isNewRecord && (
                      <div className="mt-1 text-[11px] font-bold text-amber-700 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" /> Rekor Kejuaraan Baru!
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Perak / Silver */}
              {(() => {
                const silver = sortedResults.find(l => l.rankInEvent === 2);
                const ath = silver ? athleteMap.get(silver.athleteId) : null;
                const clb = ath ? clubMap.get(ath.clubId) : null;
                if (!silver || !ath) return null;
                return (
                  <div className="bg-slate-100/90 border border-slate-300 rounded-xl p-4 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Medal className="w-4 h-4 text-slate-500 fill-slate-400" /> Medali Perak
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-800">7 Poin</span>
                    </div>
                    <div className="text-base font-bold text-slate-900 truncate">{ath.name}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{clb?.name} ({clb?.code})</div>
                    <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-slate-200 font-mono">
                      <span className="text-[11px] text-slate-500">Waktu Finis:</span>
                      <span className="text-base font-extrabold text-slate-900">{silver.finalTime}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Perunggu / Bronze */}
              {(() => {
                const bronze = sortedResults.find(l => l.rankInEvent === 3);
                const ath = bronze ? athleteMap.get(bronze.athleteId) : null;
                const clb = ath ? clubMap.get(ath.clubId) : null;
                if (!bronze || !ath) return null;
                return (
                  <div className="bg-orange-50/70 border border-orange-200 rounded-xl p-4 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-orange-800 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-orange-600" /> Medali Perunggu
                      </span>
                      <span className="text-xs font-mono font-bold text-orange-900">6 Poin</span>
                    </div>
                    <div className="text-base font-bold text-slate-900 truncate">{ath.name}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{clb?.name} ({clb?.code})</div>
                    <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-orange-200/60 font-mono">
                      <span className="text-[11px] text-slate-500">Waktu Finis:</span>
                      <span className="text-base font-extrabold text-orange-950">{bronze.finalTime}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Complete Results Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-16">Peringkat</th>
                    <th className="py-3 px-4">Nama Perenang & NIK</th>
                    <th className="py-3 px-4">Klub / Kontingen</th>
                    <th className="py-3 px-4 font-mono text-center">Heat/Lint</th>
                    <th className="py-3 px-4 font-mono">Seed Time</th>
                    <th className="py-3 px-4 font-mono">Waktu Finis</th>
                    <th className="py-3 px-4 font-mono">Selisih</th>
                    <th className="py-3 px-4 font-mono text-right">Poin</th>
                    <th className="py-3 px-4">Status / Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedResults.length > 0 ? (
                    sortedResults.map((lane, idx) => {
                      const ath = athleteMap.get(lane.athleteId);
                      const clb = ath ? clubMap.get(ath.clubId) : null;
                      const isMedal = lane.rankInEvent && lane.rankInEvent <= 3;

                      return (
                        <tr 
                          key={`${lane.heatNumber}-${lane.laneNumber}`}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            lane.rankInEvent === 1 ? 'bg-amber-50/30' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-sm">
                            {lane.rankInEvent ? (
                              <span className={
                                lane.rankInEvent === 1 ? 'text-amber-600 font-extrabold' :
                                lane.rankInEvent === 2 ? 'text-slate-600 font-bold' :
                                lane.rankInEvent === 3 ? 'text-orange-600 font-bold' : 'text-slate-700'
                              }>
                                #{lane.rankInEvent}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">-</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{ath?.name || 'Unknown'}</span>
                              {lane.isNewRecord && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded font-sans">
                                  REKOR
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-[11px] text-slate-400">{ath?.nik}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-800">{clb?.code}</span>
                            <span className="block text-[11px] text-slate-400 truncate max-w-[140px]">{clb?.name}</span>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-center text-slate-500 tabular-nums">
                            H{lane.heatNumber} / L{lane.laneNumber}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-slate-500 tabular-nums">
                            {lane.seedTime}
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 tabular-nums text-sm">
                            {lane.finalTime || '-'}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-slate-400 tabular-nums">
                            {lane.finalTimeMs && winnerTimeMs
                              ? formatTimeDifference(winnerTimeMs, lane.finalTimeMs)
                              : '-'}
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 tabular-nums text-right">
                            {lane.points || 0}
                          </td>

                          <td className="py-3.5 px-4">
                            {lane.status === 'OK' ? (
                              <span className="text-emerald-700 font-medium">Sah (Finis)</span>
                            ) : lane.status === 'DQ' ? (
                              <div className="text-rose-700 font-bold">
                                <span>DQ [{lane.dqRuleCode}]</span>
                                <span className="block text-[10px] font-normal text-rose-600 truncate max-w-[180px]">
                                  {lane.dqReason}
                                </span>
                              </div>
                            ) : (
                              <span className="text-amber-700 font-medium">{lane.status}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Belum ada data hasil untuk nomor lomba ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Medal Tally */}
      {activeTab === 'medal_tally' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-16">Peringkat</th>
                    <th className="py-3 px-4">Kode Klub</th>
                    <th className="py-3 px-4">Nama Resmi Perkumpulan Renang</th>
                    <th className="py-3 px-4">Kota / Daerah</th>
                    <th className="py-3 px-4 font-mono text-center text-amber-600 font-bold">Emas</th>
                    <th className="py-3 px-4 font-mono text-center text-slate-600 font-bold">Perak</th>
                    <th className="py-3 px-4 font-mono text-center text-orange-600 font-bold">Perunggu</th>
                    <th className="py-3 px-4 font-mono text-center font-bold">Total Medali</th>
                    <th className="py-3 px-4 font-mono text-right font-bold text-sky-700">Total Poin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clubMedalTally.map(tally => (
                    <tr 
                      key={tally.clubId}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        tally.rank === 1 ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                        #{tally.rank}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-800">
                        {tally.clubCode}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {tally.clubName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {tally.city}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-center font-extrabold text-amber-600 text-sm tabular-nums">
                        {tally.gold}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-center font-extrabold text-slate-600 text-sm tabular-nums">
                        {tally.silver}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-center font-extrabold text-orange-600 text-sm tabular-nums">
                        {tally.bronze}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-center font-extrabold text-slate-900 text-sm tabular-nums">
                        {tally.totalMedals}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-right font-extrabold text-sky-700 text-sm tabular-nums">
                        {tally.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Best Swimmers */}
      {activeTab === 'best_swimmer' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-16">Peringkat</th>
                    <th className="py-3 px-4">Nama Atlet</th>
                    <th className="py-3 px-4">Gender</th>
                    <th className="py-3 px-4">Kelompok Umur</th>
                    <th className="py-3 px-4">Asal Klub</th>
                    <th className="py-3 px-4 font-mono text-center text-amber-600 font-bold">Emas</th>
                    <th className="py-3 px-4 font-mono text-center text-slate-600 font-bold">Perak</th>
                    <th className="py-3 px-4 font-mono text-center text-orange-600 font-bold">Perunggu</th>
                    <th className="py-3 px-4 font-mono text-center">Rekor Baru</th>
                    <th className="py-3 px-4 font-mono text-right font-bold text-sky-700">Total Poin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bestSwimmers.map((swimmer, idx) => (
                    <tr key={swimmer.athleteId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                        #{idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {swimmer.athleteName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={swimmer.gender === 'MALE' ? 'text-sky-700 font-medium' : 'text-pink-700 font-medium'}>
                          {swimmer.gender === 'MALE' ? 'Putra' : 'Putri'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {swimmer.ageGroup.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800">
                        {swimmer.clubName}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-center font-bold text-amber-600 tabular-nums">
                        {swimmer.gold}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-center font-bold text-slate-600 tabular-nums">
                        {swimmer.silver}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-center font-bold text-orange-600 tabular-nums">
                        {swimmer.bronze}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-center text-amber-700 font-bold tabular-nums">
                        {swimmer.recordsBroken > 0 ? `${swimmer.recordsBroken} Rekor` : '-'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-right font-extrabold text-sky-700 text-sm tabular-nums">
                        {swimmer.totalPoints}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
