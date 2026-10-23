/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSwimData } from '../context/SwimDataContext';
import { STROKE_LABELS, formatTimeDifference } from '../utils/timeUtils';
import { Printer, X, Download } from 'lucide-react';

export const PrintModal: React.FC = () => {
  const { 
    activePrintDoc, 
    openPrintModal,
    closePrintModal, 
    printTargetEventId, 
    championship, 
    events, 
    athletes, 
    clubs, 
    incidents, 
    recordBreakers, 
    officialMinutes, 
    clubMedalTally, 
    bestSwimmers 
  } = useSwimData();

  if (!activePrintDoc) return null;

  const targetEvent = events.find(e => e.id === printTargetEventId) || events[0];
  const athleteMap = new Map(athletes.map(a => [a.id, a]));
  const clubMap = new Map(clubs.map(c => [c.id, c]));

  const handleTriggerPrint = () => {
    window.print();
  };

  // Prepare Event Results if applicable
  const allLanes = targetEvent?.heats.flatMap(h => h.lanes) || [];
  const sortedEventResults = [...allLanes].sort((a, b) => {
    if (a.rankInEvent && b.rankInEvent) return a.rankInEvent - b.rankInEvent;
    if (a.rankInEvent) return -1;
    if (b.rankInEvent) return 1;
    return (a.finalTimeMs || 9999999) - (b.finalTimeMs || 9999999);
  });
  const winnerMs = sortedEventResults.find(l => l.rankInEvent === 1)?.finalTimeMs || 0;

  const getSignerName = (fullName: string) => {
    if (!fullName) return 'Official';
    const clean = fullName.split('(')[0].replace(/^(Drs\.|Dra\.|Ir\.|H\.|Hj\.)\s*/i, '').trim();
    const parts = clean.split(' ').filter(p => !p.includes('.') && p.length > 1);
    if (parts.length >= 2) return `${parts[0]} ${parts[1][0]}.`;
    if (parts.length === 1) return parts[0];
    return clean.slice(0, 14);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      
      {/* Container - hide screen chrome when printing */}
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-300 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        
        {/* Modal Top Action Bar (hidden in print) */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-sky-400" />
            <span className="font-bold text-sm">
              Pratinjau Cetak Dokumen Resmi (Format Standar A4)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {(activePrintDoc === 'start_list' || activePrintDoc === 'start_list_all') && (
              <div className="flex items-center bg-slate-800 rounded-lg p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => openPrintModal('start_list', printTargetEventId || undefined)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    activePrintDoc === 'start_list' ? 'bg-sky-500 text-white font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Nomor Ini Saja
                </button>
                <button
                  type="button"
                  onClick={() => openPrintModal('start_list_all')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    activePrintDoc === 'start_list_all' ? 'bg-sky-500 text-white font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Semua Nomor Lomba (Buku Acara)
                </button>
              </div>
            )}

            <button
              onClick={handleTriggerPrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={closePrintModal}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 sm:p-12 overflow-y-auto printable-content font-sans text-slate-900 space-y-6">
          
          {/* Official Letterhead (KOP SURAT RESMI) */}
          <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
            <div className="text-xs font-bold tracking-widest uppercase text-slate-700">
              {championship.organizer}
            </div>
            <h1 className="text-lg font-black uppercase text-slate-900 tracking-tight">
              {championship.name}
            </h1>
            <div className="text-xs text-slate-600">
              {championship.venue} · Kolam {championship.poolLength} ({championship.poolLanes} Lintasan) · {championship.startDate} s/d {championship.endDate}
            </div>
          </div>

          {/* DOCUMENT: START LIST ALL EVENTS (BUKU ACARA PERTANDINGAN LENGKAP) */}
          {activePrintDoc === 'start_list_all' && (
            <div className="space-y-8">
              <div className="border-b border-slate-300 pb-2 text-center">
                <div className="text-xs font-bold uppercase text-slate-500">BUKU ACARA LOMBA LENGKAP (COMPLETE MEET PROGRAM)</div>
                <h2 className="text-base font-extrabold text-slate-900">
                  DAFTAR SUSUNAN PERTANDINGAN & LINTASAN SELURUH NOMOR LOMBA (START LIST)
                </h2>
                <div className="text-xs text-slate-600 mt-0.5">
                  Total {events.length} Nomor Perlombaan · Seluruh Sesi & Heat (Standar World Aquatics)
                </div>
              </div>

              {events.map((ev) => (
                <div key={ev.id} className="space-y-3 pt-4 border-t-2 border-slate-800 print:break-inside-avoid print:break-after-page">
                  <div className="flex items-center justify-between bg-slate-100 border border-slate-300 px-3 py-2 rounded-sm text-slate-900">
                    <div>
                      <span className="font-mono font-bold text-sky-700 text-xs mr-2">#{ev.eventNumber}</span>
                      <span className="font-bold text-xs uppercase text-slate-900">{ev.title}</span>
                    </div>
                    <div className="text-right text-[11px] font-mono text-slate-600">
                      Sesi {ev.session} · {ev.round.replace('_', ' ')} · {ev.heats.length} Heat
                    </div>
                  </div>

                  {ev.heats.length === 0 ? (
                    <div className="text-xs text-slate-400 italic p-3 text-center border border-dashed border-slate-200">
                      Nomor lomba ini belum dijalankan auto-seeding.
                    </div>
                  ) : (
                    ev.heats.map(heat => (
                      <div key={heat.heatNumber} className="space-y-1.5 pl-1">
                        <div className="bg-slate-50 border-b border-slate-200 px-2 py-1 text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
                          <span>Heat {heat.heatNumber} dari {ev.heats.length}</span>
                          <span className="font-mono text-[10px] text-slate-500">{heat.lanes.length} Perenang</span>
                        </div>

                        <table className="w-full text-left text-xs border border-slate-200">
                          <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 text-[10px]">
                            <tr>
                              <th className="py-1 px-2 w-10 text-center border-r">Lint</th>
                              <th className="py-1 px-2.5 border-r">Nama Perenang</th>
                              <th className="py-1 px-2.5 border-r font-mono">NIK / ID</th>
                              <th className="py-1 px-2.5 border-r">Klub / Kontingen</th>
                              <th className="py-1 px-2.5 border-r">Kelompok Umur</th>
                              <th className="py-1 px-2.5 font-mono text-right">Seed Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-[11px]">
                            {heat.lanes.map(lane => {
                              const ath = athleteMap.get(lane.athleteId);
                              const clb = ath ? clubMap.get(ath.clubId) : null;
                              return (
                                <tr key={lane.laneNumber}>
                                  <td className="py-1 px-2 text-center font-mono font-bold border-r">{lane.laneNumber}</td>
                                  <td className="py-1 px-2.5 font-semibold text-slate-900 border-r">{ath?.name || 'Tanpa Nama'}</td>
                                  <td className="py-1 px-2.5 font-mono text-slate-500 border-r">{ath?.nik || '-'}</td>
                                  <td className="py-1 px-2.5 text-slate-700 border-r">{clb?.name || '-'} ({clb?.code || '-'})</td>
                                  <td className="py-1 px-2.5 text-slate-600 border-r">{ath?.ageGroup?.replace('_', ' ') || '-'}</td>
                                  <td className="py-1 px-2.5 font-mono font-bold text-right tabular-nums">{lane.seedTime}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          )}

          {/* DOCUMENT 1: START LIST / MEET PROGRAM (SINGLE EVENT) */}
          {activePrintDoc === 'start_list' && targetEvent && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                <div>
                  <div className="text-xs font-bold uppercase text-slate-500">LEMBAR PERTANDINGAN (START LIST)</div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Nomor #{targetEvent.eventNumber}: {targetEvent.title}
                  </h2>
                </div>
                <div className="text-right text-xs text-slate-600 font-mono">
                  <div>Sesi {targetEvent.session} · {targetEvent.round.replace('_', ' ')}</div>
                  {targetEvent.meetRecord && (
                    <div className="text-[11px] text-slate-500">
                      Rekor: {targetEvent.meetRecord.time} ({targetEvent.meetRecord.holder})
                    </div>
                  )}
                </div>
              </div>

              {/* Heats */}
              {targetEvent.heats.map(heat => (
                <div key={heat.heatNumber} className="space-y-2">
                  <div className="bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800 uppercase flex items-center justify-between">
                    <span>Heat {heat.heatNumber} dari {targetEvent.heats.length}</span>
                    <span className="font-mono text-[11px] text-slate-500">{heat.lanes.length} Perenang</span>
                  </div>

                  <table className="w-full text-left text-xs border border-slate-200">
                    <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 text-[11px]">
                      <tr>
                        <th className="py-1.5 px-2 w-12 text-center border-r">Lint</th>
                        <th className="py-1.5 px-3 border-r">Nama Perenang</th>
                        <th className="py-1.5 px-3 border-r font-mono">NIK / ID</th>
                        <th className="py-1.5 px-3 border-r">Klub / Kontingen</th>
                        <th className="py-1.5 px-3 border-r">Kelompok Umur</th>
                        <th className="py-1.5 px-3 font-mono text-right">Seed Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {heat.lanes.map(lane => {
                        const ath = athleteMap.get(lane.athleteId);
                        const clb = ath ? clubMap.get(ath.clubId) : null;
                        return (
                          <tr key={lane.laneNumber}>
                            <td className="py-1.5 px-2 text-center font-mono font-bold border-r">{lane.laneNumber}</td>
                            <td className="py-1.5 px-3 font-semibold text-slate-900 border-r">{ath?.name}</td>
                            <td className="py-1.5 px-3 font-mono text-slate-500 border-r">{ath?.nik}</td>
                            <td className="py-1.5 px-3 text-slate-700 border-r">{clb?.name} ({clb?.code})</td>
                            <td className="py-1.5 px-3 text-slate-600 border-r">{ath?.ageGroup.replace('_', ' ')}</td>
                            <td className="py-1.5 px-3 font-mono font-bold text-right tabular-nums">{lane.seedTime}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* DOCUMENT 2: RESULT SHEET (HASIL PER NOMOR) */}
          {activePrintDoc === 'result_sheet' && targetEvent && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                <div>
                  <div className="text-xs font-bold uppercase text-slate-500">HASIL PERLOMBAAN RESMI (OFFICIAL RESULT SHEET)</div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Nomor #{targetEvent.eventNumber}: {targetEvent.title}
                  </h2>
                </div>
                <div className="text-right text-xs text-slate-600 font-mono">
                  <div>{targetEvent.round.replace('_', ' ')} · Sesi {targetEvent.session}</div>
                  {targetEvent.meetRecord && (
                    <div className="text-[11px] text-slate-500">
                      Rekor Lama: {targetEvent.meetRecord.time} ({targetEvent.meetRecord.holder})
                    </div>
                  )}
                </div>
              </div>

              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700 text-[11px]">
                  <tr>
                    <th className="py-2 px-2 text-center border-r w-12">Peringkat</th>
                    <th className="py-2 px-3 border-r">Nama Perenang</th>
                    <th className="py-2 px-3 border-r font-mono">NIK / ID</th>
                    <th className="py-2 px-3 border-r">Klub / Kontingen</th>
                    <th className="py-2 px-2 text-center border-r font-mono">H/L</th>
                    <th className="py-2 px-3 text-right font-mono border-r">Waktu Finis</th>
                    <th className="py-2 px-3 text-right font-mono border-r">Selisih</th>
                    <th className="py-2 px-2 text-center font-mono border-r">Poin</th>
                    <th className="py-2 px-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedEventResults.map((lane, idx) => {
                    const ath = athleteMap.get(lane.athleteId);
                    const clb = ath ? clubMap.get(ath.clubId) : null;
                    return (
                      <tr key={idx} className={lane.rankInEvent === 1 ? 'bg-slate-50 font-bold' : ''}>
                        <td className="py-2 px-2 text-center font-mono font-bold border-r">
                          {lane.rankInEvent ? `#${lane.rankInEvent}` : '-'}
                        </td>
                        <td className="py-2 px-3 font-semibold border-r">
                          {ath?.name} {lane.isNewRecord && '(REKOR)'}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500 border-r">{ath?.nik}</td>
                        <td className="py-2 px-3 border-r">{clb?.name} ({clb?.code})</td>
                        <td className="py-2 px-2 text-center font-mono border-r">H{lane.heatNumber}/L{lane.laneNumber}</td>
                        <td className="py-2 px-3 font-mono font-bold text-right border-r tabular-nums">
                          {lane.finalTime || '-'}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500 text-right border-r tabular-nums">
                          {lane.finalTimeMs && winnerMs ? formatTimeDifference(winnerMs, lane.finalTimeMs) : '-'}
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-bold border-r">{lane.points || 0}</td>
                        <td className="py-2 px-3 text-[11px]">
                          {lane.status === 'OK' ? 'Sah' : lane.status === 'DQ' ? `DQ [${lane.dqRuleCode}]` : lane.status}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* DOCUMENT 3: MEDAL TALLY (KLASEMEN MEDALI) */}
          {activePrintDoc === 'medal_tally' && (
            <div className="space-y-6">
              <div className="border-b border-slate-300 pb-2 text-center">
                <div className="text-xs font-bold uppercase text-slate-500">TABEL PEROLEHAN MEDALI PERKUMPULAN</div>
                <h2 className="text-base font-extrabold text-slate-900">
                  KLASEMEN AKHIR KONTINGEN / KLUB RENANG
                </h2>
              </div>

              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700 text-[11px]">
                  <tr>
                    <th className="py-2 px-2 text-center border-r w-12">Posisi</th>
                    <th className="py-2 px-3 border-r font-mono">Kode</th>
                    <th className="py-2 px-3 border-r">Nama Resmi Perkumpulan</th>
                    <th className="py-2 px-3 border-r">Kota / Daerah</th>
                    <th className="py-2 px-3 text-center border-r font-mono">Emas</th>
                    <th className="py-2 px-3 text-center border-r font-mono">Perak</th>
                    <th className="py-2 px-3 text-center border-r font-mono">Perunggu</th>
                    <th className="py-2 px-3 text-center border-r font-mono">Total Medali</th>
                    <th className="py-2 px-3 text-right font-mono">Total Poin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {clubMedalTally.map(tally => (
                    <tr key={tally.clubId}>
                      <td className="py-2 px-2 text-center font-mono font-bold border-r">#{tally.rank}</td>
                      <td className="py-2 px-3 font-mono font-bold border-r">{tally.clubCode}</td>
                      <td className="py-2 px-3 font-semibold border-r">{tally.clubName}</td>
                      <td className="py-2 px-3 text-slate-600 border-r">{tally.city}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold border-r">{tally.gold}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold border-r">{tally.silver}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold border-r">{tally.bronze}</td>
                      <td className="py-2 px-3 text-center font-mono font-extrabold border-r">{tally.totalMedals}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">{tally.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* DOCUMENT 4: BEST SWIMMER */}
          {activePrintDoc === 'best_swimmer' && (
            <div className="space-y-6">
              <div className="border-b border-slate-300 pb-2 text-center">
                <div className="text-xs font-bold uppercase text-slate-500">PENGHARGAAN ATLET TERBAIK</div>
                <h2 className="text-base font-extrabold text-slate-900">
                  DAFTAR PERENANG TERBAIK PER KELOMPOK UMUR & GENDER
                </h2>
              </div>

              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700 text-[11px]">
                  <tr>
                    <th className="py-2 px-2 text-center border-r w-12">No.</th>
                    <th className="py-2 px-3 border-r">Nama Perenang</th>
                    <th className="py-2 px-3 border-r">Gender</th>
                    <th className="py-2 px-3 border-r">Kelompok Umur</th>
                    <th className="py-2 px-3 border-r">Asal Klub</th>
                    <th className="py-2 px-3 text-center border-r font-mono">Emas</th>
                    <th className="py-2 px-3 text-center border-r font-mono">Perak</th>
                    <th className="py-2 px-3 text-center border-r font-mono">Perunggu</th>
                    <th className="py-2 px-3 text-center border-r font-mono">Rekor</th>
                    <th className="py-2 px-3 text-right font-mono">Total Poin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {bestSwimmers.map((swimmer, idx) => (
                    <tr key={swimmer.athleteId}>
                      <td className="py-2 px-2 text-center font-mono font-bold border-r">{idx + 1}</td>
                      <td className="py-2 px-3 font-semibold border-r">{swimmer.athleteName}</td>
                      <td className="py-2 px-3 border-r">{swimmer.gender === 'MALE' ? 'Putra' : 'Putri'}</td>
                      <td className="py-2 px-3 border-r">{swimmer.ageGroup.replace('_', ' ')}</td>
                      <td className="py-2 px-3 border-r">{swimmer.clubName}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold border-r">{swimmer.gold}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold border-r">{swimmer.silver}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold border-r">{swimmer.bronze}</td>
                      <td className="py-2 px-3 text-center font-mono border-r">{swimmer.recordsBroken}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">{swimmer.totalPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* DOCUMENT 5: COMPLETE OFFICIAL RACE MINUTES (BERITA ACARA) */}
          {activePrintDoc === 'official_minutes' && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-base font-black text-slate-900 uppercase">
                  BERITA ACARA RESMI PELAKSANAAN LOMBA
                </h2>
                <div className="text-xs font-mono text-slate-700">
                  Nomor: {officialMinutes.docNumber}
                </div>
              </div>

              <div className="space-y-4 text-xs leading-relaxed text-slate-800">
                <p>
                  Pada hari ini, tanggal <strong>{officialMinutes.generatedDate}</strong>, bertempat di <strong>{championship.venue}</strong>, telah dilaksanakan seluruh rangkaian nomor perlombaan renang sesuai Peraturan Resmi World Aquatics dan Pengurus Besar Akuatik Indonesia.
                </p>

                {/* Summary Table */}
                <div className="border border-slate-300 rounded-sm p-3 bg-slate-50">
                  <div className="font-bold text-slate-900 mb-2 uppercase text-[11px]">Rangkuman Data Teknis:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div>Total Klub: <strong className="font-mono">{clubs.length}</strong></div>
                    <div>Total Atlet: <strong className="font-mono">{athletes.length}</strong></div>
                    <div>Nomor Lomba: <strong className="font-mono">{events.length}</strong></div>
                    <div>Suhu Air: <strong className="font-mono">{officialMinutes.waterTemp}</strong></div>
                  </div>
                </div>

                {/* DQ Log */}
                <div>
                  <div className="font-bold text-slate-900 mb-1 uppercase text-[11px]">
                    Laporan Pelanggaran & Diskualifikasi (DQ):
                  </div>
                  {incidents.length > 0 ? (
                    <table className="w-full text-left text-xs border border-slate-300">
                      <thead className="bg-slate-100 font-bold border-b border-slate-300">
                        <tr>
                          <th className="p-1.5 border-r">Event</th>
                          <th className="p-1.5 border-r">Nama Atlet</th>
                          <th className="p-1.5 border-r">Klub</th>
                          <th className="p-1.5 border-r">H/L</th>
                          <th className="p-1.5 border-r">Pasal</th>
                          <th className="p-1.5">Keterangan Wasit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incidents.map((inc, i) => (
                          <tr key={i} className="border-b border-slate-200">
                            <td className="p-1.5 border-r font-mono">#{inc.eventNumber}</td>
                            <td className="p-1.5 border-r font-semibold">{inc.athleteName}</td>
                            <td className="p-1.5 border-r">{inc.clubName}</td>
                            <td className="p-1.5 border-r font-mono">H{inc.heatNumber}/L{inc.laneNumber}</td>
                            <td className="p-1.5 border-r font-mono font-bold text-rose-800">{inc.ruleCode}</td>
                            <td className="p-1.5 text-[11px]">{inc.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="italic text-slate-500">Tidak ada kasus diskualifikasi yang terjadi.</div>
                  )}
                </div>

                {/* General notes */}
                <div>
                  <div className="font-bold text-slate-900 mb-1 uppercase text-[11px]">
                    Catatan Umum Technical Delegate:
                  </div>
                  <div className="p-2 border border-slate-200 rounded-sm bg-slate-50/50">
                    {officialMinutes.generalNotes}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Standard Official Signature Blocks (always present at bottom of printed reports) */}
          <div className="pt-8 border-t border-slate-400 mt-8 text-xs text-center">
            <div className="text-right text-[11px] text-slate-500 mb-4">
              {championship.city}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Technical Delegate</span>
                <div className="h-16 flex items-center justify-center font-serif italic text-slate-800 text-sm">
                  {officialMinutes.signedTD ? getSignerName(championship.technicalDelegate) : '(tanda tangan)'}
                </div>
                <div className="font-bold text-slate-900 underline">{championship.technicalDelegate.split('(')[0]}</div>
                <div className="text-[10px] text-slate-500">World Aquatics Ref</div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Wasit Utama (Referee)</span>
                <div className="h-16 flex items-center justify-center font-serif italic text-slate-800 text-sm">
                  {officialMinutes.signedReferee ? getSignerName(championship.referee) : '(tanda tangan)'}
                </div>
                <div className="font-bold text-slate-900 underline">{championship.referee.split('(')[0]}</div>
                <div className="text-[10px] text-slate-500">Wasit Nasional</div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Ketua Juri Kedatangan</span>
                <div className="h-16 flex items-center justify-center font-serif italic text-slate-800 text-sm">
                  {officialMinutes.signedChiefJudge ? getSignerName(championship.chiefJudge) : '(tanda tangan)'}
                </div>
                <div className="font-bold text-slate-900 underline">{championship.chiefJudge}</div>
                <div className="text-[10px] text-slate-500">Chief Judge</div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Ketua Pencatat Waktu</span>
                <div className="h-16 flex items-center justify-center font-serif italic text-slate-800 text-sm">
                  {officialMinutes.signedRecorder ? getSignerName(championship.chiefRecorder) : '(tanda tangan)'}
                </div>
                <div className="font-bold text-slate-900 underline">{championship.chiefRecorder}</div>
                <div className="text-[10px] text-slate-500">Chief Recorder</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
