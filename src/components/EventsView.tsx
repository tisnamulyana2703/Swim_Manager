/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSwimData } from '../context/SwimDataContext';
import { AgeGroupCode, EventRound, Gender, Stroke, SwimEvent } from '../types/swim';
import { STROKE_LABELS, parseTimeToMs, formatAgeGroupLabel } from '../utils/timeUtils';
import { 
  Plus, 
  Sliders, 
  Trash2, 
  Play, 
  Printer, 
  X, 
  CheckCircle, 
  Clock, 
  Sparkles 
} from 'lucide-react';

export const EventsView: React.FC = () => {
  const { 
    events, 
    athletes, 
    addEvent, 
    deleteEvent, 
    runAutoSeedingForEvent, 
    runAutoSeedingForAllEvents,
    setSelectedEventId, 
    setActiveTab, 
    openPrintModal 
  } = useSwimData();

  const [showAddModal, setShowAddModal] = useState(false);
  const [eventNumber, setEventNumber] = useState<number>(events.length > 0 ? Math.max(...events.map(e => e.eventNumber)) + 1 : 101);
  const [distance, setDistance] = useState<number>(50);
  const [stroke, setStroke] = useState<Stroke>('FREESTYLE');
  const [gender, setGender] = useState<Gender>('MALE');
  const [ageGroup, setAgeGroup] = useState<AgeGroupCode>('AGE_14_ABOVE');
  const [round, setRound] = useState<EventRound>('TIMED_FINAL');
  const [session, setSession] = useState<number>(1);
  const [recordTime, setRecordTime] = useState('00:26.50');
  const [recordHolder, setRecordHolder] = useState('');
  const [recordClub, setRecordClub] = useState('');
  const [recordYear, setRecordYear] = useState<number>(2023);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();

    const genderText = gender === 'MALE' ? 'Putra' : gender === 'FEMALE' ? 'Putri' : 'Mix';
    const kuText = formatAgeGroupLabel(ageGroup);
    const title = `${distance}m ${STROKE_LABELS[stroke]} ${genderText} ${kuText}`;

    addEvent({
      eventNumber: Number(eventNumber),
      title,
      distance: Number(distance),
      stroke,
      gender,
      ageGroup,
      round,
      session: Number(session),
      meetRecord: recordTime ? {
        time: recordTime,
        timeMs: parseTimeToMs(recordTime),
        holder: recordHolder || 'Pemegang Rekor',
        club: recordClub || 'Klub',
        year: Number(recordYear) || 2024,
      } : undefined,
    });

    setShowAddModal(false);
    setEventNumber(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Title & Bulk Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Manajemen Nomor Perlombaan & Jadwal</h1>
          <p className="text-xs text-slate-500">
            Daftar nomor lomba, pengaturan gaya, jarak, kategori umur, babak, dan status heat
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
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Nomor Lomba</span>
          </button>
        </div>
      </div>

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
                      <span className="font-medium text-slate-800">{STROKE_LABELS[event.stroke]}</span>
                      <span className="block text-[11px] text-slate-500 font-mono">{event.distance} Meter</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {formatAgeGroupLabel(event.ageGroup)}
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
                        {/* Auto-seed this event */}
                        <button
                          onClick={() => {
                            runAutoSeedingForEvent(event.id);
                            setSelectedEventId(event.id);
                            setActiveTab('seeding');
                          }}
                          className="px-2.5 py-1 text-xs font-medium bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-md transition-colors"
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
                          className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
                          title="Input Waktu Hasil"
                        >
                          Input Waktu
                        </button>

                        {/* Print Start List */}
                        <button
                          onClick={() => openPrintModal('start_list', event.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
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
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
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

      {/* Modal Add Event */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Tambah Nomor Lomba Baru</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                    onChange={e => setDistance(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500 font-bold"
                  >
                    <option value={25}>25 Meter (Sprint Pemula / KU Usia Dini)</option>
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
                    onChange={e => setStroke(e.target.value as Stroke)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500"
                  >
                    <option value="FREESTYLE">Gaya Bebas</option>
                    <option value="BACKSTROKE">Gaya Punggung</option>
                    <option value="BREASTSTROKE">Gaya Dada</option>
                    <option value="BUTTERFLY">Gaya Kupu-kupu</option>
                    <option value="INDIVIDUAL_MEDLEY">Gaya Ganti Perorangan</option>
                    <option value="RELAY_FREESTYLE">Estafet Gaya Bebas</option>
                    <option value="RELAY_MEDLEY">Estafet Gaya Ganti</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Gender *
                  </label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as Gender)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500"
                  >
                    <option value="MALE">Putra</option>
                    <option value="FEMALE">Putri</option>
                    <option value="MIXED">Campuran / Mix</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelompok Usia (Per Usia) *
                  </label>
                  <select
                    value={ageGroup}
                    onChange={e => setAgeGroup(e.target.value as AgeGroupCode)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500"
                  >
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

              {/* Meet Record Section */}
              <div className="border-t border-slate-200 pt-3 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  Informasi Rekor Kejuaraan Sebelumnya (Opsional)
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Waktu Rekor</label>
                    <input
                      type="text"
                      value={recordTime}
                      onChange={e => setRecordTime(e.target.value)}
                      placeholder="00:26.50"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Pemegang Rekor</label>
                    <input
                      type="text"
                      value={recordHolder}
                      onChange={e => setRecordHolder(e.target.value)}
                      placeholder="Nama Perenang"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Tahun Rekor</label>
                    <input
                      type="number"
                      value={recordYear}
                      onChange={e => setRecordYear(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs"
                >
                  Simpan Nomor Lomba
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
