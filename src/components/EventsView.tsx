/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSwimData } from '../context/SwimDataContext';
import { AgeGroupCode, EventRound, Gender, Stroke, SwimEvent } from '../types/swim';
import { STROKE_LABELS, parseTimeToMs, formatAgeGroupLabel, getEventAgeGroupCodes } from '../utils/timeUtils';
import { 
  Plus, 
  Sliders, 
  Trash2, 
  Printer, 
  X, 
  CheckCircle, 
  Clock, 
  Sparkles,
  Edit3,
  Check,
  RotateCcw,
  Layers,
  Copy
} from 'lucide-react';

export const EventsView: React.FC = () => {
  const { 
    events, 
    athletes, 
    addEvent, 
    updateEvent,
    deleteEvent, 
    runAutoSeedingForEvent, 
    runAutoSeedingForAllEvents,
    setSelectedEventId, 
    setActiveTab, 
    openPrintModal,
    customStrokes,
    customAgeGroups,
    getStrokeLabel,
    getAgeGroupLabel,
    getEventAgeGroupsLabel
  } = useSwimData();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [duplicatingFromNumber, setDuplicatingFromNumber] = useState<number | null>(null);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const [eventNumber, setEventNumber] = useState<number>(events.length > 0 ? Math.max(...events.map(e => e.eventNumber)) + 1 : 101);
  const [distance, setDistance] = useState<number>(50);
  const [stroke, setStroke] = useState<Stroke>('FREESTYLE');
  const [gender, setGender] = useState<Gender>('MALE');
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<AgeGroupCode[]>(['AGE_8']);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [isAutoTitle, setIsAutoTitle] = useState<boolean>(true);
  const [round, setRound] = useState<EventRound>('TIMED_FINAL');
  const [session, setSession] = useState<number>(1);
  const [recordTime, setRecordTime] = useState('');
  const [recordHolder, setRecordHolder] = useState('');
  const [recordClub, setRecordClub] = useState('');
  const [recordYear, setRecordYear] = useState<number>(2024);

  // Generate title automatically based on distance, stroke, gender, and selected age groups
  const generateAutoTitle = (
    dist: number, 
    stk: Stroke, 
    gndr: Gender, 
    agCodes: AgeGroupCode[]
  ): string => {
    const genderText = gndr === 'MALE' ? 'Putra' : gndr === 'FEMALE' ? 'Putri' : 'Campuran';
    const strokeObj = customStrokes.find(s => s.code === stk);
    const strokeText = strokeObj ? strokeObj.name : (STROKE_LABELS[stk] || stk);

    const activeList = customAgeGroups.filter(ag => ag.isActive);
    let kuText = '';
    if (activeList.length > 0 && agCodes.length === activeList.length && activeList.every(ag => agCodes.includes(ag.code))) {
      kuText = 'Terbuka / Semua Usia';
    } else if (agCodes.length === 1) {
      const agObj = customAgeGroups.find(a => a.code === agCodes[0]);
      kuText = agObj ? agObj.name : formatAgeGroupLabel(agCodes[0]);
    } else if (agCodes.length > 1) {
      const labels = agCodes.map(c => {
        const ag = customAgeGroups.find(a => a.code === c);
        return ag ? (ag.label || ag.name.split(' ')[0]) : c;
      });
      kuText = `KU ${labels.join(', ')}`;
    } else {
      kuText = 'Semua Usia';
    }

    return `${dist}m ${strokeText} ${genderText} ${kuText}`;
  };

  const handleOpenAddModal = () => {
    setEditingEventId(null);
    setDuplicatingFromNumber(null);
    const nextNum = events.length > 0 ? Math.max(...events.map(e => e.eventNumber)) + 1 : 101;
    const defaultKU = customAgeGroups[0]?.code || 'AGE_8';
    const initialKUs = [defaultKU];
    
    setEventNumber(nextNum);
    setDistance(50);
    setStroke('FREESTYLE');
    setGender('MALE');
    setSelectedAgeGroups(initialKUs);
    setRound('TIMED_FINAL');
    setSession(1);
    setRecordTime('00:26.50');
    setRecordHolder('');
    setRecordClub('');
    setRecordYear(2024);
    setIsAutoTitle(true);
    setCustomTitle(generateAutoTitle(50, 'FREESTYLE', 'MALE', initialKUs));
    setShowAddModal(true);
  };

  const handleOpenEditModal = (event: SwimEvent) => {
    setEditingEventId(event.id);
    setDuplicatingFromNumber(null);
    setEventNumber(event.eventNumber);
    setDistance(event.distance);
    setStroke(event.stroke);
    setGender(event.gender);

    const eventKUs = getEventAgeGroupCodes(event);
    const validKUs = eventKUs.length > 0 ? eventKUs : ['OPEN'];
    setSelectedAgeGroups(validKUs);

    setRound(event.round);
    setSession(event.session);
    setRecordTime(event.meetRecord?.time || '');
    setRecordHolder(event.meetRecord?.holder || '');
    setRecordClub(event.meetRecord?.club || '');
    setRecordYear(event.meetRecord?.year || 2024);
    setCustomTitle(event.title);
    setIsAutoTitle(false);
    setShowAddModal(true);
  };

  const handleOpenDuplicateModal = (sourceEvent: SwimEvent) => {
    setEditingEventId(null);
    setDuplicatingFromNumber(sourceEvent.eventNumber);

    const nextNum = events.length > 0 ? Math.max(...events.map(e => e.eventNumber)) + 1 : 101;
    const eventKUs = getEventAgeGroupCodes(sourceEvent);
    const validKUs = eventKUs.length > 0 ? eventKUs : ['OPEN'];

    setEventNumber(nextNum);
    setDistance(sourceEvent.distance);
    setStroke(sourceEvent.stroke);
    setGender(sourceEvent.gender);
    setSelectedAgeGroups(validKUs);
    setRound(sourceEvent.round);
    setSession(sourceEvent.session);
    setRecordTime(sourceEvent.meetRecord?.time || '');
    setRecordHolder(sourceEvent.meetRecord?.holder || '');
    setRecordClub(sourceEvent.meetRecord?.club || '');
    setRecordYear(sourceEvent.meetRecord?.year || 2024);
    setCustomTitle(sourceEvent.title);
    setIsAutoTitle(false);
    setShowAddModal(true);
  };

  const handleDirectDuplicate = (sourceEvent: SwimEvent) => {
    const nextNum = events.length > 0 ? Math.max(...events.map(e => e.eventNumber)) + 1 : 101;
    const eventKUs = getEventAgeGroupCodes(sourceEvent);
    const primaryAgeGroup = eventKUs[0] || 'OPEN';

    addEvent({
      eventNumber: nextNum,
      title: sourceEvent.title,
      distance: sourceEvent.distance,
      stroke: sourceEvent.stroke,
      gender: sourceEvent.gender,
      ageGroup: eventKUs.length === 1 ? primaryAgeGroup : eventKUs.join(','),
      ageGroups: eventKUs,
      round: sourceEvent.round,
      session: sourceEvent.session,
      meetRecord: sourceEvent.meetRecord ? { ...sourceEvent.meetRecord } : undefined,
    });

    setToastNotification(`Nomor lomba #${sourceEvent.eventNumber} berhasil diduplikat menjadi #${nextNum}!`);
    setTimeout(() => {
      setToastNotification(null);
    }, 4000);
  };

  const toggleAgeGroup = (code: AgeGroupCode) => {
    setSelectedAgeGroups(prev => {
      let next: AgeGroupCode[];
      if (prev.includes(code)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        next = prev.filter(c => c !== code);
      } else {
        next = [...prev, code];
      }
      if (isAutoTitle) {
        setCustomTitle(generateAutoTitle(distance, stroke, gender, next));
      }
      return next;
    });
  };

  const handleDistanceChange = (newDist: number) => {
    setDistance(newDist);
    if (isAutoTitle) {
      setCustomTitle(generateAutoTitle(newDist, stroke, gender, selectedAgeGroups));
    }
  };

  const handleStrokeChange = (newStroke: Stroke) => {
    setStroke(newStroke);
    if (isAutoTitle) {
      setCustomTitle(generateAutoTitle(distance, newStroke, gender, selectedAgeGroups));
    }
  };

  const handleGenderChange = (newGender: Gender) => {
    setGender(newGender);
    if (isAutoTitle) {
      setCustomTitle(generateAutoTitle(distance, stroke, newGender, selectedAgeGroups));
    }
  };

  const handleResetAutoTitle = () => {
    setIsAutoTitle(true);
    setCustomTitle(generateAutoTitle(distance, stroke, gender, selectedAgeGroups));
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedAgeGroups.length === 0) {
      alert('Pilih setidaknya 1 kelompok usia untuk nomor lomba ini.');
      return;
    }

    const titleToUse = customTitle.trim() || generateAutoTitle(distance, stroke, gender, selectedAgeGroups);
    const primaryAgeGroup = selectedAgeGroups[0] || 'OPEN';

    const eventPayload = {
      eventNumber: Number(eventNumber),
      title: titleToUse,
      distance: Number(distance),
      stroke,
      gender,
      ageGroup: selectedAgeGroups.length === 1 ? primaryAgeGroup : selectedAgeGroups.join(','),
      ageGroups: selectedAgeGroups,
      round,
      session: Number(session),
      meetRecord: recordTime ? {
        time: recordTime,
        timeMs: parseTimeToMs(recordTime),
        holder: recordHolder || 'Pemegang Rekor',
        club: recordClub || 'Klub',
        year: Number(recordYear) || 2024,
      } : undefined,
    };

    if (editingEventId) {
      updateEvent(editingEventId, eventPayload);
    } else {
      addEvent(eventPayload);
    }

    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Title & Bulk Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Manajemen Nomor Perlombaan & Jadwal</h1>
          <p className="text-xs text-slate-500">
            Daftar nomor lomba, pengaturan multi-kelompok usia (KU), gaya, jarak, dan status heat
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              runAutoSeedingForAllEvents();
              alert('Auto-seeding selesai untuk semua nomor lomba!');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-sky-600" />
            <span>Auto-Seeding Semua Nomor</span>
          </button>

          <button
            onClick={() => openPrintModal('start_list_all')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Cetak Buku Acara / Start List seluruh nomor lomba"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Start List Semua Nomor</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Nomor Lomba</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastNotification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{toastNotification}</span>
          </div>
          <button 
            onClick={() => setToastNotification(null)}
            className="text-emerald-600 hover:text-emerald-800 p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Events Grid / Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">No. Lomba</th>
                <th className="py-3 px-4">Nama & Kategori Nomor Lomba</th>
                <th className="py-3 px-4">Gaya & Jarak</th>
                <th className="py-3 px-4">Kelompok Usia</th>
                <th className="py-3 px-4 font-mono">Peserta / Seri</th>
                <th className="py-3 px-4">Rekor Kejuaraan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi & Operasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map(event => {
                const registeredCount = athletes.filter(a => a.registeredEvents.some(r => r.eventId === event.id)).length;
                const eventKUs = getEventAgeGroupCodes(event);

                return (
                  <tr key={event.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                      #{event.eventNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{event.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Sesi {event.session} · {event.round.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800">{getStrokeLabel(event.stroke)}</span>
                      <span className="block text-[11px] text-slate-500 font-mono">{event.distance} Meter</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {eventKUs.length <= 1 ? (
                        <span className="font-semibold text-slate-800">
                          {getEventAgeGroupsLabel(event)}
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1">
                            {eventKUs.map(c => {
                              const ag = customAgeGroups.find(a => a.code === c);
                              const shortLabel = ag?.label || (ag?.name ? ag.name.split(' ')[0] : c);
                              return (
                                <span 
                                  key={c}
                                  className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200"
                                  title={ag?.name || c}
                                >
                                  KU {shortLabel}
                                </span>
                              );
                            })}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {eventKUs.length} Kelompok Usia
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums">
                      <span className="font-bold text-slate-900">{registeredCount}</span> atlet
                      <span className="block text-[11px] text-slate-400">{event.heats.length} Seri</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {event.meetRecord ? (
                        <div>
                          <span className="font-mono font-semibold text-amber-700">{event.meetRecord.time}</span>
                          <span className="block text-[10px] text-slate-400 truncate max-w-[130px]">
                            {event.meetRecord.holder} ({event.meetRecord.year})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {event.status === 'COMPLETED' ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Selesai
                        </span>
                      ) : event.status === 'SEEDED' ? (
                        <span className="text-sky-700 font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Ter-seeding
                        </span>
                      ) : (
                        <span className="text-amber-700 font-medium">Belum Seeding</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditModal(event)}
                          className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-md transition-colors cursor-pointer"
                          title="Edit Rincian & Kelompok Usia Nomor Lomba"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Duplikat Nomor Lomba Button */}
                        <button
                          onClick={(e) => {
                            if (e.shiftKey) {
                              handleDirectDuplicate(event);
                            } else {
                              handleOpenDuplicateModal(event);
                            }
                          }}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer flex items-center gap-1 group"
                          title="Duplikat Nomor Lomba (Klik untuk sesuaikan, Shift+Klik untuk duplikat instan)"
                        >
                          <Copy className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                          <span className="sr-only sm:not-sr-only text-[11px] font-semibold text-emerald-700">Duplikat</span>
                        </button>

                        {/* Auto-seed this event */}
                        <button
                          onClick={() => {
                            runAutoSeedingForEvent(event.id);
                            setSelectedEventId(event.id);
                            setActiveTab('seeding');
                          }}
                          className="px-2.5 py-1 text-xs font-medium bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-md transition-colors cursor-pointer"
                          title="Generate Auto Seeding Lintasan"
                        >
                          Seeding
                        </button>

                        {/* Input time */}
                        <button
                          onClick={() => {
                            setSelectedEventId(event.id);
                            setActiveTab('timekeeper');
                          }}
                          className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                          title="Input Waktu Hasil"
                        >
                          Input Waktu
                        </button>

                        {/* Print Start List */}
                        <button
                          onClick={() => openPrintModal('start_list', event.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Cetak Start List / Lembar Pertandingan"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (confirm(`Hapus nomor #${event.eventNumber}: ${event.title}?`)) {
                              deleteEvent(event.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          title="Hapus Nomor Lomba"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal Add / Edit / Duplicate Event with Multiple Age Group Selection */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${duplicatingFromNumber ? 'bg-emerald-600' : 'bg-sky-600'} text-white flex items-center justify-center shadow-xs`}>
                  {duplicatingFromNumber ? <Copy className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingEventId 
                      ? `Edit Nomor Lomba #${eventNumber}` 
                      : duplicatingFromNumber 
                        ? `Duplikat Nomor Lomba #${eventNumber}` 
                        : 'Tambah Nomor Lomba Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {duplicatingFromNumber 
                      ? `Menduplikat rincian dari nomor #${duplicatingFromNumber} menjadi nomor baru #${eventNumber}` 
                      : 'Konfigurasi jarak, gaya, gender, babak, dan kombinasi kelompok usia lomba'}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 space-y-5 overflow-y-auto">
              {/* Duplication Quick Helper Banner */}
              {duplicatingFromNumber !== null && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2 text-emerald-950 font-medium">
                    <Copy className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Salinan dari <strong>Nomor #{duplicatingFromNumber}</strong>. Diberikan nomor baru otomatis <strong>#{eventNumber}</strong>.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const toggledGender: Gender = gender === 'MALE' ? 'FEMALE' : gender === 'FEMALE' ? 'MALE' : 'MIXED';
                      handleGenderChange(toggledGender);
                    }}
                    className="self-start sm:self-auto px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300 rounded-lg transition-colors shadow-2xs cursor-pointer text-xs flex items-center gap-1.5"
                    title="Ubah gender secara instan (Putra ↔ Putri)"
                  >
                    <span>🔄 {gender === 'MALE' ? 'Ubah ke Putri' : gender === 'FEMALE' ? 'Ubah ke Putra' : 'Ubah Gender'}</span>
                  </button>
                </div>
              )}

              {/* Event Core Config Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Acara (Event #) *
                  </label>
                  <input
                    type="number"
                    required
                    value={eventNumber}
                    onChange={e => setEventNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jarak Tempuh (Meter) *
                  </label>
                  <select
                    value={distance}
                    onChange={e => handleDistanceChange(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500 font-bold"
                  >
                    <option value={25}>25 Meter (Sprint Usia Dini)</option>
                    <option value={50}>50 Meter</option>
                    <option value={100}>100 Meter</option>
                    <option value={200}>200 Meter</option>
                    <option value={400}>400 Meter</option>
                    <option value={800}>800 Meter</option>
                    <option value={1500}>1500 Meter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gaya Renang *
                  </label>
                  <select
                    value={stroke}
                    onChange={e => handleStrokeChange(e.target.value as Stroke)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500 font-medium"
                  >
                    {customStrokes.filter(s => s.isActive).map(s => (
                      <option key={s.code} value={s.code}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Gender *
                  </label>
                  <select
                    value={gender}
                    onChange={e => handleGenderChange(e.target.value as Gender)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500"
                  >
                    <option value="MALE">Putra</option>
                    <option value="FEMALE">Putri</option>
                    <option value="MIXED">Campuran / Mix</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Babak Perlombaan *
                  </label>
                  <select
                    value={round}
                    onChange={e => setRound(e.target.value as EventRound)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500"
                  >
                    <option value="TIMED_FINAL">Final Berdasarkan Waktu (Timed Final)</option>
                    <option value="PRELIM">Babak Penyisihan (Prelims / Seri)</option>
                    <option value="FINAL">Babak Final</option>
                  </select>
                </div>
              </div>

              {/* Multi-Selection: Kelompok Usia (Bisa memilih beberapa KU) */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-900">
                    Pilih Kelompok Usia yang Diperlombakan (Bisa Pilih Lebih dari 1 Kategori) *
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Centang satu atau beberapa kategori usia yang dapat mendaftar pada nomor acara ini.
                  </p>
                </div>

                {/* Age Group Multi-Select Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {customAgeGroups.filter(ag => ag.isActive).map(ag => {
                    const isChecked = selectedAgeGroups.includes(ag.code);
                    const letter = ag.label || ag.code.replace('AGE_', '');

                    return (
                      <div
                        key={ag.code}
                        onClick={() => toggleAgeGroup(ag.code)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isChecked 
                            ? 'bg-sky-50/80 border-sky-500 shadow-xs ring-1 ring-sky-500/30' 
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                          isChecked ? 'bg-sky-600 text-white' : 'border border-slate-300 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-black ${isChecked ? 'text-sky-950' : 'text-slate-800'}`}>
                              KU {letter}
                            </span>
                            {ag.minAge === ag.maxAge ? (
                              <span className="text-[10px] text-slate-500 font-mono">
                                ({ag.minAge} th)
                              </span>
                            ) : ag.maxAge >= 90 ? (
                              <span className="text-[10px] text-slate-500 font-mono">
                                ({ag.minAge}+ th)
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono">
                                ({ag.minAge}-{ag.maxAge} th)
                              </span>
                            )}
                          </div>
                          <span className="block text-[11px] text-slate-500 truncate">
                            {ag.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Age Groups Summary Banner */}
                <div className="bg-sky-50/70 border border-sky-200 rounded-lg p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sky-900">Kelompok Usia Terpilih:</span>
                    <span className="font-semibold text-sky-800">
                      {selectedAgeGroups.length > 0 ? (
                        selectedAgeGroups.map(c => {
                          const ag = customAgeGroups.find(a => a.code === c);
                          return ag?.label || (ag?.name ? ag.name.split(' ')[0] : c);
                        }).join(', ')
                      ) : (
                        <span className="text-rose-600">Belum ada yang dipilih!</span>
                      )}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-sky-900 bg-sky-200/70 px-2 py-0.5 rounded-full shrink-0">
                    {selectedAgeGroups.length} Kategori
                  </span>
                </div>
              </div>

              {/* Event Title with Auto-format & Custom override */}
              <div className="border-t border-slate-200 pt-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Nama / Judul Acara Nomor Lomba *
                  </label>
                  <button
                    type="button"
                    onClick={handleResetAutoTitle}
                    className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
                    title="Buat ulang judul nomor lomba secara otomatis berdasarkan pilihan jarak, gaya, gender, dan KU"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Gunakan Format Otomatis</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={e => {
                    setCustomTitle(e.target.value);
                    setIsAutoTitle(false);
                  }}
                  placeholder="Contoh: 50m Gaya Bebas Putra KU A, B"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-medium focus:outline-hidden focus:border-sky-500"
                />
                <span className="text-[10px] text-slate-400 block">
                  Judul ini akan ditampilkan pada Hasil Cetak Start List, Entry List, Nomor List, dan Papan Nilai.
                </span>
              </div>

              {/* Meet Record Section (Optional) */}
              <div className="border-t border-slate-200 pt-3 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  Informasi Rekor Kejuaraan Sebelumnya (Opsional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Waktu Rekor</label>
                    <input
                      type="text"
                      value={recordTime}
                      onChange={e => setRecordTime(e.target.value)}
                      placeholder="00:26.50"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Pemegang Rekor</label>
                    <input
                      type="text"
                      value={recordHolder}
                      onChange={e => setRecordHolder(e.target.value)}
                      placeholder="Nama Perenang"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Tahun Rekor</label>
                    <input
                      type="number"
                      value={recordYear}
                      onChange={e => setRecordYear(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={selectedAgeGroups.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {editingEventId 
                      ? 'Simpan Perubahan Nomor Lomba' 
                      : duplicatingFromNumber 
                        ? `Simpan Duplikat Sebagai #${eventNumber}` 
                        : 'Tambahkan Nomor Lomba'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
