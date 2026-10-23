/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSwimData } from '../context/SwimDataContext';
import { getLaneOrder, getDefaultLaneColor } from '../utils/seeding';
import { formatAgeGroupLabel } from '../utils/timeUtils';
import { 
  Sliders, 
  RotateCcw, 
  Printer, 
  Play, 
  ArrowLeftRight, 
  ChevronLeft, 
  ChevronRight,
  Info,
  CheckCircle,
  X,
  Settings
} from 'lucide-react';

export const SeedingView: React.FC = () => {
  const { 
    events, 
    athletes, 
    clubs, 
    championship, 
    selectedEventId, 
    setSelectedEventId, 
    runAutoSeedingForEvent, 
    reassignLane, 
    openPrintModal,
    setActiveTab 
  } = useSwimData();

  const currentEvent = events.find(e => e.id === selectedEventId) || events[0];
  const [selectedHeatNumber, setSelectedHeatNumber] = useState<number>(1);

  // Manual Override Modal
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [fromLane, setFromLane] = useState<number>(1);
  const [toHeat, setToHeat] = useState<number>(1);
  const [toLane, setToLane] = useState<number>(2);

  const athleteMap = new Map(athletes.map(a => [a.id, a]));
  const clubMap = new Map(clubs.map(c => [c.id, c]));

  if (!currentEvent) {
    return <div className="p-8 text-center text-slate-400">Tidak ada nomor lomba yang dipilih.</div>;
  }

  const currentHeat = currentEvent.heats.find(h => h.heatNumber === selectedHeatNumber) || currentEvent.heats[0];
  const totalHeats = currentEvent.heats.length;
  const laneOrder = getLaneOrder(championship.poolLanes);

  const handleOpenSwapModal = (laneNum: number) => {
    setFromLane(laneNum);
    setToHeat(selectedHeatNumber);
    setToLane(laneNum === championship.poolLanes ? 1 : laneNum + 1);
    setShowOverrideModal(true);
  };

  const executeSwap = (e: React.FormEvent) => {
    e.preventDefault();
    reassignLane(currentEvent.id, selectedHeatNumber, fromLane, toHeat, toLane);
    setShowOverrideModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Event Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Starting List & Pengaturan Seri (Auto-Seeding)
          </h1>
          <p className="text-xs text-slate-500">
            Pola Alokasi Spearhead (Pusat-ke-Luar: 4-5-3-6-2-7-1-8) Standar World Aquatics & Akuatik Indonesia
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={currentEvent.id}
            onChange={e => {
              setSelectedEventId(e.target.value);
              setSelectedHeatNumber(1);
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500 max-w-xs truncate"
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>
                #{ev.eventNumber}: {ev.title} ({ev.heats.length} Seri)
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              runAutoSeedingForEvent(currentEvent.id);
              setSelectedHeatNumber(1);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Generate Ulang Seeding</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Buka pengaturan konfigurasi kolam dan lintasan"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Pengaturan Lintasan</span>
          </button>

          <button
            onClick={() => openPrintModal('start_list', currentEvent.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            title="Cetak Start List nomor lomba ini saja"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Start List Nomor Ini</span>
          </button>

          <button
            onClick={() => openPrintModal('start_list_all')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            title="Cetak Buku Acara / Start List seluruh nomor lomba secara berurutan"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak SEMUA Nomor Lomba</span>
          </button>
        </div>
      </div>

      {/* Event Details Ribbon */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center font-mono font-bold text-sky-700 text-sm">
            #{currentEvent.eventNumber}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">{currentEvent.title}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>Sesi {currentEvent.session}</span>
              <span aria-hidden="true">·</span>
              <span>{currentEvent.round.replace('_', ' ')}</span>
              <span aria-hidden="true">·</span>
              <span>Total {totalHeats} Seri</span>
            </div>
          </div>
        </div>

        {/* Seri Pagination */}
        {totalHeats > 0 && (
          <div className="flex items-center gap-2">
            <button
              disabled={selectedHeatNumber <= 1}
              onClick={() => setSelectedHeatNumber(prev => Math.max(1, prev - 1))}
              className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {currentEvent.heats.map(h => (
                <button
                  key={h.heatNumber}
                  onClick={() => setSelectedHeatNumber(h.heatNumber)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    selectedHeatNumber === h.heatNumber
                      ? 'bg-sky-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Seri {h.heatNumber}
                </button>
              ))}
            </div>

            <button
              disabled={selectedHeatNumber >= totalHeats}
              onClick={() => setSelectedHeatNumber(prev => Math.min(totalHeats, prev + 1))}
              className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Interactive Visual Swimming Pool Lanes */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-6 text-white shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
              Visualisasi Kolam Renang: Seri {selectedHeatNumber} dari {totalHeats || 1}
            </span>
            <span className="text-[11px] text-slate-400">
              ({championship.poolLanes} Lintasan, Panjang {championship.poolLength})
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              <span>Lintasan Utama (4 & 5)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
              <span>Kosong</span>
            </div>
          </div>
        </div>

        {/* Lanes Container */}
        <div className="space-y-2">
          {Array.from({ length: championship.poolLanes }, (_, idx) => {
            const laneNum = idx + 1;
            const laneAlloc = currentHeat?.lanes.find(l => l.laneNumber === laneNum);
            const athlete = laneAlloc ? athleteMap.get(laneAlloc.athleteId) : null;
            const club = athlete ? clubMap.get(athlete.clubId) : null;
            const isCenterLane = laneNum === 4 || laneNum === 5;
            const isLaneActive = !championship.activeLanes || championship.activeLanes.includes(laneNum);
            const colorInfo = getDefaultLaneColor(laneNum, championship.poolLanes);
            const laneDetail = championship.laneDetails?.[laneNum];

            return (
              <div
                key={laneNum}
                className={`relative group rounded-xl p-3 border transition-all flex items-center justify-between gap-4 ${
                  !isLaneActive
                    ? 'bg-slate-950/40 border-dashed border-slate-800/80 opacity-50'
                    : laneAlloc
                      ? isCenterLane
                        ? 'bg-sky-950/60 border-sky-500/50 hover:border-sky-400'
                        : 'bg-slate-800/80 border-slate-700 hover:border-slate-500'
                      : 'bg-slate-900/50 border-dashed border-slate-800 text-slate-500'
                }`}
              >
                {/* Starting Block & Lane Number */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className={`w-9 h-9 rounded-lg font-mono font-bold flex items-center justify-center text-sm shadow-xs ${
                    !isLaneActive
                      ? 'bg-slate-800 text-slate-500'
                      : laneAlloc 
                        ? isCenterLane ? 'bg-sky-500 text-white' : 'bg-slate-700 text-white'
                        : 'bg-slate-800 text-slate-500'
                  }`}>
                    {laneNum}
                  </div>

                  {/* Rope color pill */}
                  <div className={`w-1.5 h-8 rounded-full ${colorInfo.bgClass}`} title={`Tali Lintasan: ${colorInfo.name}`}></div>

                  <div className="hidden sm:block">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Lintasan {laneNum}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {isLaneActive ? `Prioritas: #${laneOrder.indexOf(laneNum) + 1}` : 'Buffer Ombak'}
                    </span>
                  </div>
                </div>

                {/* Swimmer Details or Buffer Notice */}
                <div className="flex-1 min-w-0">
                  {!isLaneActive ? (
                    <div className="flex items-center gap-2 text-xs text-amber-400/90 italic">
                      <span className="px-2 py-0.5 rounded-sm bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold font-mono">
                        BUFFER OMBAK
                      </span>
                      <span>Lintasan dinonaktifkan di pengaturan untuk meminimalisir gelombang pantul dinding</span>
                    </div>
                  ) : laneAlloc && athlete ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-white truncate flex items-center gap-2">
                          <span>{athlete.name}</span>
                          <span className="text-[11px] font-semibold text-sky-400 font-mono hidden md:inline">
                            [{athlete.regNumber || athlete.nik}]
                          </span>
                          {laneDetail?.timekeeperName && (
                            <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded-sm border border-slate-700 font-normal hidden lg:inline">
                              TK: {laneDetail.timekeeperName}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                          <span className="font-semibold text-sky-300">{club?.code}</span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{club?.name}</span>
                          <span aria-hidden="true">·</span>
                          <span>{formatAgeGroupLabel(athlete.ageGroup, athlete.age)}</span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-[10px] text-slate-400 block uppercase">Seed Time (Entry)</span>
                        <span className="font-mono text-sm font-bold text-sky-400 tabular-nums">
                          {laneAlloc.seedTime}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs italic text-slate-500">
                      Lintasan Kosong (Tidak ada perenang yang dialokasikan pada seri ini)
                    </div>
                  )}
                </div>

                {/* Actions: Manual Override / Swap */}
                <div className="shrink-0 flex items-center gap-2">
                  {laneAlloc && (
                    <button
                      onClick={() => handleOpenSwapModal(laneNum)}
                      className="px-2.5 py-1 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md flex items-center gap-1 transition-colors"
                      title="Tukar Posisi Lintasan Manual (Manual Override)"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Tukar Posisi</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* World Aquatics Seeding Rule Explanation Box */}
        <div className="pt-2 border-t border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
          <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <p>
            <strong>Standar World Aquatics / PB Akuatik Indonesia:</strong> Perenang dengan catatan waktu terbaik ditempatkan di Lintasan 4 (Pusat), disusul Lintasan 5, 3, 6, 2, 7, 1, 8. Perenang paling lambat berlomba di seri pertama dan perenang tercepat berada di seri penutup (Final Seri).
          </p>
        </div>
      </div>

      {/* Manual Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                Kustomisasi Manual Lintasan (Manual Override)
              </h3>
              <button 
                onClick={() => setShowOverrideModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={executeSwap} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Pindahkan atau tukar atlet pada <strong>Seri {selectedHeatNumber}, Lintasan {fromLane}</strong> ke lintasan target:
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ke Seri #</label>
                  <select
                    value={toHeat}
                    onChange={e => setToHeat(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden"
                  >
                    {currentEvent.heats.map(h => (
                      <option key={h.heatNumber} value={h.heatNumber}>
                        Seri {h.heatNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ke Lintasan #</label>
                  <select
                    value={toLane}
                    onChange={e => setToLane(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden"
                  >
                    {Array.from({ length: championship.poolLanes }, (_, i) => i + 1).map(ln => (
                      <option key={ln} value={ln}>
                        Lintasan {ln}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-800">
                Jika lintasan target sudah terisi atlet lain, posisi kedua atlet akan ditukar secara otomatis.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs"
                >
                  Terapkan Penyesuaian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
