/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useSwimData } from '../context/SwimDataContext';
import { formatAgeGroupLabel } from '../utils/timeUtils';
import { 
  Layers, 
  Search, 
  Filter, 
  Clock, 
  Trophy, 
  CheckCircle2, 
  Play, 
  ChevronRight, 
  Plus, 
  Printer, 
  Calendar,
  Waves
} from 'lucide-react';

export const NomorListView: React.FC = () => {
  const { 
    events, 
    athletes, 
    championship, 
    setSelectedEventId, 
    setActiveTab 
  } = useSwimData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSessionFilter, setSelectedSessionFilter] = useState<string>('ALL');
  const [selectedDistanceFilter, setSelectedDistanceFilter] = useState<string>('ALL');
  const [selectedStrokeFilter, setSelectedStrokeFilter] = useState<string>('ALL');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<string>('ALL');

  // Count athletes registered per event
  const athleteCountPerEvent = useMemo(() => {
    const map = new Map<string, number>();
    athletes.forEach(ath => {
      if (ath.registeredEvents) {
        ath.registeredEvents.forEach(reg => {
          map.set(reg.eventId, (map.get(reg.eventId) || 0) + 1);
        });
      }
    });
    return map;
  }, [athletes]);

  // Available sessions
  const sessions = useMemo(() => {
    const s = new Set<number>();
    events.forEach(e => s.add(e.session || 1));
    return Array.from(s).sort((a, b) => a - b);
  }, [events]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = ev.title.toLowerCase().includes(q);
        const matchNum = ev.eventNumber.toString().includes(q);
        if (!matchTitle && !matchNum) return false;
      }

      // Session
      if (selectedSessionFilter !== 'ALL' && ev.session !== parseInt(selectedSessionFilter, 10)) {
        return false;
      }

      // Distance
      if (selectedDistanceFilter !== 'ALL' && ev.distance !== parseInt(selectedDistanceFilter, 10)) {
        return false;
      }

      // Stroke
      if (selectedStrokeFilter !== 'ALL' && ev.stroke !== selectedStrokeFilter) {
        return false;
      }

      // Gender
      if (selectedGenderFilter !== 'ALL' && ev.gender !== selectedGenderFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => a.eventNumber - b.eventNumber);
  }, [events, searchTerm, selectedSessionFilter, selectedDistanceFilter, selectedStrokeFilter, selectedGenderFilter]);

  // Total heats across filtered events
  const totalHeats = useMemo(() => {
    return filteredEvents.reduce((acc, ev) => acc + (ev.heats?.length || 0), 0);
  }, [filteredEvents]);

  const strokeLabel = (stroke: string) => {
    switch (stroke) {
      case 'FREESTYLE': return 'Gaya Bebas';
      case 'BREASTSTROKE': return 'Gaya Dada';
      case 'BACKSTROKE': return 'Gaya Punggung';
      case 'BUTTERFLY': return 'Gaya Kupu-kupu';
      case 'INDIVIDUAL_MEDLEY': return 'Gaya Ganti Perorangan';
      case 'RELAY_FREESTYLE': return 'Estafet Gaya Bebas';
      case 'RELAY_MEDLEY': return 'Estafet Gaya Ganti';
      default: return stroke;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Quick Stats */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 rounded-md">
              Daftar Nomor Pertandingan
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {championship.poolLength} Pool · {championship.poolLanes} Lintasan
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Nomor List Perlombaan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar lengkap seluruh nomor perlombaan renang, jarak (25m s/d 1500m), sesi pertandingan, jumlah seri, dan status perlombaan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('events')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Kelola / Tambah Nomor</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Nomor Lomba</div>
          <div className="text-2xl font-bold text-indigo-600 font-mono mt-1">{filteredEvents.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Dari total {events.length} nomor</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Seri Terbentuk</div>
          <div className="text-2xl font-bold text-sky-600 font-mono mt-1">{totalHeats}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Seri perlombaan terbagi</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Sesi Pertandingan</div>
          <div className="text-2xl font-bold text-amber-600 font-mono mt-1">{sessions.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Sesi lomba terjadwal</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Nomor Selesai</div>
          <div className="text-2xl font-bold text-emerald-600 font-mono mt-1">
            {filteredEvents.filter(e => e.status === 'COMPLETED').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Hasil telah disahkan</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari nomor lomba, gaya, atau kelompok usia..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:bg-white"
            />
          </div>

          {/* Gender */}
          <div className="flex items-center gap-1.5 shrink-0">
            {(['ALL', 'MALE', 'FEMALE', 'MIXED'] as const).map(g => (
              <button
                key={g}
                onClick={() => setSelectedGenderFilter(g)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  selectedGenderFilter === g 
                    ? 'bg-slate-900 text-white border-slate-900' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {g === 'ALL' ? 'Semua' : g === 'MALE' ? 'Putra' : g === 'FEMALE' ? 'Putri' : 'Mix'}
              </button>
            ))}
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Sesi Lomba</label>
            <select
              value={selectedSessionFilter}
              onChange={e => setSelectedSessionFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
            >
              <option value="ALL">Semua Sesi</option>
              {sessions.map(s => (
                <option key={s} value={s.toString()}>
                  Sesi {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Jarak (Termasuk 25m)</label>
            <select
              value={selectedDistanceFilter}
              onChange={e => setSelectedDistanceFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
            >
              <option value="ALL">Semua Jarak</option>
              <option value="25">25 Meter (Sprint Pemula)</option>
              <option value="50">50 Meter</option>
              <option value="100">100 Meter</option>
              <option value="200">200 Meter</option>
              <option value="400">400 Meter</option>
              <option value="800">800 Meter</option>
              <option value="1500">1500 Meter</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Gaya Renang</label>
            <select
              value={selectedStrokeFilter}
              onChange={e => setSelectedStrokeFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
            >
              <option value="ALL">Semua Gaya</option>
              <option value="FREESTYLE">Gaya Bebas</option>
              <option value="BREASTSTROKE">Gaya Dada</option>
              <option value="BACKSTROKE">Gaya Punggung</option>
              <option value="BUTTERFLY">Gaya Kupu-kupu</option>
              <option value="INDIVIDUAL_MEDLEY">Gaya Ganti Perorangan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Catalogue Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-16 text-center">No. Lomba</th>
                <th className="py-3 px-4">Nama Nomor Pertandingan</th>
                <th className="py-3 px-4 text-center">Jarak</th>
                <th className="py-3 px-4">Gaya</th>
                <th className="py-3 px-4 text-center">Sesi</th>
                <th className="py-3 px-4 text-center">Kelompok Usia</th>
                <th className="py-3 px-4 text-center">Perenang</th>
                <th className="py-3 px-4 text-center">Seri (Heat)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Navigasi Langsung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Layers className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">Tidak ada nomor perlombaan yang cocok</p>
                    <p className="text-[11px] text-slate-400 mt-1">Silakan sesuaikan filter atau tambahkan nomor lomba baru.</p>
                  </td>
                </tr>
              ) : (
                filteredEvents.map(ev => {
                  const swimmerCount = athleteCountPerEvent.get(ev.id) || 0;
                  const heatCount = ev.heats ? ev.heats.length : 0;

                  return (
                    <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Event Number */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-bold text-sm text-sky-700 bg-sky-50 px-2 py-1 rounded-md border border-sky-100">
                          #{ev.eventNumber}
                        </span>
                      </td>

                      {/* Title & Gender */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{ev.title}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            ev.gender === 'MALE' ? 'bg-blue-100 text-blue-700' :
                            ev.gender === 'FEMALE' ? 'bg-rose-100 text-rose-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {ev.gender === 'MALE' ? 'Putra' : ev.gender === 'FEMALE' ? 'Putri' : 'Campuran'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {ev.round === 'TIMED_FINAL' ? 'Timed Final' : ev.round === 'PRELIM' ? 'Babak Penyisihan' : 'Babak Final'}
                          </span>
                        </div>
                      </td>

                      {/* Distance */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${
                          ev.distance === 25 ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-800'
                        }`}>
                          {ev.distance}m
                        </span>
                      </td>

                      {/* Stroke */}
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {strokeLabel(ev.stroke)}
                      </td>

                      {/* Session */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          Sesi {ev.session}
                        </span>
                      </td>

                      {/* Age Group */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {formatAgeGroupLabel(ev.ageGroup)}
                        </span>
                      </td>

                      {/* Swimmers Count */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                        {swimmerCount}
                      </td>

                      {/* Seri Count */}
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-700">
                        <span className="bg-sky-50 text-sky-800 px-2 py-0.5 rounded border border-sky-100">
                          {heatCount} Seri
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          ev.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ev.status === 'IN_PROGRESS'
                            ? 'bg-amber-100 text-amber-800'
                            : ev.status === 'SEEDED'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {ev.status === 'COMPLETED' ? 'Selesai' :
                           ev.status === 'IN_PROGRESS' ? 'Berlangsung' :
                           ev.status === 'SEEDED' ? 'Siap Lomba' : 'Belum Diundi'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedEventId(ev.id);
                              setActiveTab('seeding');
                            }}
                            className="px-2 py-1 text-[11px] font-semibold text-slate-700 hover:text-sky-700 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
                            title="Buka Starting List Seri"
                          >
                            Starting List
                          </button>

                          <button
                            onClick={() => {
                              setSelectedEventId(ev.id);
                              setActiveTab('timekeeper');
                            }}
                            className="px-2 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-50 rounded-md border border-sky-200 transition-colors"
                            title="Input Waktu Seri"
                          >
                            Input Waktu
                          </button>

                          <button
                            onClick={() => {
                              setSelectedEventId(ev.id);
                              setActiveTab('results');
                            }}
                            className="px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 rounded-md border border-emerald-200 transition-colors"
                            title="Lihat Hasil & Medali"
                          >
                            Hasil
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
