/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useSwimData } from '../context/SwimDataContext';
import { formatAgeGroupLabel } from '../utils/timeUtils';
import { 
  Users, 
  Search, 
  Filter, 
  Printer, 
  Download, 
  Trophy, 
  Shield, 
  Clock, 
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';

export const EntryListView: React.FC = () => {
  const { athletes, events, clubs, championship, setActiveTab, setSelectedEventId, openPrintModal, customAgeGroups } = useSwimData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('ALL');
  const [selectedAgeFilter, setSelectedAgeFilter] = useState<string>('ALL');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<string>('ALL');
  const [selectedClubFilter, setSelectedClubFilter] = useState<string>('ALL');
  const [showClubRecap, setShowClubRecap] = useState<boolean>(true);

  const clubMap = useMemo(() => new Map(clubs.map(c => [c.id, c])), [clubs]);
  const eventMap = useMemo(() => new Map(events.map(e => [e.id, e])), [events]);

  // Statistics of athletes and total registered event numbers per club
  const clubStats = useMemo(() => {
    const map = new Map<string, {
      clubId: string;
      name: string;
      code: string;
      city: string;
      athletesCount: number;
      maleCount: number;
      femaleCount: number;
      totalNomorLomba: number;
    }>();

    clubs.forEach(c => {
      map.set(c.id, {
        clubId: c.id,
        name: c.name,
        code: c.code,
        city: c.city,
        athletesCount: 0,
        maleCount: 0,
        femaleCount: 0,
        totalNomorLomba: 0,
      });
    });

    athletes.forEach(ath => {
      let stat = map.get(ath.clubId);
      if (!stat) {
        stat = {
          clubId: ath.clubId,
          name: 'Independen',
          code: 'IND',
          city: '-',
          athletesCount: 0,
          maleCount: 0,
          femaleCount: 0,
          totalNomorLomba: 0,
        };
        map.set(ath.clubId, stat);
      }
      stat.athletesCount += 1;
      if (ath.gender === 'MALE') stat.maleCount += 1;
      else stat.femaleCount += 1;
      stat.totalNomorLomba += (ath.registeredEvents?.length || 0);
    });

    const list = Array.from(map.values()).sort((a, b) => b.totalNomorLomba - a.totalNomorLomba);
    const grandTotalNomor = list.reduce((s, c) => s + c.totalNomorLomba, 0);

    return { map, list, grandTotalNomor };
  }, [clubs, athletes]);

  // Flatten entries: each athlete's registered event is an entry row
  const allEntries = useMemo(() => {
    const list: {
      athleteId: string;
      regNumber: string;
      athleteName: string;
      gender: 'MALE' | 'FEMALE';
      age: number;
      ageGroup: string;
      clubId: string;
      clubName: string;
      clubCode: string;
      eventId: string;
      eventNumber: number;
      eventTitle: string;
      distance: number;
      stroke: string;
      seedTime: string;
      seedTimeMs: number;
      eventStatus: string;
    }[] = [];

    athletes.forEach(ath => {
      const club = clubMap.get(ath.clubId);
      const clubName = club ? club.name : 'Independen';
      const clubCode = club ? club.code : 'IND';
      const regNumber = ath.regNumber || ath.nik || `REG-${ath.name.slice(0, 3).toUpperCase()}-001`;

      if (ath.registeredEvents && ath.registeredEvents.length > 0) {
        ath.registeredEvents.forEach(reg => {
          const ev = eventMap.get(reg.eventId);
          list.push({
            athleteId: ath.id,
            regNumber,
            athleteName: ath.name,
            gender: ath.gender,
            age: ath.age,
            ageGroup: ath.ageGroup,
            clubId: ath.clubId,
            clubName,
            clubCode,
            eventId: reg.eventId,
            eventNumber: ev ? ev.eventNumber : 999,
            eventTitle: ev ? ev.title : `Nomor ${reg.eventId}`,
            distance: ev ? ev.distance : 50,
            stroke: ev ? ev.stroke : 'FREESTYLE',
            seedTime: reg.seedTime || '00:00.00',
            seedTimeMs: reg.seedTimeMs || 0,
            eventStatus: ev ? ev.status : 'NOT_SEEDED',
          });
        });
      }
    });

    // Sort by eventNumber ascending, then seedTimeMs ascending
    return list.sort((a, b) => {
      if (a.eventNumber !== b.eventNumber) return a.eventNumber - b.eventNumber;
      if (a.seedTimeMs === 0 && b.seedTimeMs !== 0) return 1;
      if (b.seedTimeMs === 0 && a.seedTimeMs !== 0) return -1;
      return a.seedTimeMs - b.seedTimeMs;
    });
  }, [athletes, eventMap, clubMap]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return allEntries.filter(entry => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = entry.athleteName.toLowerCase().includes(q);
        const matchReg = entry.regNumber.toLowerCase().includes(q);
        const matchClub = entry.clubName.toLowerCase().includes(q) || entry.clubCode.toLowerCase().includes(q);
        const matchEv = entry.eventTitle.toLowerCase().includes(q) || entry.eventNumber.toString().includes(q);
        if (!matchName && !matchReg && !matchClub && !matchEv) return false;
      }

      // Event filter
      if (selectedEventFilter !== 'ALL' && entry.eventId !== selectedEventFilter) {
        return false;
      }

      // Gender filter
      if (selectedGenderFilter !== 'ALL' && entry.gender !== selectedGenderFilter) {
        return false;
      }

      // Club filter
      if (selectedClubFilter !== 'ALL' && entry.clubId !== selectedClubFilter) {
        return false;
      }

      // Age filter
      if (selectedAgeFilter !== 'ALL') {
        const ag = customAgeGroups.find(a => a.code === selectedAgeFilter);
        if (ag) {
          if (entry.ageGroup === selectedAgeFilter) {
            // direct code match
          } else if (entry.age >= ag.minAge && entry.age <= ag.maxAge) {
            // age range match
          } else {
            return false;
          }
        } else if (entry.ageGroup !== selectedAgeFilter) {
          return false;
        }
      }

      return true;
    });
  }, [allEntries, searchTerm, selectedEventFilter, selectedGenderFilter, selectedClubFilter, selectedAgeFilter, customAgeGroups]);

  // Unique athletes in filtered set
  const uniqueAthletesCount = useMemo(() => {
    const set = new Set(filteredEntries.map(e => e.athleteId));
    return set.size;
  }, [filteredEntries]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['No', 'No. Register', 'Nama Atlet', 'Gender', 'Usia', 'Kategori Usia', 'Klub', 'Kode Klub', 'No. Lomba', 'Nomor Lomba', 'Seed Time'];
    const rows = filteredEntries.map((e, idx) => [
      idx + 1,
      `"${e.regNumber}"`,
      `"${e.athleteName}"`,
      e.gender === 'MALE' ? 'Putra' : 'Putri',
      e.age,
      `"${formatAgeGroupLabel(e.ageGroup, e.age)}"`,
      `"${e.clubName}"`,
      `"${e.clubCode}"`,
      e.eventNumber,
      `"${e.eventTitle}"`,
      `"${e.seedTime}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Entry_List_${championship.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header and Quick Stats */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 rounded-md">
              Daftar Entri Resmi
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Per {new Date().toLocaleDateString('id-ID')}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Entry List Perlombaan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar seluruh entri perlombaan atlet yang terdaftar per nomor lomba, seed time (waktu masuk), dan klub asal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openPrintModal('entry_list', undefined, selectedClubFilter !== 'ALL' ? selectedClubFilter : undefined)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors cursor-pointer"
            title="Cetak Entry List resmi sesuai format standar formulir registrasi Akuatik Indonesia"
          >
            <Printer className="w-3.5 h-3.5 text-white" />
            <span>Cetak Hasil Entry List</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-700 hover:bg-slate-800 text-white shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Banner Pemberitahuan Format Cetak Resmi */}
      <div className="bg-red-50/80 border border-red-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-600 text-white rounded-lg shrink-0">
            <Printer className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-red-900">Format Cetak Entry List Standar Formulir Registrasi</div>
            <div className="text-[11px] text-red-700 mt-0.5">
              Tata letak cetak persis dokumen resmi: Judul terpisah <span className="font-mono font-semibold">E n t r y   L i s t</span>, baris narahubung klub/coach, kolom akte kelahiran, pemisahan Tgl/Bln/Tahun, Umur, KU, No. Acara, No. Lomba, dan waktu <span className="font-mono font-bold">NT</span>.
            </div>
          </div>
        </div>
        <button
          onClick={() => openPrintModal('entry_list', undefined, selectedClubFilter !== 'ALL' ? selectedClubFilter : undefined)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shrink-0 cursor-pointer shadow-xs transition-colors"
        >
          <span>Pratinjau Cetak Sekarang</span>
        </button>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Entri Nomor</div>
          <div className="text-2xl font-bold text-sky-600 font-mono mt-1">{filteredEntries.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Dari {allEntries.length} entri keseluruhan</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Atlet Terdaftar</div>
          <div className="text-2xl font-bold text-slate-800 font-mono mt-1">{uniqueAthletesCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Perenang berpartisipasi</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Klub / Kontingen</div>
          <div className="text-2xl font-bold text-indigo-600 font-mono mt-1">{clubs.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Perkumpulan renang aktif</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Nomor Lomba</div>
          <div className="text-2xl font-bold text-emerald-600 font-mono mt-1">{events.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Tersedia dalam kejuaraan</div>
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
              placeholder="Cari nama perenang, No. Register, klub, atau nomor lomba..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500 focus:bg-white"
            />
          </div>

          {/* Gender Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            {(['ALL', 'MALE', 'FEMALE'] as const).map(g => (
              <button
                key={g}
                onClick={() => setSelectedGenderFilter(g)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  selectedGenderFilter === g 
                    ? 'bg-slate-900 text-white border-slate-900' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {g === 'ALL' ? 'Semua Gender' : g === 'MALE' ? 'Putra' : 'Putri'}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Nomor Lomba</label>
            <select
              value={selectedEventFilter}
              onChange={e => setSelectedEventFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500"
            >
              <option value="ALL">Semua Nomor Lomba ({events.length})</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>
                  #{ev.eventNumber} - {ev.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Kelompok Usia (Per Usia)</label>
            <select
              value={selectedAgeFilter}
              onChange={e => setSelectedAgeFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500 font-medium"
            >
              <option value="ALL">Semua Kelompok Usia</option>
              {customAgeGroups.filter(ag => ag.isActive).map(ag => (
                <option key={ag.code} value={ag.code}>
                  {ag.name} {ag.label && ag.label !== ag.name ? `(${ag.label})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Klub / Kontingen</label>
            <select
              value={selectedClubFilter}
              onChange={e => setSelectedClubFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500 font-medium"
            >
              <option value="ALL">Semua Klub ({clubs.length} Klub · {clubStats.grandTotalNomor} Nomor Lomba)</option>
              {clubs.map(c => {
                const stat = clubStats.map.get(c.id);
                const count = stat ? stat.totalNomorLomba : 0;
                const aths = stat ? stat.athletesCount : 0;
                return (
                  <option key={c.id} value={c.id}>
                    [{c.code}] {c.name} — {count} Nomor Lomba ({aths} Atlet)
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Rekapitulasi Total Nomor Lomba per Perkumpulan (Klub) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-red-100 text-red-700 rounded-md">
              <Trophy className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                Total Nomor Lomba yang Diikuti oleh Setiap Perkumpulan (Klub)
              </h2>
              <p className="text-[11px] text-slate-500">
                Rekapitulasi resmi kuota nomor lomba per perkumpulan renang peserta kejuaraan.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowClubRecap(!showClubRecap)}
              className="text-xs text-sky-600 hover:text-sky-700 font-semibold cursor-pointer"
            >
              {showClubRecap ? 'Sembunyikan' : 'Tampilkan'}
            </button>
            <button
              onClick={() => openPrintModal('entry_list', undefined, selectedClubFilter !== 'ALL' ? selectedClubFilter : undefined)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Entry List</span>
            </button>
          </div>
        </div>

        {showClubRecap && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {clubStats.list.map(c => {
              const isSelected = selectedClubFilter === c.clubId;
              return (
                <div
                  key={c.clubId}
                  onClick={() => setSelectedClubFilter(isSelected ? 'ALL' : c.clubId)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-red-500 bg-red-50/50 shadow-xs ring-2 ring-red-400/20'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] font-bold text-slate-500 uppercase px-1.5 py-0.5 bg-white border border-slate-200 rounded">
                        {c.code}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 mt-1 truncate" title={c.name}>
                        {c.name}
                      </h3>
                      <div className="text-[10.5px] text-slate-500 mt-0.5">
                        {c.athletesCount} atlet ({c.maleCount} PA / {c.femaleCount} PI)
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base font-black text-red-600 font-mono">
                        {c.totalNomorLomba}
                      </div>
                      <div className="text-[9.5px] font-bold text-slate-400 uppercase tracking-tight">
                        Nomor Lomba
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10.5px]">
                    <span className="text-slate-500">
                      Rata-rata: {c.athletesCount > 0 ? (c.totalNomorLomba / c.athletesCount).toFixed(1) : 0} nomor/atlet
                    </span>
                    <span className={`font-semibold ${isSelected ? 'text-red-700' : 'text-sky-600'}`}>
                      {isSelected ? '✓ Terpilih' : 'Filter →'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Highlighted Banner when Club Filter is Active */}
        {selectedClubFilter !== 'ALL' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-red-800">Filter Aktif:</span>
              <span className="font-extrabold text-red-950">
                {clubStats.map.get(selectedClubFilter)?.name} ({clubStats.map.get(selectedClubFilter)?.code})
              </span>
              <span className="text-red-700">
                — Mengikuti <strong className="font-black text-red-900">{clubStats.map.get(selectedClubFilter)?.totalNomorLomba} Nomor Lomba</strong> ({clubStats.map.get(selectedClubFilter)?.athletesCount} Atlet)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedClubFilter('ALL')}
                className="text-slate-600 hover:text-slate-900 underline text-[11px]"
              >
                Reset Filter
              </button>
              <button
                type="button"
                onClick={() => openPrintModal('entry_list', undefined, selectedClubFilter)}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-[11px] inline-flex items-center gap-1 shadow-xs"
              >
                <Printer className="w-3 h-3" />
                <span>Cetak Entry List Klub Ini</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Entry List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">No. Register</th>
                <th className="py-3 px-4">Nama Atlet</th>
                <th className="py-3 px-4 text-center">Usia</th>
                <th className="py-3 px-4">Klub / Kontingen</th>
                <th className="py-3 px-4">Nomor Lomba</th>
                <th className="py-3 px-4 font-mono text-center">Seed Time</th>
                <th className="py-3 px-4 text-center">Status Lomba</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">Tidak ada entri perlombaan yang cocok</p>
                    <p className="text-[11px] text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter yang dipilih.</p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry, index) => {
                  return (
                    <tr key={`${entry.athleteId}-${entry.eventId}-${index}`} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">
                        {index + 1}
                      </td>

                      {/* No Register */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                          {entry.regNumber}
                        </span>
                      </td>

                      {/* Nama & Gender */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{entry.athleteName}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            entry.gender === 'MALE' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {entry.gender === 'MALE' ? 'L' : 'P'}
                          </span>
                        </div>
                      </td>

                      {/* Usia & Kategori */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="font-bold text-slate-800">{entry.age} Thn</span>
                        <span className="block text-[10px] text-slate-400">
                          {formatAgeGroupLabel(entry.ageGroup, entry.age)}
                        </span>
                      </td>

                      {/* Klub */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block">{entry.clubCode}</span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[160px] block">{entry.clubName}</span>
                      </td>

                      {/* Nomor Lomba */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">
                          <span className="font-mono font-bold text-sky-700 mr-1.5">#{entry.eventNumber}</span>
                          {entry.eventTitle}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {entry.distance}m · {entry.stroke}
                        </div>
                      </td>

                      {/* Seed Time */}
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700 tabular-nums">
                        {entry.seedTime}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          entry.eventStatus === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : entry.eventStatus === 'SEEDED'
                            ? 'bg-sky-100 text-sky-800'
                            : entry.eventStatus === 'IN_PROGRESS'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {entry.eventStatus === 'COMPLETED' ? 'Selesai' :
                           entry.eventStatus === 'SEEDED' ? 'Diundi' :
                           entry.eventStatus === 'IN_PROGRESS' ? 'Berlangsung' : 'Belum Diundi'}
                        </span>
                      </td>

                      {/* Shortcut to Starting list */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedEventId(entry.eventId);
                            setActiveTab('seeding');
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-md border border-sky-200 transition-colors inline-flex items-center gap-1"
                        >
                          <span>Starting List</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
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
