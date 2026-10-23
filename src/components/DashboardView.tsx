/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
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
  Settings
} from 'lucide-react';
import { STROKE_LABELS } from '../utils/timeUtils';

export const DashboardView: React.FC = () => {
  const { 
    championship, 
    athletes, 
    clubs, 
    events, 
    incidents, 
    recordBreakers,
    setActiveTab, 
    setSelectedEventId, 
    runAutoSeedingForAllEvents,
    openPrintModal 
  } = useSwimData();

  const totalHeats = events.reduce((acc, ev) => acc + ev.heats.length, 0);
  const completedEvents = events.filter(e => e.status === 'COMPLETED').length;
  const inProgressEvents = events.filter(e => e.status === 'IN_PROGRESS' || e.status === 'SEEDED').length;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner with Aquatic Center Arena */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm text-white">
        <div className="absolute inset-0">
          <img 
            src="/src/assets/images/aquatic_center_arena_1792667437882.jpg"
            alt="Stadion Akuatik Perlombaan Renang"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
        </div>

        <div className="relative p-6 sm:p-8 lg:p-10 max-w-4xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400">
            <span>Sistem Informasi & Manajemen Perlombaan Akuatik Resmi</span>
            <span aria-hidden="true">·</span>
            <span>Standar World Aquatics</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white text-balance leading-tight">
            {championship.name}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            {championship.subTitle} · {championship.venue} ({championship.poolLength}, {championship.poolLanes} Lintasan)
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => {
                runAutoSeedingForAllEvents();
                alert('Auto-seeding selesai untuk seluruh nomor lomba yang terdaftar!');
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
              <span>Jalankan Auto-Seeding Semua Nomor</span>
            </button>

            <button
              onClick={() => {
                const firstPending = events.find(e => e.status === 'SEEDED' || e.status === 'IN_PROGRESS') || events[0];
                if (firstPending) {
                  setSelectedEventId(firstPending.id);
                  setActiveTab('timekeeper');
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs text-sm font-semibold rounded-lg border border-white/15 transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>Input Hasil Waktu Seri</span>
            </button>

            <button
              onClick={() => openPrintModal('official_minutes')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs text-sm font-semibold rounded-lg border border-white/15 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-300" />
              <span>Buka Berita Acara Lomba</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs text-sm font-semibold rounded-lg border border-white/15 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-sky-300" />
              <span>Pengaturan Lomba & Perangkat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Atlet Terdaftar</span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {athletes.length}
          </div>
          <span className="text-[11px] text-slate-400">Putra & Putri</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Klub / Kontingen</span>
            <Flag className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {clubs.length}
          </div>
          <span className="text-[11px] text-slate-400">Seluruh Indonesia</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Nomor Lomba</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {events.length}
          </div>
          <span className="text-[11px] text-slate-400">{completedEvents} Nomor Selesai</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Seri</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {totalHeats}
          </div>
          <span className="text-[11px] text-slate-400">Babak & Seri Terbentuk</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Rekor Tercipta</span>
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono tabular-nums">
            {recordBreakers.length}
          </div>
          <span className="text-[11px] text-slate-400">Rekor Kejuaraan</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Kasus DQ / Pelanggaran</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 font-mono tabular-nums">
            {incidents.length}
          </div>
          <span className="text-[11px] text-slate-400">Tercatat di BA</span>
        </div>
      </div>

      {/* 2-Column Split: Event Progress & Technical Officials */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column (2 spans): Active & Programmed Events */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Jadwal & Status Nomor Perlombaan</h2>
              <p className="text-xs text-slate-500">Pantau kemajuan setiap nomor lomba, heat, dan hasil akhir</p>
            </div>
            <button
              onClick={() => setActiveTab('events')}
              className="text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline"
            >
              Kelola Semua Nomor →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {events.map(event => {
              const regCount = athletes.filter(a => a.registeredEvents.some(r => r.eventId === event.id)).length;
              return (
                <div key={event.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="flex-shrink-0 w-11 h-9 rounded-md bg-slate-100 text-slate-800 font-mono font-bold text-xs flex items-center justify-center">
                      #{event.eventNumber}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        {event.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>{STROKE_LABELS[event.stroke]}</span>
                        <span aria-hidden="true">·</span>
                        <span>{event.distance}m</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{regCount} Atlet</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{event.heats.length} Seri</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Status Label */}
                    <span className="text-xs font-medium">
                      {event.status === 'COMPLETED' ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Selesai
                        </span>
                      ) : event.status === 'SEEDED' ? (
                        <span className="text-sky-700 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Ter-seeding
                        </span>
                      ) : (
                        <span className="text-amber-700">Belum Seeding</span>
                      )}
                    </span>

                    {/* Quick Button */}
                    <button
                      onClick={() => {
                        setSelectedEventId(event.id);
                        if (event.status === 'COMPLETED') {
                          setActiveTab('results');
                        } else if (event.status === 'SEEDED') {
                          setActiveTab('timekeeper');
                        } else {
                          setActiveTab('seeding');
                        }
                      }}
                      className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md transition-colors"
                    >
                      {event.status === 'COMPLETED' ? 'Lihat Hasil' : 'Proses'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (1 span): Meet Officials & Rules */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">Perangkat Pertandingan Resmi</h3>
              </div>
              <button
                onClick={() => setActiveTab('settings')}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Pengaturan</span>
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="pb-2 border-b border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Technical Delegate (TD)</span>
                <span className="font-semibold text-slate-800">{championship.technicalDelegate}</span>
              </div>
              <div className="pb-2 border-b border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Wasit Utama (Referee)</span>
                <span className="font-semibold text-slate-800">{championship.referee}</span>
              </div>
              {championship.starter && (
                <div className="pb-2 border-b border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Starter (Pelepas)</span>
                  <span className="font-semibold text-slate-800">{championship.starter}</span>
                </div>
              )}
              <div className="pb-2 border-b border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Ketua Juri Kedatangan (Chief Judge)</span>
                <span className="font-semibold text-slate-800">{championship.chiefJudge}</span>
              </div>
              <div className="pb-2 border-b border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Ketua Pencatat Waktu (Chief Recorder)</span>
                <span className="font-semibold text-slate-800">{championship.chiefRecorder}</span>
              </div>
              {championship.timingBrand && (
                <div className="pt-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Perangkat Pengukur Waktu</span>
                  <span className="font-medium text-slate-700 text-[11px] font-mono">{championship.timingBrand}</span>
                </div>
              )}
            </div>
          </div>

          {/* Record Alert if any broken */}
          {recordBreakers.length > 0 && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-800">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold">Pemecahan Rekor Baru!</h3>
              </div>
              <div className="space-y-2">
                {recordBreakers.map((rec, i) => (
                  <div key={i} className="text-xs bg-white/70 p-2.5 rounded-lg border border-amber-200/60">
                    <div className="font-semibold text-slate-900">{rec.athleteName} ({rec.clubName})</div>
                    <div className="text-slate-600 mt-0.5">{rec.eventTitle}</div>
                    <div className="mt-1 font-mono text-[11px] text-amber-700 font-bold">
                      Waktu Baru: {rec.newTime} (Rekor Lama: {rec.oldRecord})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fast Document Print Box */}
          <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold">Cetak Cepat Berkas Resmi</h3>
            <p className="text-xs text-slate-300">
              Dokumen standar PB Akuatik Indonesia siap cetak A4 atau simpan sebagai PDF.
            </p>
            <div className="space-y-1.5 pt-1">
              <button
                onClick={() => openPrintModal('start_list')}
                className="w-full text-left px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-between transition-colors"
              >
                <span>Lembar Start List (Nomor Terpilih)</span>
                <span className="text-slate-400">→</span>
              </button>
              <button
                onClick={() => openPrintModal('start_list_all')}
                className="w-full text-left px-3 py-2 text-xs font-medium bg-sky-700 hover:bg-sky-600 text-white rounded-lg flex items-center justify-between transition-colors font-semibold"
              >
                <span>Buku Start List Lengkap (Semua Nomor)</span>
                <span>→</span>
              </button>
              <button
                onClick={() => openPrintModal('result_sheet')}
                className="w-full text-left px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-between transition-colors"
              >
                <span>Lembar Hasil Lomba (Result Sheet)</span>
                <span className="text-slate-400">→</span>
              </button>
              <button
                onClick={() => openPrintModal('medal_tally')}
                className="w-full text-left px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-between transition-colors"
              >
                <span>Klasemen Perolehan Medali Kontingen</span>
                <span className="text-slate-400">→</span>
              </button>
              <button
                onClick={() => openPrintModal('official_minutes')}
                className="w-full text-left px-3 py-2 text-xs font-medium bg-sky-600 hover:bg-sky-500 rounded-lg flex items-center justify-between font-semibold transition-colors"
              >
                <span>Berita Acara Resmi Lengkap</span>
                <span>→</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
