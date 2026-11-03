/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useSwimData } from '../context/SwimDataContext';
import { 
  Trophy, 
  Users, 
  Layers, 
  Flag, 
  FileText, 
  Play, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Sparkles,
  Sliders,
  Settings,
  BookOpen,
  Printer,
  ChevronRight,
  ShieldAlert,
  Medal,
  Activity,
  Calendar,
  MapPin,
  Search,
  FileSpreadsheet
} from 'lucide-react';
import { STROKE_LABELS, getCategoryLetter, formatDateToDDMMMMYYYY, formatChampionshipDateRange } from '../utils/timeUtils';

export const DashboardView: React.FC = () => {
  const { 
    championship, 
    athletes, 
    clubs, 
    events, 
    incidents, 
    recordBreakers,
    clubMedalTally,
    setActiveTab, 
    setSelectedEventId, 
    runAutoSeedingForAllEvents,
    openPrintModal 
  } = useSwimData();

  const [sessionFilter, setSessionFilter] = useState<number | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [eventSearch, setEventSearch] = useState('');

  // Computations
  const maleAthletes = useMemo(() => athletes.filter(a => a.gender === 'MALE').length, [athletes]);
  const femaleAthletes = useMemo(() => athletes.filter(a => a.gender === 'FEMALE').length, [athletes]);
  const totalHeats = useMemo(() => events.reduce((acc, ev) => acc + ev.heats.length, 0), [events]);
  const completedEvents = useMemo(() => events.filter(e => e.status === 'COMPLETED').length, [events]);
  const seededEvents = useMemo(() => events.filter(e => e.status === 'SEEDED' || e.status === 'IN_PROGRESS').length, [events]);
  const unseededEvents = useMemo(() => events.filter(e => e.status === 'NOT_SEEDED').length, [events]);

  const completionPct = events.length > 0 ? Math.round((completedEvents / events.length) * 100) : 0;

  // Active or Next Event to process
  const activeEvent = useMemo(() => {
    return (
      events.find(e => e.status === 'IN_PROGRESS') ||
      events.find(e => e.status === 'SEEDED') ||
      events.find(e => e.status === 'NOT_SEEDED') ||
      events[0]
    );
  }, [events]);

  // Unique sessions available
  const sessions = useMemo(() => {
    const set = new Set<number>();
    events.forEach(e => set.add(e.session || 1));
    return Array.from(set).sort((a, b) => a - b);
  }, [events]);

  // Filtered events for the summary table
  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      const matchSession = sessionFilter === 'ALL' || (ev.session || 1) === sessionFilter;
      const matchStatus = statusFilter === 'ALL' || ev.status === statusFilter;
      const matchSearch = !eventSearch || 
        ev.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
        String(ev.eventNumber).includes(eventSearch);
      return matchSession && matchStatus && matchSearch;
    });
  }, [events, sessionFilter, statusFilter, eventSearch]);

  // Top 5 clubs from medal standings
  const topClubs = useMemo(() => {
    return [...clubMedalTally].slice(0, 5);
  }, [clubMedalTally]);

  // Recent 3 incidents
  const recentIncidents = useMemo(() => {
    return incidents.slice(0, 3);
  }, [incidents]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Tactical Command Header (High Density, No Wasted Space) */}
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Tournament Overview */}
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Pusat Kendali Perlombaan Resmi
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>World Aquatics Standard</span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
              {championship.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                {championship.venue} ({championship.poolLength}, {championship.poolLanes} Lintasan)
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                {formatChampionshipDateRange(championship.startDate, championship.endDate)}
              </span>
              <span className="text-slate-400">
                Cutoff Usia: <strong className="text-white font-mono">{formatDateToDDMMMMYYYY(championship.cutoffDate)}</strong>
              </span>
            </div>
          </div>

          {/* Quick Action Command Toolbar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('buku_acara')}
              className="flex items-center gap-2 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Buka Buku Acara</span>
            </button>

            <button
              onClick={() => {
                runAutoSeedingForAllEvents();
                alert('Auto-seeding berhasil untuk seluruh nomor perlombaan!');
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
              <span>Auto-Seeding Semua</span>
            </button>

            {activeEvent && (
              <button
                onClick={() => {
                  setSelectedEventId(activeEvent.id);
                  if (activeEvent.status === 'COMPLETED') {
                    setActiveTab('results');
                  } else {
                    setActiveTab('timekeeper');
                  }
                }}
                className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs text-xs font-semibold rounded-lg border border-white/15 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span>Input Waktu Seri #{activeEvent.eventNumber}</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('incidents')}
              className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs text-xs font-semibold rounded-lg border border-white/15 transition-colors cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Kasus & DQ ({incidents.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('spreadsheet')}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              title="Simpan seluruh database kejuaraan ke Google Spreadsheet & salin kode .gs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
              <span>Simpan ke Spreadsheet</span>
            </button>
          </div>
        </div>

        {/* Live Event Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-300">Kemajuan Lomba:</span>
            <div className="w-48 sm:w-64 bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
              <div 
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <span className="font-mono font-bold text-emerald-400">{completionPct}%</span>
            <span className="text-slate-400">({completedEvents} dari {events.length} Nomor Selesai)</span>
          </div>

          <div className="text-slate-400 text-[11px]">
            Wasit Utama: <span className="text-white font-semibold">{championship.referee}</span> · TD: <span className="text-white font-semibold">{championship.technicalDelegate}</span>
          </div>
        </div>
      </div>

      {/* 2. High-Density Metric Grid (6 Compact Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div 
          onClick={() => setActiveTab('athletes')} 
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-sky-300 hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase">Total Atlet</span>
            <Users className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
            {athletes.length}
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
            {maleAthletes} Putra · {femaleAthletes} Putri
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('athletes')} 
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase">Klub Kontingen</span>
            <Flag className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
            {clubs.length}
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
            Klub Terdaftar
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('events')} 
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase">Nomor Lomba</span>
            <Layers className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
            {events.length}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
            {completedEvents} Selesai · {unseededEvents} Antre
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('seeding')} 
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase">Total Seri (Heat)</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
            {totalHeats}
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
            {seededEvents} Nomor Ter-seeding
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('results')} 
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-yellow-300 hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase">Rekor Tercipta</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono tabular-nums">
            {recordBreakers.length}
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
            Rekor Kejuaraan Baru
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('incidents')} 
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-rose-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase text-rose-700">Kasus & DQ</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono tabular-nums">
            {incidents.length}
          </div>
          <div className="text-[10px] text-rose-600 font-medium mt-0.5">
            Lihat Catatan Kasus →
          </div>
        </div>
      </div>

      {/* 3. Main Center: Full Schedule & Event Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {/* Table Header Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Matriks Seluruh Nomor Acara Perlombaan
            </h2>
            <p className="text-xs text-slate-500">
              Pantau status seeding, jumlah peserta, seri, dan input waktu per nomor acara
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={eventSearch}
                onChange={e => setEventSearch(e.target.value)}
                placeholder="Cari acara..."
                className="pl-8 pr-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-sky-500"
              />
            </div>

            <select
              value={sessionFilter}
              onChange={e => setSessionFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden"
            >
              <option value="ALL">Semua Sesi</option>
              {sessions.map(s => (
                <option key={s} value={s}>Sesi {s}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden"
            >
              <option value="ALL">Semua Status</option>
              <option value="NOT_SEEDED">Belum Seeding</option>
              <option value="SEEDED">Ter-seeding</option>
              <option value="COMPLETED">Selesai</option>
            </select>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3 w-14 text-center">Acara</th>
                <th className="py-2.5 px-3">Judul Acara & Gaya</th>
                <th className="py-2.5 px-3 w-28 text-center">KU (Kategori)</th>
                <th className="py-2.5 px-3 w-20 text-center">Gender</th>
                <th className="py-2.5 px-3 w-20 text-center">Peserta</th>
                <th className="py-2.5 px-3 w-20 text-center">Seri</th>
                <th className="py-2.5 px-3 w-28 text-center">Status</th>
                <th className="py-2.5 px-3 text-right w-36">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredEvents.map(event => {
                const regCount = athletes.filter(a => a.registeredEvents.some(r => r.eventId === event.id)).length;
                const kuLetter = getCategoryLetter(event.ageGroup);

                return (
                  <tr key={event.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                      #{event.eventNumber}
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">
                        {event.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {STROKE_LABELS[event.stroke]} · {event.distance}m · Sesi {event.session || 1}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className="font-bold font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        KU {kuLetter}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[11px] font-semibold ${event.gender === 'MALE' ? 'text-sky-700' : 'text-pink-700'}`}>
                        {event.gender === 'MALE' ? 'Putra' : 'Putri'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-700">
                      {regCount}
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-700">
                      {event.heats.length}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {event.status === 'COMPLETED' ? (
                        <span className="text-[11px] font-bold text-emerald-700 inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Selesai
                        </span>
                      ) : event.status === 'SEEDED' ? (
                        <span className="text-[11px] font-bold text-sky-700 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Ter-seeding
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700">
                          Belum Seeding
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {event.status === 'COMPLETED' ? (
                          <button
                            onClick={() => {
                              setSelectedEventId(event.id);
                              setActiveTab('results');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer"
                          >
                            Hasil
                          </button>
                        ) : event.status === 'SEEDED' ? (
                          <button
                            onClick={() => {
                              setSelectedEventId(event.id);
                              setActiveTab('timekeeper');
                            }}
                            className="px-2.5 py-1 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-md transition-colors cursor-pointer"
                          >
                            Input Waktu
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedEventId(event.id);
                              setActiveTab('seeding');
                            }}
                            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                          >
                            Seeding
                          </button>
                        )}

                        <button
                          onClick={() => openPrintModal('start_list', event.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Cetak Start List Acara Ini"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Bottom Grid: Medal Leaderboard, Incidents Alert, Officials & Print Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column (2 spans): Medal Leaderboard & Recent Infractions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Top 5 Clubs Medal Standings */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  Klasemen Perolehan Medali Kontingen (Top 5)
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('results')}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Selengkapnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3 w-12 text-center">Rank</th>
                    <th className="py-2.5 px-3">Nama Klub / Kontingen</th>
                    <th className="py-2.5 px-3 w-16 text-center text-amber-600 font-bold">🥇 Emas</th>
                    <th className="py-2.5 px-3 w-16 text-center text-slate-500 font-bold">🥈 Perak</th>
                    <th className="py-2.5 px-3 w-16 text-center text-amber-700 font-bold">🥉 Prg</th>
                    <th className="py-2.5 px-3 w-16 text-center font-bold">Total</th>
                    <th className="py-2.5 px-3 w-16 text-center font-bold text-sky-700">Poin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topClubs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        Belum ada nomor yang diselesaikan untuk perhitungan medali.
                      </td>
                    </tr>
                  ) : (
                    topClubs.map((club, idx) => (
                      <tr key={club.clubId} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 text-center font-bold font-mono text-slate-700">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900">{club.clubName}</span>
                          <span className="text-[11px] text-slate-400 ml-2">({club.city})</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-600">
                          {club.gold}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-600">
                          {club.silver}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-800">
                          {club.bronze}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-extrabold text-slate-900">
                          {club.totalMedals}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-extrabold text-sky-700">
                          {club.points}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Infractions & DQ Alerts */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-rose-50/40">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Catatan Kasus & Pelanggaran Terkini
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('incidents')}
                className="text-xs font-semibold text-rose-700 hover:text-rose-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Buka Catatan Kasus ({incidents.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4">
              {recentIncidents.length === 0 ? (
                <div className="text-center py-5 text-slate-400 text-xs">
                  Tidak ada catatan pelanggaran atau diskualifikasi aktif saat ini.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentIncidents.map(inc => (
                    <div 
                      key={inc.id}
                      onClick={() => setActiveTab('incidents')}
                      className="p-3 bg-slate-50 hover:bg-rose-50/50 rounded-lg border border-slate-200/80 transition-colors flex items-start justify-between gap-3 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-rose-700">{inc.ruleCode}</span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="font-bold text-xs text-slate-900 truncate">{inc.athleteName}</span>
                          <span className="text-[11px] text-slate-500">({inc.clubName})</span>
                        </div>
                        <div className="text-xs text-slate-600 mt-1 line-clamp-1">
                          #{inc.eventNumber} {inc.eventTitle} · Seri {inc.heatNumber} Lintasan {inc.laneNumber}: {inc.reason}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                          {inc.status === 'WARNING' ? 'Peringatan' : inc.status === 'OVERTURNED' ? 'Sah' : 'DQ Wasit'}
                        </span>
                        <div className="text-[10px] font-mono text-slate-400 mt-1">
                          {inc.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* New Record Breakers Card (if any) */}
          {recordBreakers.length > 0 && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Pencatatan Rekor Kejuaraan Baru!</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {recordBreakers.map((rec, i) => (
                  <div key={i} className="bg-white/80 p-2.5 rounded-lg border border-amber-200">
                    <div className="font-bold text-slate-900">{rec.athleteName}</div>
                    <div className="text-[11px] text-slate-500">{rec.clubName} · {rec.eventTitle}</div>
                    <div className="font-mono font-bold text-amber-700 text-xs mt-1">
                      Rekor Baru: {rec.newTime} (Lama: {rec.oldRecord})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column (1 span): Technical Officials & Fast Document Hub */}
        <div className="space-y-6">
          
          {/* Official Meet Officials Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">Perangkat Wasit Resmi</h3>
              </div>
              <button
                onClick={() => setActiveTab('settings')}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Ubah</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Wasit Utama (Referee):</span>
                <span className="font-bold text-slate-900">{championship.referee}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Technical Delegate:</span>
                <span className="font-bold text-slate-900">{championship.technicalDelegate}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Starter (Pelepas):</span>
                <span className="font-bold text-slate-900">{championship.starter || '-'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Ketua Juri Kedatangan:</span>
                <span className="font-bold text-slate-900">{championship.chiefJudge}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Ketua Pencatat Waktu:</span>
                <span className="font-bold text-slate-900">{championship.chiefRecorder}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500 font-medium">Sistem Pengukur:</span>
                <span className="font-mono font-semibold text-slate-700 text-[11px]">{championship.timingBrand || 'Automatic Touchpad'}</span>
              </div>
            </div>
          </div>

          {/* Quick Print & Official Document Hub */}
          <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3 shadow-md">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Printer className="w-4 h-4 text-sky-400" />
                <span>Pusat Cetak Dokumen Resmi</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Dokumen resmi berformat A4 siap cetak & arsip PB Akuatik Indonesia.
              </p>
            </div>

            <div className="space-y-1.5 pt-1 text-xs">
              <button
                onClick={() => openPrintModal('buku_acara')}
                className="w-full text-left px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>📖 Buku Acara Lengkap (Semua Acara)</span>
                <span>→</span>
              </button>

              <button
                onClick={() => openPrintModal('start_list_all')}
                className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>⏱️ Starting List Lengkap (Semua Acara)</span>
                <span className="text-slate-400">→</span>
              </button>

              <button
                onClick={() => openPrintModal('entry_list')}
                className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>📝 Entry List Peserta Kontingen</span>
                <span className="text-slate-400">→</span>
              </button>

              <button
                onClick={() => openPrintModal('result_sheet')}
                className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>🏁 Lembar Hasil Lomba (Result Sheet)</span>
                <span className="text-slate-400">→</span>
              </button>

              <button
                onClick={() => openPrintModal('medal_tally')}
                className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>🥇 Klasemen Perolehan Medali</span>
                <span className="text-slate-400">→</span>
              </button>

              <button
                onClick={() => setActiveTab('incidents')}
                className="w-full text-left px-3 py-2 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 font-semibold border border-rose-800/40 rounded-lg flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>⚠️ Rekap Laporan Kasus & Diskualifikasi</span>
                <span className="text-rose-400">→</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
