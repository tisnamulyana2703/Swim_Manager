/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useSwimData } from '../context/SwimDataContext';
import { formatAgeGroupLabel, getCategoryLetter, STROKE_LABELS } from '../utils/timeUtils';
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
  Search, 
  Sliders, 
  FileText,
  Award,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';

export const BukuAcaraView: React.FC = () => {
  const { 
    events, 
    athletes, 
    clubs, 
    championship, 
    openPrintModal,
    runAutoSeedingForAllEvents,
    getEventAgeGroupsLabel,
    getStrokeLabel
  } = useSwimData();

  const [selectedSession, setSelectedSession] = useState<string>('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'heats' | 'schedule' | 'officials'>('heats');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const athleteMap = useMemo(() => new Map(athletes.map(a => [a.id, a])), [athletes]);
  const clubMap = useMemo(() => new Map(clubs.map(c => [c.id, c])), [clubs]);

  // Available sessions
  const sessions = useMemo(() => {
    const s = new Set<number>();
    events.forEach(e => s.add(e.session || 1));
    return Array.from(s).sort((a, b) => a - b);
  }, [events]);

  // Unseeded events count
  const unseededEvents = useMemo(() => {
    return events.filter(e => !e.heats || e.heats.length === 0);
  }, [events]);

  // Events filtered by session and search
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      // Session filter
      if (selectedSession !== 'ALL' && e.session !== parseInt(selectedSession, 10)) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesEvent = 
          e.title.toLowerCase().includes(q) ||
          e.eventNumber.toString().includes(q) ||
          e.stroke.toLowerCase().includes(q);

        if (matchesEvent) return true;

        // Check if any athlete in heats matches
        if (e.heats) {
          const hasMatchingAthlete = e.heats.some(h => 
            h.lanes.some(l => {
              const ath = athleteMap.get(l.athleteId);
              if (!ath) return false;
              const clb = clubMap.get(ath.clubId);
              return (
                ath.name.toLowerCase().includes(q) ||
                (ath.regNumber && ath.regNumber.toLowerCase().includes(q)) ||
                (clb && clb.name.toLowerCase().includes(q)) ||
                (clb && clb.code.toLowerCase().includes(q))
              );
            })
          );
          if (hasMatchingAthlete) return true;
        }

        return false;
      }

      return true;
    }).sort((a, b) => a.eventNumber - b.eventNumber);
  }, [events, selectedSession, searchQuery, athleteMap, clubMap]);

  // Summary counts
  const totalHeatsCount = useMemo(() => {
    return filteredEvents.reduce((acc, ev) => acc + (ev.heats?.length || 0), 0);
  }, [filteredEvents]);

  const totalEntriesCount = useMemo(() => {
    return filteredEvents.reduce((acc, ev) => {
      return acc + (ev.heats?.reduce((hAcc, h) => hAcc + h.lanes.length, 0) || 0);
    }, 0);
  }, [filteredEvents]);

  const handleOpenPrintModal = () => {
    openPrintModal('buku_acara');
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action / Controls Header (hidden during print) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5 print:hidden">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 rounded-md flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-amber-700" />
              Buku Acara Resmi (Meet Program)
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Standar PB Akuatik Indonesia & World Aquatics
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Buku Acara Lomba & Susunan Seri (Start List)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Jadwal resmi perlombaan, susunan seri (heats), alokasi lintasan 1–{championship.poolLanes}, profil perenang, dan perangkat pertandingan.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          {unseededEvents.length > 0 && (
            <button
              onClick={() => {
                runAutoSeedingForAllEvents();
                alert(`Berhasil menjalankan auto-seeding untuk ${unseededEvents.length} nomor lomba!`);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
              title="Otomatis susun seri dan alokasi lintasan untuk semua nomor yang belum di-seeding"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Auto-Seeding Semua ({unseededEvents.length})</span>
            </button>
          )}

          <button
            onClick={handleBrowserPrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
            title="Cetak cepat langsung lewat print browser"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Cepat</span>
          </button>

          <button
            onClick={handleOpenPrintModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer"
            title="Buka pratinjau format resmi A4 Lanskap/Potret dengan kop lengkap"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>Cetak Format Resmi A4</span>
          </button>
        </div>
      </div>


      {/* Filter and Sub-navigation Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        {/* Sub-tabs: Heats vs Schedule vs Officials */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveSubTab('heats')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
              activeSubTab === 'heats' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏊 Susunan Seri (Heats)
          </button>
          <button
            onClick={() => setActiveSubTab('schedule')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
              activeSubTab === 'schedule' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📅 Jadwal Acara (Schedule)
          </button>
          <button
            onClick={() => setActiveSubTab('officials')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
              activeSubTab === 'officials' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👔 Perangkat Pertandingan
          </button>
        </div>

        {/* Search & Session Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari atlet, klub, atau nomor..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-sky-500 focus:bg-white w-52 sm:w-60"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Session Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setSelectedSession('ALL')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                selectedSession === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Sesi
            </button>
            {sessions.map(s => (
              <button
                key={s}
                onClick={() => setSelectedSession(s.toString())}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  selectedSession === s.toString() ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sesi {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase">Nomor Lomba</span>
          <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
            {filteredEvents.length} <span className="text-xs font-normal text-slate-400">Nomor</span>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase">Total Seri Terjadwal</span>
          <div className="text-xl font-black text-amber-600 font-mono mt-0.5">
            {totalHeatsCount} <span className="text-xs font-normal text-slate-400">Seri</span>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase">Total Perenang / Entri</span>
          <div className="text-xl font-black text-sky-600 font-mono mt-0.5">
            {totalEntriesCount} <span className="text-xs font-normal text-slate-400">Entri</span>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase">Sesi Pertandingan</span>
          <div className="text-xl font-black text-indigo-600 font-mono mt-0.5">
            {sessions.length} <span className="text-xs font-normal text-slate-400">Sesi Lomba</span>
          </div>
        </div>
      </div>

      {/* Printable Master Document Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8 printable-content">
        
        {/* Document Official Header */}
        <div className="border-b-2 border-slate-900 pb-5 text-center">
          <div className="text-xs font-extrabold uppercase tracking-widest text-sky-700 mb-1 font-mono">
            {championship.organizer || 'PENGURUS BESAR AKUATIK INDONESIA'}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight">
            {championship.name}
          </h2>
          {championship.subTitle && (
            <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1">
              {championship.subTitle}
            </p>
          )}

          <div className="inline-block mt-2 px-3 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs uppercase tracking-wider rounded">
            BUKU ACARA RESMI (OFFICIAL MEET PROGRAM & START LIST)
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-200">
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
        </div>

        {/* SUBTAB 1: Susunan Seri & Lintasan (Heats / Starting List) */}
        {activeSubTab === 'heats' && (
          <div className="space-y-8">
            {filteredEvents.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-700 text-sm">Tidak ada nomor lomba yang sesuai dengan filter.</p>
                <p className="text-xs text-slate-400 mt-1">Ubah filter sesi atau kata kunci pencarian Anda.</p>
              </div>
            ) : (
              filteredEvents.map(event => {
                const heats = event.heats || [];

                return (
                  <div key={event.id} className="space-y-3 break-inside-avoid border-b border-slate-200 pb-8 last:border-b-0">
                    {/* Event Heading Banner */}
                    <div className="bg-slate-900 text-white p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <span className="bg-amber-400 text-slate-950 font-mono font-black text-sm px-2.5 py-1 rounded-md">
                          #{event.eventNumber}
                        </span>
                        <div>
                          <h3 className="font-bold text-sm sm:text-base leading-tight text-white">
                            {event.title}
                          </h3>
                          <div className="text-[11px] text-slate-300 flex flex-wrap items-center gap-2 mt-0.5">
                            <span>Jarak: <strong className="text-white">{event.distance} Meter</strong></span>
                            <span>•</span>
                            <span>Gaya: <strong className="text-white">{getStrokeLabel(event.stroke)}</strong></span>
                            <span>•</span>
                            <span>Kategori: <strong className="text-white">{getEventAgeGroupsLabel(event)}</strong></span>
                            <span>•</span>
                            <span>Jenis: <strong className="text-white">{event.gender === 'MALE' ? 'Putra' : event.gender === 'FEMALE' ? 'Putri' : 'Campuran'}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left sm:text-right text-[11px] text-slate-300 shrink-0">
                        <span className="font-mono bg-slate-800 px-2.5 py-1 rounded border border-slate-700 font-semibold">
                          Sesi {event.session} · {heats.length} Seri
                        </span>
                        {event.meetRecord && (
                          <div className="text-[10px] text-amber-300 mt-1 font-mono">
                            Rekor: {event.meetRecord.time} ({event.meetRecord.holder})
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Series (Heats) within Event */}
                    {heats.length === 0 ? (
                      <div className="p-5 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500">
                        <p className="font-medium">Nomor lomba ini belum disusun serinya (belum di-seeding).</p>
                        <button
                          onClick={() => {
                            runAutoSeedingForAllEvents();
                            alert(`Seeding berhasil dijalankan untuk nomor #${event.eventNumber}!`);
                          }}
                          className="mt-2 px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-md shadow-2xs transition-colors cursor-pointer"
                        >
                          Susun Seri Nomor Ini
                        </button>
                      </div>
                    ) : (
                      heats.map(heat => {
                        // Sort lanes by lane number ascending
                        const sortedLanes = [...heat.lanes].sort((a, b) => a.laneNumber - b.laneNumber);

                        return (
                          <div key={heat.heatNumber} className="border border-slate-300 rounded-xl overflow-hidden bg-white mb-4 shadow-2xs">
                            {/* Heat Subheader */}
                            <div className="bg-slate-100 px-4 py-2 flex items-center justify-between border-b border-slate-300 text-xs">
                              <span className="font-extrabold text-slate-900 uppercase">
                                Seri {heat.heatNumber} dari {heats.length}
                              </span>
                              <span className="text-[11px] text-slate-600 font-mono font-semibold">
                                {sortedLanes.length} Perenang dalam Seri
                              </span>
                            </div>

                            {/* Lanes Table */}
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-300 text-slate-600 font-bold text-[10px] uppercase">
                                  <th className="py-2.5 px-3 w-14 text-center border-r border-slate-200">Lint.</th>
                                  <th className="py-2.5 px-3 w-28 border-r border-slate-200">No. Reg</th>
                                  <th className="py-2.5 px-3 border-r border-slate-200">Nama Lengkap Atlet</th>
                                  <th className="py-2.5 px-3 text-center w-14 border-r border-slate-200">KU</th>
                                  <th className="py-2.5 px-3 border-r border-slate-200">Klub / Kontingen</th>
                                  <th className="py-2.5 px-3 text-right font-mono w-28">Seed Time</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {sortedLanes.map(lane => {
                                  const athlete = athleteMap.get(lane.athleteId);
                                  const club = athlete ? clubMap.get(athlete.clubId) : null;
                                  const regNum = athlete?.regNumber || athlete?.nik || '-';

                                  return (
                                    <tr key={lane.laneNumber} className="hover:bg-slate-50/70 transition-colors">
                                      {/* Lane */}
                                      <td className="py-2 px-3 text-center font-mono font-extrabold text-slate-950 bg-slate-50/50 border-r border-slate-200">
                                        {lane.laneNumber}
                                      </td>

                                      {/* Reg Number */}
                                      <td className="py-2 px-3 font-mono font-medium text-slate-600 text-[11px] border-r border-slate-200">
                                        {regNum}
                                      </td>

                                      {/* Athlete Name */}
                                      <td className="py-2 px-3 font-bold text-slate-950 uppercase border-r border-slate-200">
                                        {athlete?.name || 'Kosong / Tanpa Nama'}
                                      </td>

                                      {/* KU (Category Letter A, B, C, etc.) */}
                                      <td className="py-2 px-3 text-center text-slate-900 font-bold font-mono text-xs border-r border-slate-200">
                                        {getCategoryLetter(athlete?.ageGroup, athlete?.age)}
                                      </td>

                                      {/* Club */}
                                      <td className="py-2 px-3 text-slate-800 border-r border-slate-200">
                                        <span className="font-bold">{club?.code || '-'}</span>
                                        {club?.name && <span className="text-slate-500 text-[11px] ml-1.5 hidden sm:inline">({club.name})</span>}
                                      </td>

                                      {/* Seed Time */}
                                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
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
          </div>
        )}

        {/* SUBTAB 2: Jadwal & Agenda Acara (Schedule) */}
        {activeSubTab === 'schedule' && (
          <div className="space-y-6">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase">
                    <th className="py-3 px-3 w-16 text-center">Acara</th>
                    <th className="py-3 px-3 w-20 text-center">Sesi</th>
                    <th className="py-3 px-4">Nama Nomor Perlombaan</th>
                    <th className="py-3 px-3">Gaya & Jarak</th>
                    <th className="py-3 px-3">Kelompok Usia</th>
                    <th className="py-3 px-3 text-center w-20">Jumlah Seri</th>
                    <th className="py-3 px-3 text-center w-24">Babak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredEvents.map(ev => (
                    <tr key={ev.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 bg-slate-50">
                        #{ev.eventNumber}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-600">
                        Sesi {ev.session}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {ev.title}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {ev.distance}m {getStrokeLabel(ev.stroke)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {getEventAgeGroupsLabel(ev)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-600">
                        {ev.heats?.length || 0} Seri
                      </td>
                      <td className="py-2.5 px-3 text-center text-[11px] font-semibold text-slate-500">
                        {ev.round === 'TIMED_FINAL' ? 'Timed Final' : 'Penyisihan'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 3: Perangkat Pertandingan (Officials) */}
        {activeSubTab === 'officials' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
                  Pimpinan & Pengawas Pertandingan
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">Technical Delegate:</span>
                    <span className="font-bold text-slate-900">{championship.technicalDelegate}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">Wasit Utama (Referee):</span>
                    <span className="font-bold text-slate-900">{championship.referee}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">Ketua Juri (Chief Judge):</span>
                    <span className="font-bold text-slate-900">{championship.chiefJudge}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">Ketua Pencatat (Chief Recorder):</span>
                    <span className="font-bold text-slate-900">{championship.chiefRecorder}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
                  Petugas Lintasan & Perangkat Waktu
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">Starter:</span>
                    <span className="font-bold text-slate-900">{championship.starter}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">Ketua Pencatat Waktu:</span>
                    <span className="font-bold text-slate-900">{championship.chiefTimekeeper}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">Juri Gaya (Stroke Judge):</span>
                    <span className="font-bold text-slate-900">{championship.strokeJudge}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">Sistem Pencatatan Elektronik:</span>
                    <span className="font-bold text-slate-900">{championship.timingBrand}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
