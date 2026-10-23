/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useSwimData } from '../context/SwimDataContext';
import { formatAgeGroupLabel } from '../utils/timeUtils';
import { 
  BookOpen, 
  Printer, 
  Calendar, 
  MapPin, 
  Trophy, 
  Layers, 
  Users, 
  CheckCircle2, 
  ShieldCheck, 
  Clock,
  Sparkles,
  ChevronDown
} from 'lucide-react';

export const BukuAcaraView: React.FC = () => {
  const { 
    events, 
    athletes, 
    clubs, 
    championship 
  } = useSwimData();

  const [selectedSession, setSelectedSession] = useState<string>('ALL');

  const athleteMap = useMemo(() => new Map(athletes.map(a => [a.id, a])), [athletes]);
  const clubMap = useMemo(() => new Map(clubs.map(c => [c.id, c])), [clubs]);

  // Available sessions
  const sessions = useMemo(() => {
    const s = new Set<number>();
    events.forEach(e => s.add(e.session || 1));
    return Array.from(s).sort((a, b) => a - b);
  }, [events]);

  // Events filtered by session
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (selectedSession !== 'ALL' && e.session !== parseInt(selectedSession, 10)) {
        return false;
      }
      return true;
    }).sort((a, b) => a.eventNumber - b.eventNumber);
  }, [events, selectedSession]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action / Controls Header (hidden during print) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 rounded-md">
              Buku Acara Resmi (Meet Program)
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Standar PB Akuatik Indonesia & World Aquatics
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Buku Acara Lomba & Jadwal Seri
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dokumen resmi jadwal susunan seri dan alokasi lintasan perenang untuk seluruh nomor perlombaan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setSelectedSession('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                selectedSession === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Sesi
            </button>
            {sessions.map(s => (
              <button
                key={s}
                onClick={() => setSelectedSession(s.toString())}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  selectedSession === s.toString() ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sesi {s}
              </button>
            ))}
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Buku Acara</span>
          </button>
        </div>
      </div>

      {/* Printable Master Document Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 md:p-8 space-y-8 printable-content">
        
        {/* Document Official Header */}
        <div className="border-b-2 border-slate-900 pb-5 text-center">
          <div className="text-xs font-extrabold uppercase tracking-widest text-sky-700 mb-1">
            {championship.organizer || 'PENGURUS BESAR AKUATIK INDONESIA'}
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-950 uppercase tracking-tight">
            {championship.name}
          </h2>
          {championship.subTitle && (
            <p className="text-xs md:text-sm font-semibold text-slate-700 mt-0.5">
              {championship.subTitle}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-200">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{championship.venue}, {championship.city}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{championship.startDate} s/d {championship.endDate}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold">{championship.poolLength} Pool</span>
              <span>({championship.poolLanes} Lintasan)</span>
            </div>
          </div>

          {/* Key Officials Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 mt-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-left">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Technical Delegate:</span>
              <span className="font-semibold text-slate-800">{championship.technicalDelegate || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Wasit (Referee):</span>
              <span className="font-semibold text-slate-800">{championship.referee || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Starter:</span>
              <span className="font-semibold text-slate-800">{championship.starter || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Ketua Pencatat:</span>
              <span className="font-semibold text-slate-800">{championship.chiefRecorder || '-'}</span>
            </div>
          </div>
        </div>

        {/* List of Events in Meet Program */}
        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-slate-600">Tidak ada nomor lomba pada sesi yang dipilih</p>
          </div>
        ) : (
          filteredEvents.map(event => {
            const heats = event.heats || [];

            return (
              <div key={event.id} className="space-y-3 break-inside-avoid border-b border-slate-200 pb-6 last:border-b-0">
                {/* Event Heading Banner */}
                <div className="bg-slate-900 text-white p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="bg-sky-500 text-white font-mono font-bold text-sm px-2.5 py-0.5 rounded">
                      #{event.eventNumber}
                    </span>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base leading-tight">
                        {event.title}
                      </h3>
                      <div className="text-[11px] text-slate-300 flex items-center gap-2 mt-0.5">
                        <span>Jarak: <strong className="text-white">{event.distance} Meter</strong></span>
                        <span>•</span>
                        <span>Gaya: <strong className="text-white">{event.stroke}</strong></span>
                        <span>•</span>
                        <span>Kategori: <strong className="text-white">{formatAgeGroupLabel(event.ageGroup)}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right sm:text-right text-[11px] text-slate-300 shrink-0">
                    <span className="font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      Sesi {event.session} · {heats.length} Seri
                    </span>
                    {event.meetRecord && (
                      <div className="text-[10px] text-amber-300 mt-0.5">
                        Rekor: {event.meetRecord.time} ({event.meetRecord.holder})
                      </div>
                    )}
                  </div>
                </div>

                {/* Series (Heats) within Event */}
                {heats.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-400 italic">
                    Nomor ini belum diundi (Belum ada pembagian seri).
                  </div>
                ) : (
                  heats.map(heat => {
                    // Sort lanes by lane number ascending
                    const sortedLanes = [...heat.lanes].sort((a, b) => a.laneNumber - b.laneNumber);

                    return (
                      <div key={heat.heatNumber} className="border border-slate-200 rounded-lg overflow-hidden bg-white mb-3">
                        {/* Heat Subheader */}
                        <div className="bg-slate-100 px-3.5 py-1.5 flex items-center justify-between border-b border-slate-200 text-xs">
                          <span className="font-bold text-slate-800">
                            Seri {heat.heatNumber} dari {heats.length}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {sortedLanes.length} Perenang dalam Seri
                          </span>
                        </div>

                        {/* Lanes Table */}
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
                              <th className="py-2 px-3 w-14 text-center">Lint.</th>
                              <th className="py-2 px-3 w-32">No. Register</th>
                              <th className="py-2 px-3">Nama Atlet</th>
                              <th className="py-2 px-3 text-center w-16">Usia</th>
                              <th className="py-2 px-3">Klub / Kontingen</th>
                              <th className="py-2 px-3 text-right font-mono w-28">Seed Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {sortedLanes.map(lane => {
                              const athlete = athleteMap.get(lane.athleteId);
                              const club = athlete ? clubMap.get(athlete.clubId) : null;
                              const regNum = athlete?.regNumber || athlete?.nik || '-';

                              return (
                                <tr key={lane.laneNumber} className="hover:bg-slate-50/50">
                                  {/* Lane */}
                                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-900 bg-slate-50/50">
                                    {lane.laneNumber}
                                  </td>

                                  {/* Reg Number */}
                                  <td className="py-2 px-3 font-mono font-medium text-slate-600 text-[11px]">
                                    {regNum}
                                  </td>

                                  {/* Athlete Name */}
                                  <td className="py-2 px-3 font-bold text-slate-900">
                                    {athlete?.name || 'Kosong / Tanpa Nama'}
                                  </td>

                                  {/* Age */}
                                  <td className="py-2 px-3 text-center text-slate-600 font-mono text-[11px]">
                                    {athlete?.age ? `${athlete.age} th` : '-'}
                                  </td>

                                  {/* Club */}
                                  <td className="py-2 px-3 text-slate-700">
                                    <span className="font-semibold">{club?.code || '-'}</span>
                                    {club?.name && <span className="text-slate-400 text-[11px] ml-1 hidden sm:inline">({club.name})</span>}
                                  </td>

                                  {/* Seed Time */}
                                  <td className="py-2 px-3 text-right font-mono font-semibold text-slate-800 tabular-nums">
                                    {lane.seedTime || '00:00.00'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })
        )}

        {/* Official Signatures Footer in Print */}
        <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-xs text-slate-800">
          <div>
            <div className="text-[11px] text-slate-500 mb-12">Technical Delegate</div>
            <div className="font-bold border-t border-slate-300 pt-1">
              {championship.technicalDelegate || 'Technical Delegate'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 mb-12">Wasit (Referee)</div>
            <div className="font-bold border-t border-slate-300 pt-1">
              {championship.referee || 'Wasit Utama'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 mb-12">Ketua Juri (Chief Judge)</div>
            <div className="font-bold border-t border-slate-300 pt-1">
              {championship.chiefJudge || 'Ketua Juri'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 mb-12">Ketua Pencatat (Recorder)</div>
            <div className="font-bold border-t border-slate-300 pt-1">
              {championship.chiefRecorder || 'Ketua Pencatat'}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
