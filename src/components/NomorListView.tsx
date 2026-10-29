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
  Printer, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  FileSpreadsheet, 
  Maximize2, 
  Minimize2,
  Calendar,
  Waves,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';

export const NomorListView: React.FC = () => {
  const { 
    events, 
    athletes, 
    clubs, 
    championship, 
    setSelectedEventId, 
    setActiveTab,
    openPrintModal,
    customStrokes,
    customAgeGroups,
    getStrokeLabel,
    getAgeGroupLabel
  } = useSwimData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventIdFilter, setSelectedEventIdFilter] = useState<string>('ALL');
  const [selectedSessionFilter, setSelectedSessionFilter] = useState<string>('ALL');
  const [selectedDistanceFilter, setSelectedDistanceFilter] = useState<string>('ALL');
  const [selectedStrokeFilter, setSelectedStrokeFilter] = useState<string>('ALL');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<string>('ALL');
  const [selectedAgeFilter, setSelectedAgeFilter] = useState<string>('ALL');
  const [collapsedEvents, setCollapsedEvents] = useState<Record<string, boolean>>({});

  const clubMap = useMemo(() => new Map(clubs.map(c => [c.id, c])), [clubs]);

  // Stroke labels in Indonesian
  const strokeLabel = (stroke: string) => {
    return getStrokeLabel(stroke);
  };

  // Build a mapped lookup for event seeding: eventId -> Map<athleteId, { heat: number, lane: number, status: string }>
  const seedingLookup = useMemo(() => {
    const map = new Map<string, Map<string, { heat: number; lane: number; status: string }>>();
    events.forEach(ev => {
      const athleteSeeding = new Map<string, { heat: number; lane: number; status: string }>();
      if (ev.heats) {
        ev.heats.forEach(h => {
          h.lanes.forEach(l => {
            if (l.athleteId) {
              athleteSeeding.set(l.athleteId, {
                heat: h.heatNumber,
                lane: l.laneNumber,
                status: l.status,
              });
            }
          });
        });
      }
      map.set(ev.id, athleteSeeding);
    });
    return map;
  }, [events]);

  // Group participants by event
  const eventsWithParticipants = useMemo(() => {
    return events.map(ev => {
      const registeredList: {
        athleteId: string;
        regNumber: string;
        name: string;
        gender: 'MALE' | 'FEMALE';
        birthDate: string;
        age: number;
        ageGroup: string;
        clubId: string;
        clubName: string;
        clubCode: string;
        seedTime: string;
        seedTimeMs: number;
        heatNumber?: number;
        laneNumber?: number;
        swimmerStatus?: string;
      }[] = [];

      const evSeeding = seedingLookup.get(ev.id);

      athletes.forEach(ath => {
        if (!ath.registeredEvents) return;
        const reg = ath.registeredEvents.find(r => r.eventId === ev.id);
        if (reg) {
          const club = clubMap.get(ath.clubId);
          const clubName = club ? club.name : 'Independen';
          const clubCode = club ? club.code : 'IND';
          const regNumber = ath.regNumber || ath.nik || `REG-${ath.name.slice(0, 3).toUpperCase()}-001`;

          const seedInfo = evSeeding?.get(ath.id);

          registeredList.push({
            athleteId: ath.id,
            regNumber,
            name: ath.name,
            gender: ath.gender,
            birthDate: ath.birthDate,
            age: ath.age,
            ageGroup: ath.ageGroup,
            clubId: ath.clubId,
            clubName,
            clubCode,
            seedTime: reg.seedTime || '00:00.00',
            seedTimeMs: reg.seedTimeMs || 0,
            heatNumber: seedInfo?.heat,
            laneNumber: seedInfo?.lane,
            swimmerStatus: seedInfo?.status,
          });
        }
      });

      // Sort participants: by seed time ascending (NT / 0 at the end)
      registeredList.sort((a, b) => {
        if (a.seedTimeMs === 0 && b.seedTimeMs !== 0) return 1;
        if (b.seedTimeMs === 0 && a.seedTimeMs !== 0) return -1;
        if (a.seedTimeMs !== b.seedTimeMs) return a.seedTimeMs - b.seedTimeMs;
        return a.name.localeCompare(b.name);
      });

      // Calculate distinct clubs
      const distinctClubs = new Set(registeredList.map(p => p.clubId)).size;

      return {
        event: ev,
        participants: registeredList,
        totalParticipants: registeredList.length,
        totalClubs: distinctClubs,
        isSeeded: ev.status === 'SEEDED' || ev.status === 'IN_PROGRESS' || ev.status === 'COMPLETED',
      };
    }).sort((a, b) => a.event.eventNumber - b.event.eventNumber);
  }, [events, athletes, clubMap, seedingLookup]);

  // Available sessions
  const sessions = useMemo(() => {
    const s = new Set<number>();
    events.forEach(e => s.add(e.session || 1));
    return Array.from(s).sort((a, b) => a - b);
  }, [events]);

  // Filtered event list
  const filteredEventsWithParticipants = useMemo(() => {
    return eventsWithParticipants.filter(({ event: ev, participants }) => {
      // Direct Event filter
      if (selectedEventIdFilter !== 'ALL' && ev.id !== selectedEventIdFilter) {
        return false;
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

      // Age Group
      if (selectedAgeFilter !== 'ALL' && ev.ageGroup !== selectedAgeFilter) {
        return false;
      }

      // Search term: matches event title, number, or any registered participant's name/club/reg
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = ev.title.toLowerCase().includes(q);
        const matchNum = ev.eventNumber.toString().includes(q);
        const matchParticipant = participants.some(p => 
          p.name.toLowerCase().includes(q) ||
          p.clubName.toLowerCase().includes(q) ||
          p.clubCode.toLowerCase().includes(q) ||
          p.regNumber.toLowerCase().includes(q)
        );
        if (!matchTitle && !matchNum && !matchParticipant) return false;
      }

      return true;
    });
  }, [
    eventsWithParticipants, 
    selectedEventIdFilter, 
    selectedSessionFilter, 
    selectedDistanceFilter, 
    selectedStrokeFilter, 
    selectedGenderFilter, 
    selectedAgeFilter, 
    searchTerm
  ]);

  // Overall KPI metrics
  const totalNomorLomba = filteredEventsWithParticipants.length;
  const totalPesertaSemua = useMemo(() => {
    return filteredEventsWithParticipants.reduce((acc, curr) => acc + curr.totalParticipants, 0);
  }, [filteredEventsWithParticipants]);
  const totalSeri = useMemo(() => {
    return filteredEventsWithParticipants.reduce((acc, curr) => acc + (curr.event.heats?.length || 0), 0);
  }, [filteredEventsWithParticipants]);
  const totalSeededEvents = useMemo(() => {
    return filteredEventsWithParticipants.filter(e => e.isSeeded).length;
  }, [filteredEventsWithParticipants]);

  // Toggle single card collapse
  const toggleCollapse = (eventId: string) => {
    setCollapsedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  // Expand / Collapse all
  const expandAll = () => {
    setCollapsedEvents({});
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    filteredEventsWithParticipants.forEach(e => {
      next[e.event.id] = true;
    });
    setCollapsedEvents(next);
  };

  // Export CSV of Nomor List (All grouped participants)
  const handleExportCSV = () => {
    const headers = [
      'No. Lomba',
      'Nama Nomor Lomba',
      'Sesi',
      'Jarak',
      'Gaya',
      'Kelompok Usia',
      'No. Urut Peserta',
      'No. Register',
      'Nama Atlet',
      'Jenis Kelamin',
      'Tanggal Lahir',
      'Usia',
      'Klub Renang',
      'Kode Klub',
      'Waktu Masuk (Seed Time)',
      'Seri',
      'Lintasan'
    ];

    const rows: (string | number)[][] = [];

    filteredEventsWithParticipants.forEach(({ event: ev, participants }) => {
      participants.forEach((p, idx) => {
        rows.push([
          ev.eventNumber,
          `"${ev.title}"`,
          ev.session,
          `${ev.distance}m`,
          `"${strokeLabel(ev.stroke)}"`,
          `"${formatAgeGroupLabel(ev.ageGroup, p.age)}"`,
          idx + 1,
          `"${p.regNumber}"`,
          `"${p.name}"`,
          p.gender === 'MALE' ? 'Putra' : 'Putri',
          p.birthDate,
          p.age,
          `"${p.clubName}"`,
          `"${p.clubCode}"`,
          `"${p.seedTime}"`,
          p.heatNumber || '-',
          p.laneNumber || '-'
        ]);
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Nomor_List_${championship.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-red-100 text-red-800 rounded-md">
              Daftar Peserta per Nomor Lomba
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {championship.poolLength} Pool · {championship.poolLanes} Lintasan
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Nomor List Perlombaan (Event Roster)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar lengkap peserta lomba renang yang dikelompokkan secara terstruktur berdasarkan setiap nomor perlombaan, dilengkapi waktu masuk (seed time) dan status pengundian seri.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Print Button */}
          <button
            onClick={() => openPrintModal('nomor_list', selectedEventIdFilter !== 'ALL' ? selectedEventIdFilter : undefined)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors cursor-pointer"
            title="Cetak Nomor List resmi sesuai format standar PB Akuatik Indonesia (A4 Lanskap / Potret)"
          >
            <Printer className="w-3.5 h-3.5 text-white" />
            <span>Cetak Hasil Nomor List</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors cursor-pointer"
            title="Ekspor seluruh data peserta per nomor lomba ke spreadsheet CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Nomor Lomba</div>
          <div className="text-2xl font-bold text-red-600 font-mono mt-1">{totalNomorLomba}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Nomor pertandingan ditampilkan</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Entri Peserta</div>
          <div className="text-2xl font-bold text-sky-600 font-mono mt-1">{totalPesertaSemua}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Peserta terdaftar di nomor-nomor ini</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Seri Terbentuk</div>
          <div className="text-2xl font-bold text-amber-600 font-mono mt-1">{totalSeri}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Heat/seri lintasan lomba</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status Pengundian</div>
          <div className="text-2xl font-bold text-emerald-600 font-mono mt-1">
            {totalSeededEvents} / {totalNomorLomba}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Nomor telah memiliki Seri (Seeded)</div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari nomor lomba, nama atlet, klub, atau nomor registrasi..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-red-500 focus:bg-white"
            />
          </div>

          {/* Gender Filter Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {(['ALL', 'MALE', 'FEMALE', 'MIXED'] as const).map(g => (
              <button
                key={g}
                onClick={() => setSelectedGenderFilter(g)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  selectedGenderFilter === g 
                    ? 'bg-slate-900 text-white border-slate-900' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {g === 'ALL' ? 'Semua Gender' : g === 'MALE' ? 'Putra' : g === 'FEMALE' ? 'Putri' : 'Mix'}
              </button>
            ))}
          </div>

          {/* Expand / Collapse All Controls */}
          <div className="flex items-center gap-1 shrink-0 border-l border-slate-200 pl-2">
            <button
              onClick={expandAll}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1 cursor-pointer"
              title="Buka seluruh rincian nomor lomba"
            >
              <Maximize2 className="w-3 h-3" />
              <span className="hidden sm:inline">Buka Semua</span>
            </button>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1 cursor-pointer"
              title="Tutup seluruh rincian nomor lomba"
            >
              <Minimize2 className="w-3 h-3" />
              <span className="hidden sm:inline">Tutup Semua</span>
            </button>
          </div>
        </div>

        {/* Detailed Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Pilih Nomor Lomba</label>
            <select
              value={selectedEventIdFilter}
              onChange={e => setSelectedEventIdFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-red-500 truncate"
            >
              <option value="ALL">Semua Nomor Lomba ({events.length} Nomor)</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>
                  #{ev.eventNumber} - {ev.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Sesi Lomba</label>
            <select
              value={selectedSessionFilter}
              onChange={e => setSelectedSessionFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-red-500"
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
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Jarak Lomba</label>
            <select
              value={selectedDistanceFilter}
              onChange={e => setSelectedDistanceFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-red-500"
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
              className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-red-500 font-medium"
            >
              <option value="ALL">Semua Gaya</option>
              {customStrokes.map(s => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grouped Participant List by Nomor Lomba */}
      <div className="space-y-5">
        {filteredEventsWithParticipants.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            <Layers className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700 text-sm">Tidak ada nomor perlombaan yang cocok dengan kriteria filter</p>
            <p className="text-xs text-slate-400 mt-1">Coba sesuaikan pencarian atau atur filter kembali ke "Semua".</p>
          </div>
        ) : (
          filteredEventsWithParticipants.map(({ event: ev, participants, totalParticipants, totalClubs, isSeeded }) => {
            const isCollapsed = !!collapsedEvents[ev.id];

            return (
              <div 
                key={ev.id} 
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300"
              >
                {/* Event Group Header */}
                <div 
                  className={`p-4 border-b transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isCollapsed ? 'bg-slate-50/70 border-slate-200' : 'bg-red-50/40 border-red-100'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleCollapse(ev.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0 mt-0.5 sm:mt-0"
                      title={isCollapsed ? 'Buka peserta nomor ini' : 'Tutup peserta nomor ini'}
                    >
                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-black text-sm text-red-700 bg-red-100/90 px-2.5 py-0.5 rounded-md border border-red-200">
                          #{ev.eventNumber}
                        </span>
                        <h2 className="text-sm sm:text-base font-bold text-slate-900">
                          {ev.title}
                        </h2>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ev.gender === 'MALE' ? 'bg-blue-100 text-blue-700' :
                          ev.gender === 'FEMALE' ? 'bg-rose-100 text-rose-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {ev.gender === 'MALE' ? 'Putra' : ev.gender === 'FEMALE' ? 'Putri' : 'Campuran'}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {formatAgeGroupLabel(ev.ageGroup)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>Sesi {ev.session}</span>
                        <span>·</span>
                        <span>{ev.distance}m {strokeLabel(ev.stroke)}</span>
                        <span>·</span>
                        <span>{ev.round === 'TIMED_FINAL' ? 'Timed Final' : ev.round === 'PRELIM' ? 'Babak Penyisihan' : 'Babak Final'}</span>
                        <span>·</span>
                        <span className="font-semibold text-slate-700">
                          {totalParticipants} Peserta Terdaftar
                        </span>
                        <span>·</span>
                        <span className="text-slate-600 font-medium">
                          {totalClubs} Klub Renang
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Header Badges and Direct Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                      isSeeded
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {isSeeded ? `${ev.heats?.length || 0} Seri Terbentuk` : 'Belum Diundi'}
                    </span>

                    {/* Print this event specifically */}
                    <button
                      type="button"
                      onClick={() => openPrintModal('nomor_list', ev.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-white border border-slate-300 text-slate-700 hover:text-red-700 hover:border-red-300 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Cetak Daftar Peserta Nomor Lomba ini"
                    >
                      <Printer className="w-3.5 h-3.5 text-red-600" />
                      <span>Cetak Nomor Ini</span>
                    </button>

                    {/* Quick navigation to Seeding */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEventId(ev.id);
                        setActiveTab('seeding');
                      }}
                      className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-md transition-colors"
                      title="Buka Starting List / Seri"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Table of Participants under this Event */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    {participants.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 bg-slate-50/40">
                        <Users className="w-7 h-7 mx-auto text-slate-300 mb-1.5" />
                        <p className="text-xs font-medium text-slate-600">Belum ada peserta yang mendaftar pada nomor lomba ini</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Tambahkan atlet baru atau impor entri nomor lomba melalui tab Pendaftar / Entry List.
                        </p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                            <th className="py-2.5 px-3 w-12 text-center">No</th>
                            <th className="py-2.5 px-3 w-28">No. Registrasi</th>
                            <th className="py-2.5 px-4">Nama Lengkap Atlet</th>
                            <th className="py-2.5 px-3 w-14 text-center">L/P</th>
                            <th className="py-2.5 px-3 w-24 text-center">KU / Umur</th>
                            <th className="py-2.5 px-4">Klub Renang</th>
                            <th className="py-2.5 px-3 w-28 text-center">Waktu Masuk</th>
                            <th className="py-2.5 px-3 w-32 text-center">Seri / Lintasan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {participants.map((p, pIdx) => {
                            const isSeededRow = p.heatNumber !== undefined && p.laneNumber !== undefined;

                            return (
                              <tr key={p.athleteId} className="hover:bg-slate-50/80 transition-colors">
                                {/* No Urut */}
                                <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-500">
                                  {pIdx + 1}
                                </td>

                                {/* Reg Number */}
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                                    {p.regNumber}
                                  </span>
                                </td>

                                {/* Name */}
                                <td className="py-2.5 px-4 font-semibold text-slate-900 uppercase">
                                  {p.name}
                                </td>

                                {/* Gender */}
                                <td className="py-2.5 px-3 text-center">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    p.gender === 'MALE' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                                  }`}>
                                    {p.gender === 'MALE' ? 'L' : 'P'}
                                  </span>
                                </td>

                                {/* KU & Age */}
                                <td className="py-2.5 px-3 text-center">
                                  <span className="font-semibold text-slate-800">
                                    {formatAgeGroupLabel(p.ageGroup, p.age)}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block font-mono">
                                    {p.age} th ({p.birthDate ? p.birthDate.split('-')[0] : '-'})
                                  </span>
                                </td>

                                {/* Club */}
                                <td className="py-2.5 px-4">
                                  <div className="font-medium text-slate-800 uppercase">{p.clubName}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{p.clubCode}</div>
                                </td>

                                {/* Seed Time */}
                                <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                                  <span className={`px-2 py-0.5 rounded ${
                                    !p.seedTime || p.seedTime === '00:00.00' || p.seedTime === 'NT' || p.seedTimeMs === 0
                                      ? 'text-slate-400 font-normal italic'
                                      : 'text-slate-900 bg-slate-100'
                                  }`}>
                                    {(!p.seedTime || p.seedTime === '00:00.00' || p.seedTime === 'NT' || p.seedTimeMs === 0) ? 'NT' : p.seedTime}
                                  </span>
                                </td>

                                {/* Seri / Lintasan */}
                                <td className="py-2.5 px-3 text-center">
                                  {isSeededRow ? (
                                    <span className="inline-flex items-center gap-1 font-mono font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded text-[11px]">
                                      Seri {p.heatNumber} · Ln {p.laneNumber}
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-slate-400 italic">
                                      Belum Diundi
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-50 border-t border-slate-200 font-bold text-slate-800">
                            <td colSpan={6} className="py-2.5 px-4 text-left font-bold text-[11px] uppercase">
                              Subtotal Peserta Nomor Lomba #{ev.eventNumber}:
                            </td>
                            <td colSpan={2} className="py-2.5 px-4 text-center font-bold text-red-600 text-[11px]">
                              {totalParticipants} Atlet Terdaftar ({totalClubs} Klub)
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
