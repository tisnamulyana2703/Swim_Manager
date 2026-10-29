/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useSwimData } from '../context/SwimDataContext';
import { Athlete, AgeGroupCode } from '../types/swim';
import { calculateAge, determineAgeGroup, parseTimeToMs, generateRegisterNumber, formatAgeGroupLabel } from '../utils/timeUtils';
import { 
  Plus, 
  Search, 
  Trash2, 
  Building2, 
  UserPlus, 
  X, 
  Check, 
  Sparkles,
  Edit2,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import { ExcelImportModal } from './ExcelImportModal';

export const AthletesView: React.FC = () => {
  const { 
    athletes, 
    clubs, 
    events, 
    championship, 
    addAthlete, 
    updateAthlete, 
    deleteAthlete,
    deleteAllAthletes,
    addClub,
    deleteClub
  } = useSwimData();

  const [activeSubTab, setActiveSubTab] = useState<'athletes' | 'clubs'>('athletes');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKU, setFilterKU] = useState<string>('ALL');
  const [filterGender, setFilterGender] = useState<string>('ALL');
  const [filterClub, setFilterClub] = useState<string>('ALL');

  // Modal Athlete
  const [showAthleteModal, setShowAthleteModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [includeClubsInDelete, setIncludeClubsInDelete] = useState(false);
  const [editingAthleteId, setEditingAthleteId] = useState<string | null>(null);
  const [athName, setAthName] = useState('');
  const [athRegNumber, setAthRegNumber] = useState('');
  const [athNik, setAthNik] = useState('');
  const [athGender, setAthGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [athBirthDate, setAthBirthDate] = useState('2011-05-15');
  const [athClubId, setAthClubId] = useState(clubs[0]?.id || '');
  const [selectedEventsList, setSelectedEventsList] = useState<{ eventId: string; seedTime: string }[]>([]);

  // Modal Club
  const [showClubModal, setShowClubModal] = useState(false);
  const [clubCode, setClubCode] = useState('');
  const [clubName, setClubName] = useState('');
  const [clubCity, setClubCity] = useState('');
  const [clubProvince, setClubProvince] = useState('');
  const [clubCoach, setClubCoach] = useState('');
  const [clubPhone, setClubPhone] = useState('');

  // Live preview of KU
  const previewAge = useMemo(() => {
    return calculateAge(athBirthDate, championship.cutoffDate);
  }, [athBirthDate, championship.cutoffDate]);

  const previewKU = useMemo(() => {
    return determineAgeGroup(previewAge);
  }, [previewAge]);

  // Filtered Athletes
  const filteredAthletes = useMemo(() => {
    return athletes.filter(ath => {
      const q = searchQuery.toLowerCase();
      const matchSearch = ath.name.toLowerCase().includes(q) || 
                          (ath.regNumber && ath.regNumber.toLowerCase().includes(q)) ||
                          (ath.nik && ath.nik.includes(q));

      let matchKU = filterKU === 'ALL';
      if (!matchKU) {
        if (filterKU === 'AGE_14_ABOVE') {
          matchKU = ath.age >= 14 || ath.ageGroup === 'AGE_14_ABOVE' || ath.ageGroup === 'AGE_14' || ath.ageGroup === 'AGE_15' || ath.ageGroup === 'AGE_16_18' || ath.ageGroup === 'AGE_19_ABOVE';
        } else if (filterKU === 'AGE_6_UNDER') {
          matchKU = ath.age <= 6 || ath.ageGroup === 'AGE_6_UNDER';
        } else if (ath.ageGroup === filterKU) {
          matchKU = true;
        } else if (filterKU.startsWith('AGE_')) {
          const targetAge = parseInt(filterKU.replace('AGE_', ''), 10);
          if (!isNaN(targetAge) && ath.age === targetAge) {
            matchKU = true;
          }
        }
      }

      const matchGender = filterGender === 'ALL' || ath.gender === filterGender;
      const matchClub = filterClub === 'ALL' || ath.clubId === filterClub;

      return matchSearch && matchKU && matchGender && matchClub;
    });
  }, [athletes, searchQuery, filterKU, filterGender, filterClub]);

  const handleOpenAddAthlete = () => {
    setEditingAthleteId(null);
    setAthName('');
    setAthRegNumber('');
    setAthNik('');
    setAthGender('MALE');
    setAthBirthDate('2011-05-15');
    setAthClubId(clubs[0]?.id || '');
    setSelectedEventsList([]);
    setShowAthleteModal(true);
  };

  const handleOpenEditAthlete = (ath: Athlete) => {
    setEditingAthleteId(ath.id);
    setAthName(ath.name);
    setAthRegNumber(ath.regNumber || generateRegisterNumber(ath.name));
    setAthNik(ath.nik || '');
    setAthGender(ath.gender);
    setAthBirthDate(ath.birthDate);
    setAthClubId(ath.clubId);
    setSelectedEventsList(ath.registeredEvents.map(r => ({ eventId: r.eventId, seedTime: r.seedTime })));
    setShowAthleteModal(true);
  };

  const handleSaveAthlete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!athName.trim() || !athClubId) return;

    const finalRegNumber = athRegNumber.trim() || generateRegisterNumber(athName, athletes.length + 1);

    if (editingAthleteId) {
      updateAthlete(editingAthleteId, {
        name: athName,
        regNumber: finalRegNumber,
        nik: athNik || finalRegNumber,
        gender: athGender,
        birthDate: athBirthDate,
        clubId: athClubId,
        registeredEvents: selectedEventsList.map(r => ({
          eventId: r.eventId,
          seedTime: r.seedTime || '00:00.00',
          seedTimeMs: parseTimeToMs(r.seedTime),
        })),
      });
    } else {
      addAthlete({
        name: athName,
        regNumber: finalRegNumber,
        nik: athNik || finalRegNumber,
        gender: athGender,
        birthDate: athBirthDate,
        clubId: athClubId,
        registeredEvents: selectedEventsList,
      });
    }

    setShowAthleteModal(false);
  };

  const handleSaveClub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubCode.trim() || !clubName.trim()) return;

    addClub({
      code: clubCode.toUpperCase(),
      name: clubName,
      city: clubCity || 'Jakarta',
      province: clubProvince || 'DKI Jakarta',
      coach: clubCoach || '-',
      contactNumber: clubPhone || '-',
    });

    setClubCode('');
    setClubName('');
    setClubCity('');
    setClubProvince('');
    setClubCoach('');
    setClubPhone('');
    setShowClubModal(false);
  };

  const toggleEventRegistration = (eventId: string) => {
    if (selectedEventsList.some(e => e.eventId === eventId)) {
      setSelectedEventsList(prev => prev.filter(e => e.eventId !== eventId));
    } else {
      setSelectedEventsList(prev => [...prev, { eventId, seedTime: '00:30.00' }]);
    }
  };

  const updateEventSeedTime = (eventId: string, time: string) => {
    setSelectedEventsList(prev => prev.map(e => e.eventId === eventId ? { ...e, seedTime: time } : e));
  };

  return (
    <div className="space-y-6">
      {/* Sub-header & Segmented Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Pendaftaran Peserta, Atlet & Perkumpulan</h1>
          <p className="text-xs text-slate-500">
            Penetapan otomatis Kelompok Umur (KU) berdasarkan tanggal lahir & batas cutoff ({championship.cutoffDate})
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented Control */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setActiveSubTab('athletes')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeSubTab === 'athletes' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daftar Atlet ({athletes.length})
            </button>
            <button
              onClick={() => setActiveSubTab('clubs')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeSubTab === 'clubs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Klub / Kontingen ({clubs.length})
            </button>
          </div>

          {activeSubTab === 'athletes' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(true)}
                disabled={athletes.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 hover:border-rose-600 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Hapus seluruh data atlet pendaftar"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus All Data</span>
              </button>
              <button
                type="button"
                onClick={() => setShowExcelModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                title="Impor daftar atlet dari berkas Excel (.xlsx, .xls, .csv)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Impor Excel</span>
              </button>
              <button
                type="button"
                onClick={handleOpenAddAthlete}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Daftar Atlet Baru</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(true)}
                disabled={athletes.length === 0 && clubs.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 hover:border-rose-600 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Hapus seluruh data pendaftar & klub"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus All Data</span>
              </button>
              <button
                type="button"
                onClick={() => setShowClubModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Tambah Klub</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {activeSubTab === 'athletes' && (
        <div className="space-y-4">
          {/* Filters & Search Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nama atlet atau No. Register..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterKU}
                onChange={e => setFilterKU(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
              >
                <option value="ALL">Semua Kelompok Usia</option>
                <option value="AGE_6_UNDER">A</option>
                <option value="AGE_7">B</option>
                <option value="AGE_8">C</option>
                <option value="AGE_9">D</option>
                <option value="AGE_10">E</option>
                <option value="AGE_11">F</option>
                <option value="AGE_12">G</option>
                <option value="AGE_13">H</option>
                <option value="AGE_14_ABOVE">I</option>
                <option value="OPEN">Terbuka (Open)</option>
              </select>

              <select
                value={filterGender}
                onChange={e => setFilterGender(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
              >
                <option value="ALL">Semua Gender</option>
                <option value="MALE">Putra</option>
                <option value="FEMALE">Putri</option>
              </select>

              <select
                value={filterClub}
                onChange={e => setFilterClub(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden max-w-[180px] truncate"
              >
                <option value="ALL">Semua Klub</option>
                {clubs.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Athletes Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">No.</th>
                    <th className="py-3 px-4">Nama Lengkap & No. Register</th>
                    <th className="py-3 px-4">Gender</th>
                    <th className="py-3 px-4">Tgl Lahir / Usia</th>
                    <th className="py-3 px-4">Kelompok Usia</th>
                    <th className="py-3 px-4">Asal Klub</th>
                    <th className="py-3 px-4">Nomor Lomba Terdaftar</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAthletes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Tidak ada data atlet yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAthletes.map((ath, idx) => {
                      const club = clubs.find(c => c.id === ath.clubId);
                      return (
                        <tr key={ath.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{ath.name}</div>
                            <div className="font-mono text-[11px] text-sky-700 font-semibold">
                              {ath.regNumber || ath.nik}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={ath.gender === 'MALE' ? 'text-sky-700 font-medium' : 'text-pink-700 font-medium'}>
                              {ath.gender === 'MALE' ? 'Putra' : 'Putri'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono tabular-nums">
                            {ath.birthDate} ({ath.age} th)
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {formatAgeGroupLabel(ath.ageGroup, ath.age)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-800">{club?.code || '-'}</span>
                            <span className="block text-[11px] text-slate-400 truncate max-w-[140px]">{club?.name}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              {ath.registeredEvents.map(r => {
                                const ev = events.find(e => e.id === r.eventId);
                                return (
                                  <div key={r.eventId} className="text-[11px] text-slate-600">
                                    <span className="font-medium">#{ev?.eventNumber || '?'}:</span> {ev?.title?.split(' ')[0]} {ev?.title?.split(' ')[1]}
                                    <span className="font-mono text-slate-400 ml-1">({r.seedTime})</span>
                                  </div>
                                );
                              })}
                              {ath.registeredEvents.length === 0 && (
                                <span className="text-slate-400 italic">Belum ada nomor</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEditAthlete(ath)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                                title="Edit Biodata & Nomor Lomba"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Hapus atlet ${ath.name}?`)) {
                                    deleteAthlete(ath.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Hapus Atlet"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* Clubs Tab */}
      {activeSubTab === 'clubs' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Kode Klub</th>
                  <th className="py-3 px-4">Nama Perkumpulan / Klub</th>
                  <th className="py-3 px-4">Kota / Provinsi</th>
                  <th className="py-3 px-4">Pelatih Kepala (Head Coach)</th>
                  <th className="py-3 px-4">Kontak Ofisial</th>
                  <th className="py-3 px-4 font-mono">Jumlah Atlet</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clubs.map(club => {
                  const athleteCount = athletes.filter(a => a.clubId === club.id).length;
                  return (
                    <tr key={club.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-sky-800">{club.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{club.name}</td>
                      <td className="py-3 px-4 text-slate-600">{club.city}, {club.province}</td>
                      <td className="py-3 px-4 text-slate-700">{club.coach}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{club.contactNumber}</td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-900 font-bold">{athleteCount}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`Hapus klub ${club.name}? Data atlet terkait mungkin perlu diperbarui.`)) {
                              deleteClub(club.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Hapus Klub"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Athlete */}
      {showAthleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                {editingAthleteId ? 'Perbarui Biodata Atlet' : 'Registrasi Atlet Baru'}
              </h3>
              <button 
                onClick={() => setShowAthleteModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAthlete} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap Atlet *
                  </label>
                  <input
                    type="text"
                    required
                    value={athName}
                    onChange={e => setAthName(e.target.value)}
                    placeholder="Contoh: Kenzo Alfarizi Pratama"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Register Atlet (Sistem Otomatis)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg font-mono font-bold text-sky-800">
                      {athRegNumber || (athName.trim() ? generateRegisterNumber(athName, athletes.length + 1) : 'REG-XXX-###')}
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200 shrink-0">
                      Otomatis
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Dibuat otomatis oleh sistem berdasarkan nama perenang
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jenis Kelamin *
                  </label>
                  <select
                    value={athGender}
                    onChange={e => setAthGender(e.target.value as 'MALE' | 'FEMALE')}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500"
                  >
                    <option value="MALE">Putra (Male)</option>
                    <option value="FEMALE">Putri (Female)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Asal Klub / Kontingen *
                  </label>
                  <select
                    value={athClubId}
                    onChange={e => setAthClubId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500"
                  >
                    {clubs.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Lahir *
                  </label>
                  <input
                    type="date"
                    required
                    value={athBirthDate}
                    onChange={e => setAthBirthDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                {/* Automatic KU Preview Card */}
                <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-sky-700 block">Kategori Umur Otomatis</span>
                    <span className="text-sm font-extrabold text-sky-900">{previewKU.replace('_', ' ')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-sky-700 block">Usia Per Cutoff</span>
                    <span className="text-sm font-mono font-bold text-sky-900">{previewAge} Tahun</span>
                  </div>
                </div>
              </div>

              {/* Event Registrations with Seed Time */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Pilih Nomor Lomba & Masukkan Seed Time (Waktu Terbaik Sebelumnya)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {selectedEventsList.length} nomor dipilih
                  </span>
                </div>

                <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {events.map(ev => {
                    const isSelected = selectedEventsList.some(r => r.eventId === ev.id);
                    const selectedItem = selectedEventsList.find(r => r.eventId === ev.id);

                    return (
                      <div key={ev.id} className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-50">
                        <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleEventRegistration(ev.id)}
                            className="rounded-sm border-slate-300 text-sky-600 focus:ring-sky-500"
                          />
                          <div className="truncate">
                            <span className="font-semibold text-slate-800 text-xs">#{ev.eventNumber}:</span>{' '}
                            <span className="text-xs text-slate-700">{ev.title}</span>
                          </div>
                        </label>

                        {isSelected && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[11px] text-slate-500">Seed Time:</span>
                            <input
                              type="text"
                              value={selectedItem?.seedTime || ''}
                              onChange={e => updateEventSeedTime(ev.id, e.target.value)}
                              placeholder="00:26.50"
                              className="w-24 px-2 py-1 text-xs border border-slate-300 rounded font-mono text-center focus:outline-hidden focus:border-sky-500"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAthleteModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors"
                >
                  {editingAthleteId ? 'Simpan Perubahan' : 'Daftarkan Atlet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Club */}
      {showClubModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Tambah Perkumpulan / Klub Baru</h3>
              <button 
                onClick={() => setShowClubModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClub} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Singkatan Klub *
                </label>
                <input
                  type="text"
                  required
                  value={clubCode}
                  onChange={e => setClubCode(e.target.value)}
                  placeholder="Contoh: MILL-JKT, JAQ, PETRO"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono uppercase focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Resmi Perkumpulan / Klub *
                </label>
                <input
                  type="text"
                  required
                  value={clubName}
                  onChange={e => setClubName(e.target.value)}
                  placeholder="Contoh: Millennium Aquatic Jakarta"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kota / Kabupaten</label>
                  <input
                    type="text"
                    value={clubCity}
                    onChange={e => setClubCity(e.target.value)}
                    placeholder="Jakarta Selatan"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Provinsi</label>
                  <input
                    type="text"
                    value={clubProvince}
                    onChange={e => setClubProvince(e.target.value)}
                    placeholder="DKI Jakarta"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pelatih Kepala</label>
                  <input
                    type="text"
                    value={clubCoach}
                    onChange={e => setClubCoach(e.target.value)}
                    placeholder="Nama Pelatih"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Kontak</label>
                  <input
                    type="text"
                    value={clubPhone}
                    onChange={e => setClubPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowClubModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs"
                >
                  Simpan Klub
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
      />

      {/* Delete All Data Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4 text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 text-center mb-1">
                Hapus Seluruh Data Pendaftar?
              </h3>
              <p className="text-xs text-slate-600 text-center mb-4">
                Tindakan ini akan menghapus <strong>{athletes.length} atlet</strong> pendaftar secara permanen beserta seluruh entri nomor lomba yang diikuti.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mb-4 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Peringatan Penting</span>
                </div>
                <p className="text-[11px] text-amber-700">
                  Data yang dihapus tidak dapat dipulihkan. Pengundian seri (heat) yang telah berjalan juga akan dikosongkan.
                </p>
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer mb-5 hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={includeClubsInDelete}
                  onChange={e => setIncludeClubsInDelete(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 mt-0.5"
                />
                <div className="text-xs text-slate-700">
                  <span className="font-semibold block">Kosongkan juga data klub renang</span>
                  <span className="text-[11px] text-slate-500">Hapus seluruh ({clubs.length}) klub terdaftar di database</span>
                </div>
              </label>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteAllModal(false);
                    setIncludeClubsInDelete(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteAllAthletes(includeClubsInDelete);
                    setShowDeleteAllModal(false);
                    setIncludeClubsInDelete(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Ya, Hapus Semua Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
