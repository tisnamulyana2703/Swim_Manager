/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useSwimData } from '../context/SwimDataContext';
import { STROKE_LABELS, formatTimeDifference, formatAgeGroupLabel } from '../utils/timeUtils';
import { Printer, X, Download, Filter, Sparkles, Edit3 } from 'lucide-react';
import { SwimEvent } from '../types/swim';

export const PrintModal: React.FC = () => {
  const { 
    activePrintDoc, 
    openPrintModal,
    closePrintModal, 
    printTargetEventId, 
    printTargetClubId,
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

  const [selectedClubId, setSelectedClubId] = useState<string>('ALL');
  const [contactName, setContactName] = useState<string>('Budi Gunawan');
  const [contactEmail, setContactEmail] = useState<string>('Lembangswimmingclub0909@Gmail.Com');
  const [contactPhone, setContactPhone] = useState<string>('0857-9411-2141');
  const [showEditContact, setShowEditContact] = useState<boolean>(false);

  const clubMap = useMemo(() => new Map(clubs.map(c => [c.id, c])), [clubs]);
  const eventMap = useMemo(() => new Map(events.map(e => [e.id, e])), [events]);
  const athleteMap = useMemo(() => new Map(athletes.map(a => [a.id, a])), [athletes]);

  // Synchronize club selection on open
  useEffect(() => {
    if (activePrintDoc === 'entry_list') {
      if (printTargetClubId) {
        setSelectedClubId(printTargetClubId);
      } else {
        const lembang = clubs.find(c => c.id === 'club-8' || c.code === 'LEMBANG');
        if (lembang) {
          setSelectedClubId(lembang.id);
        } else if (clubs.length > 0) {
          setSelectedClubId(clubs[0].id);
        }
      }
    }
  }, [activePrintDoc, printTargetClubId, clubs]);

  // Sync contact details when selectedClubId changes
  useEffect(() => {
    if (selectedClubId === 'club-8' || selectedClubId === 'LEMBANG') {
      setContactName('Budi Gunawan');
      setContactEmail('Lembangswimmingclub0909@Gmail.Com');
      setContactPhone('0857-9411-2141');
    } else if (selectedClubId !== 'ALL') {
      const c = clubMap.get(selectedClubId);
      if (c) {
        setContactName(c.coach || 'Official Klub');
        setContactEmail(`${c.code.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`);
        setContactPhone(c.contactNumber || '0812-3456-7890');
      }
    } else {
      setContactName('Sekretariat Panitia Pelaksana');
      setContactEmail(`sekretariat.${championship.city.toLowerCase().replace(/\s+/g, '')}@akuatik.id`);
      setContactPhone('0812-3456-7890');
    }
  }, [selectedClubId, clubMap, championship]);

  if (!activePrintDoc) return null;

  const targetEvent = events.find(e => e.id === printTargetEventId) || events[0];

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

  // Helper functions for Indonesian official entry list format
  const getKU = (ageGroup: string, age: number): string => {
    if (ageGroup === 'KU_I' || ageGroup === 'KU I') return 'KU I';
    if (ageGroup === 'KU_II' || ageGroup === 'KU II') return 'KU II';
    if (ageGroup === 'KU_III' || ageGroup === 'KU III') return 'KU III';
    if (ageGroup === 'KU_IV' || ageGroup === 'KU IV') return 'KU IV';
    if (ageGroup === 'KU_V' || ageGroup === 'KU V') return 'KU V';
    if (age >= 19) return 'Senior';
    if (age >= 16) return 'KU I';
    if (age >= 14) return 'KU II';
    if (age >= 12) return 'KU III';
    if (age >= 10) return 'KU IV';
    return 'KU V';
  };

  const getDisplayRegNumber = (reg?: string, idx: number = 0): string => {
    if (!reg) return (412 + idx).toString();
    if (/^\d+$/.test(reg)) return reg;
    const match = reg.match(/\d+$/);
    if (match) return match[0];
    return reg;
  };

  const getDateParts = (birthDate?: string, age: number = 10) => {
    if (!birthDate || !birthDate.includes('-')) {
      const currentYear = new Date().getFullYear();
      return { day: '1', month: '1', year: (currentYear - age).toString() };
    }
    const [y, m, d] = birthDate.split('-');
    return {
      day: parseInt(d, 10).toString(),
      month: parseInt(m, 10).toString(),
      year: y,
    };
  };

  const getEventIndonesianTitle = (ev: SwimEvent | undefined, athGender: 'MALE' | 'FEMALE', ku: string): string => {
    if (!ev) return '-';
    const strokeMap: Record<string, string> = {
      FREESTYLE: 'Gaya Bebas',
      BACKSTROKE: 'Gaya Punggung',
      BREASTSTROKE: 'Gaya Dada',
      BUTTERFLY: 'Gaya Kupu-Kupu',
      INDIVIDUAL_MEDLEY: 'Gaya Ganti Perorangan',
      RELAY_FREESTYLE: 'Estafet Gaya Bebas',
      RELAY_MEDLEY: 'Estafet Gaya Ganti',
    };
    const strokeName = strokeMap[ev.stroke] || ev.stroke;
    const genderName = athGender === 'MALE' ? 'Putra' : 'Putri';
    return `${ev.distance} M ${strokeName} ${ku} ${genderName}`;
  };

  // Compile Entry List rows matching exact reference layout
  const entryListRows = useMemo(() => {
    const rows: {
      regNumber: string;
      athleteName: string;
      gender: 'MALE' | 'FEMALE';
      ku: string;
      clubName: string;
      tgl: string;
      bln: string;
      tahun: string;
      umur: number;
      noAcara: number | string;
      noLomba: string;
      waktu: string;
    }[] = [];

    const filtered = athletes.filter(a => {
      if (selectedClubId && selectedClubId !== 'ALL') {
        return a.clubId === selectedClubId;
      }
      return true;
    });

    // Sort athletes numerically by register number if available, else by name
    const sorted = [...filtered].sort((a, b) => {
      const numA = parseInt((a.regNumber || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt((b.regNumber || '').replace(/\D/g, ''), 10) || 0;
      if (numA && numB && numA !== numB) return numA - numB;
      return a.name.localeCompare(b.name);
    });

    sorted.forEach((ath, idx) => {
      const club = clubMap.get(ath.clubId);
      const clubName = (club?.name || 'INDEPENDEN').toUpperCase();
      const ku = getKU(ath.ageGroup, ath.age);
      const regNo = getDisplayRegNumber(ath.regNumber, idx);
      const dateParts = getDateParts(ath.birthDate, ath.age);

      if (ath.registeredEvents && ath.registeredEvents.length > 0) {
        ath.registeredEvents.forEach(reg => {
          const ev = eventMap.get(reg.eventId);
          const eventNo = ev ? ev.eventNumber : '-';
          const eventTitle = getEventIndonesianTitle(ev, ath.gender, ku);
          const waktu = (!reg.seedTime || reg.seedTime === '00:00.00' || reg.seedTime === 'NT' || reg.seedTimeMs === 0)
            ? 'NT'
            : reg.seedTime;

          rows.push({
            regNumber: regNo,
            athleteName: ath.name.toUpperCase(),
            gender: ath.gender,
            ku,
            clubName,
            tgl: dateParts.day,
            bln: dateParts.month,
            tahun: dateParts.year,
            umur: ath.age,
            noAcara: eventNo,
            noLomba: eventTitle,
            waktu,
          });
        });
      } else {
        rows.push({
          regNumber: regNo,
          athleteName: ath.name.toUpperCase(),
          gender: ath.gender,
          ku,
          clubName,
          tgl: dateParts.day,
          bln: dateParts.month,
          tahun: dateParts.year,
          umur: ath.age,
          noAcara: '-',
          noLomba: '-',
          waktu: 'NT',
        });
      }
    });

    return rows;
  }, [athletes, selectedClubId, clubMap, eventMap]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Inline Print Styles ensuring exact visual reproduction in print */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 6mm;
          }
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-entry-list-table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          .print-entry-list-table th {
            color: #dc2626 !important;
            font-weight: 700 !important;
            border: 1px solid #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-entry-list-table td {
            border: 1px solid #000000 !important;
            color: #000000 !important;
          }
        }
      `}</style>

      {/* Container - wider for entry list table preview */}
      <div className={`bg-white rounded-2xl w-full shadow-2xl border border-slate-300 overflow-hidden my-4 max-h-[94vh] flex flex-col ${
        activePrintDoc === 'entry_list' ? 'max-w-6xl' : 'max-w-4xl'
      }`}>
        
        {/* Modal Top Action Bar (hidden in print) */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-sky-400" />
            <span className="font-bold text-sm">
              {activePrintDoc === 'entry_list' 
                ? 'Pratinjau Cetak Entry List (Format Resmi PB Akuatik Indonesia)' 
                : 'Pratinjau Cetak Dokumen Resmi (Format Standar A4)'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Entry List Controls */}
            {activePrintDoc === 'entry_list' && (
              <>
                <div className="flex items-center gap-1.5 bg-slate-800 rounded-lg px-2.5 py-1 text-xs">
                  <span className="text-slate-400">Pilih Klub:</span>
                  <select
                    value={selectedClubId}
                    onChange={(e) => setSelectedClubId(e.target.value)}
                    className="bg-slate-700 text-white rounded px-2 py-0.5 text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="ALL">Semua Perkumpulan</option>
                    {clubs.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const lembang = clubs.find(c => c.id === 'club-8' || c.code === 'LEMBANG');
                    if (lembang) setSelectedClubId(lembang.id);
                    setContactName('Budi Gunawan');
                    setContactEmail('Lembangswimmingclub0909@Gmail.Com');
                    setContactPhone('0857-9411-2141');
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                  title="Terapkan contoh data Lembang Swimming Club sesuai referensi gambar"
                >
                  <Sparkles className="w-3 h-3 text-amber-200" />
                  <span>Contoh Sesuai Gambar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowEditContact(!showEditContact)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  title="Sesuaikan nama narahubung / coach, email, dan nomor telepon"
                >
                  <Edit3 className="w-3 h-3 text-slate-400" />
                  <span>Edit Kontak</span>
                </button>
              </>
            )}

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
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Collapsible Contact Editor Toolbar (screen-only) */}
        {activePrintDoc === 'entry_list' && showEditContact && (
          <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center gap-3 text-xs print:hidden">
            <span className="font-semibold text-slate-700">Header Narahubung:</span>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Nama Kontak / Coach"
              className="bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-800 text-xs w-44 focus:outline-sky-500"
            />
            <input
              type="text"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="Email"
              className="bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-800 text-xs w-64 focus:outline-sky-500"
            />
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Nomor Telepon"
              className="bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-800 text-xs w-36 focus:outline-sky-500"
            />
            <button
              type="button"
              onClick={() => setShowEditContact(false)}
              className="px-2 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded text-xs"
            >
              Simpan
            </button>
          </div>
        )}

        {/* Printable Document Body */}
        <div className="p-6 sm:p-10 overflow-y-auto printable-content font-sans text-slate-900 space-y-6">
          
          {/* Official Letterhead (KOP SURAT RESMI) - Hidden for entry_list to match exact reference */}
          {activePrintDoc !== 'entry_list' && (
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
          )}

          {/* ========================================================================= */}
          {/* DOCUMENT: ENTRY LIST (EXACT FORMAT MATCHING REFERENCE SCREENSHOT)          */}
          {/* ========================================================================= */}
          {activePrintDoc === 'entry_list' && (
            <div className="space-y-4 print:space-y-2 font-sans text-black">
              {/* Header Title & Contact Line */}
              <div className="text-center pb-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-[0.45em] uppercase text-black font-sans select-none">
                  E n t r y &nbsp; L i s t
                </h1>
                <div className="text-xs sm:text-sm font-normal text-black mt-1">
                  {contactName} &lt;{contactEmail}&gt; {contactPhone}
                </div>
              </div>

              {/* Grid Table with Black Solid Borders and Red Bold Headers */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-black text-black text-[10.5px] leading-tight print-entry-list-table">
                  <thead>
                    <tr className="bg-white border-b border-black">
                      <th className="border border-black px-1.5 py-1 text-center font-bold text-red-600 whitespace-nowrap">
                        No. Regist.
                      </th>
                      <th className="border border-black px-2 py-1 text-left font-bold text-red-600">
                        Nama (Sesuai dengan akte kelahiran)
                      </th>
                      <th className="border border-black px-1.5 py-1 text-center font-bold text-red-600 whitespace-nowrap">
                        Jenis kelamin
                      </th>
                      <th className="border border-black px-1.5 py-1 text-center font-bold text-red-600 whitespace-nowrap">
                        KU
                      </th>
                      <th className="border border-black px-2 py-1 text-left font-bold text-red-600">
                        Perkumpulan
                      </th>
                      <th className="border border-black px-1 py-1 text-center font-bold text-red-600 whitespace-nowrap">
                        Tgl
                      </th>
                      <th className="border border-black px-1 py-1 text-center font-bold text-red-600 whitespace-nowrap">
                        Bln
                      </th>
                      <th className="border border-black px-1 py-1 text-center font-bold text-red-600 whitespace-nowrap">
                        Tahun
                      </th>
                      <th className="border border-black px-1 py-1 text-center font-bold text-red-600 whitespace-nowrap">
                        Umur
                      </th>
                      <th className="border border-black px-1.5 py-1 text-center font-bold text-red-600 whitespace-nowrap">
                        NO. Acara
                      </th>
                      <th className="border border-black px-2 py-1 text-left font-bold text-red-600">
                        NO. Lomba
                      </th>
                      <th className="border border-black px-2 py-1 text-center font-bold text-red-600 whitespace-nowrap">
                        Waktu
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {entryListRows.map((row, idx) => (
                      <tr key={idx} className="border-b border-black hover:bg-slate-50/50 print:hover:bg-transparent">
                        <td className="border border-black px-1.5 py-1 text-center font-medium">
                          {row.regNumber}
                        </td>
                        <td className="border border-black px-2 py-1 text-left font-medium">
                          {row.athleteName}
                        </td>
                        <td className="border border-black px-1.5 py-1 text-center font-medium whitespace-nowrap">
                          {row.gender === 'MALE' ? 'Laki-Laki' : 'Perempuan'}
                        </td>
                        <td className="border border-black px-1.5 py-1 text-center font-medium whitespace-nowrap">
                          {row.ku}
                        </td>
                        <td className="border border-black px-2 py-1 text-left font-medium">
                          {row.clubName}
                        </td>
                        <td className="border border-black px-1 py-1 text-center font-medium">
                          {row.tgl}
                        </td>
                        <td className="border border-black px-1 py-1 text-center font-medium">
                          {row.bln}
                        </td>
                        <td className="border border-black px-1 py-1 text-center font-medium">
                          {row.tahun}
                        </td>
                        <td className="border border-black px-1 py-1 text-center font-medium">
                          {row.umur}
                        </td>
                        <td className="border border-black px-1.5 py-1 text-center font-medium">
                          {row.noAcara}
                        </td>
                        <td className="border border-black px-2 py-1 text-left font-medium">
                          {row.noLomba}
                        </td>
                        <td className="border border-black px-2 py-1 text-center font-medium font-mono">
                          {row.waktu}
                        </td>
                      </tr>
                    ))}

                    {entryListRows.length === 0 && (
                      <tr>
                        <td colSpan={12} className="border border-black py-8 text-center text-slate-500 italic">
                          Tidak ada entri atlet yang terdaftar untuk perkumpulan ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Sub-summary count */}
              <div className="flex justify-between items-center text-[10px] text-slate-600 pt-1 border-t border-slate-300 print:text-black">
                <div>
                  Total: <span className="font-bold">{entryListRows.length} entri perlombaan</span>
                </div>
                <div>
                  Dicetak pada {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENT: START LIST ALL EVENTS (BUKU ACARA PERTANDINGAN LENGKAP) */}
          {activePrintDoc === 'start_list_all' && (
            <div className="space-y-8">
              <div className="border-b border-slate-300 pb-2 text-center">
                <div className="text-xs font-bold uppercase text-slate-500">BUKU ACARA LOMBA LENGKAP (COMPLETE MEET PROGRAM)</div>
                <h2 className="text-base font-extrabold text-slate-900">
                  DAFTAR SUSUNAN PERTANDINGAN & LINTASAN SELURUH NOMOR LOMBA (START LIST)
                </h2>
                <div className="text-xs text-slate-600 mt-0.5">
                  Total {events.length} Nomor Perlombaan · Seluruh Sesi & Seri (Standar World Aquatics)
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
                      Sesi {ev.session} · {ev.round.replace('_', ' ')} · {ev.heats.length} Seri
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
                          <span>Seri {heat.heatNumber} dari {ev.heats.length}</span>
                          <span className="font-mono text-[10px] text-slate-500">{heat.lanes.length} Perenang</span>
                        </div>

                        <table className="w-full text-left text-xs border border-slate-200">
                          <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 text-[10px]">
                            <tr>
                              <th className="py-1 px-2 w-10 text-center border-r">Lint</th>
                              <th className="py-1 px-2.5 border-r">Nama Perenang</th>
                              <th className="py-1 px-2.5 border-r font-mono">No. Register</th>
                              <th className="py-1 px-2.5 border-r">Klub / Kontingen</th>
                              <th className="py-1 px-2.5 border-r">Kelompok Usia</th>
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
                                  <td className="py-1 px-2.5 font-mono text-slate-600 border-r">{ath?.regNumber || ath?.nik || '-'}</td>
                                  <td className="py-1 px-2.5 text-slate-700 border-r">{clb?.name || '-'} ({clb?.code || '-'})</td>
                                  <td className="py-1 px-2.5 text-slate-600 border-r">{formatAgeGroupLabel(ath?.ageGroup || '', ath?.age)}</td>
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

              {/* Seri / Heats */}
              {targetEvent.heats.map(heat => (
                <div key={heat.heatNumber} className="space-y-2">
                  <div className="bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800 uppercase flex items-center justify-between">
                    <span>Seri {heat.heatNumber} dari {targetEvent.heats.length}</span>
                    <span className="font-mono text-[11px] text-slate-500">{heat.lanes.length} Perenang</span>
                  </div>

                  <table className="w-full text-left text-xs border border-slate-200">
                    <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 text-[11px]">
                      <tr>
                        <th className="py-1.5 px-2 w-12 text-center border-r">Lint</th>
                        <th className="py-1.5 px-3 border-r">Nama Perenang</th>
                        <th className="py-1.5 px-3 border-r font-mono">No. Register</th>
                        <th className="py-1.5 px-3 border-r">Klub / Kontingen</th>
                        <th className="py-1.5 px-3 border-r">Kelompok Usia</th>
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
                            <td className="py-1.5 px-3 font-mono text-slate-600 border-r">{ath?.regNumber || ath?.nik || '-'}</td>
                            <td className="py-1.5 px-3 text-slate-700 border-r">{clb?.name} ({clb?.code})</td>
                            <td className="py-1.5 px-3 text-slate-600 border-r">{formatAgeGroupLabel(ath?.ageGroup || '', ath?.age)}</td>
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
                    <th className="py-2 px-3 border-r font-mono">No. Register</th>
                    <th className="py-2 px-3 border-r">Klub / Kontingen</th>
                    <th className="py-2 px-2 text-center border-r font-mono">S/L</th>
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
                      <tr key={lane.laneNumber} className={lane.rankInEvent === 1 ? 'bg-amber-50/70 font-semibold' : ''}>
                        <td className="py-2 px-2 text-center font-mono font-bold border-r">
                          {lane.rankInEvent ? `#${lane.rankInEvent}` : '-'}
                        </td>
                        <td className="py-2 px-3 text-slate-900 border-r">{ath?.name}</td>
                        <td className="py-2 px-3 font-mono text-slate-600 border-r">{ath?.regNumber || ath?.nik || '-'}</td>
                        <td className="py-2 px-3 text-slate-700 border-r">{clb?.code}</td>
                        <td className="py-2 px-2 text-center font-mono text-slate-500 border-r">
                          H{lane.heatNumber}/L{lane.laneNumber}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 border-r tabular-nums">
                          {lane.finalTime || 'DNS'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-500 border-r tabular-nums">
                          {formatTimeDifference(lane.finalTimeMs || 0, winnerMs)}
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-sky-700 border-r">
                          {lane.points || '-'}
                        </td>
                        <td className="py-2 px-3 text-xs text-slate-500">
                          {lane.status === 'DQ' && <span className="text-rose-600 font-bold">DQ ({lane.dqReason || 'Disqualified'})</span>}
                          {lane.status === 'DNS' && <span className="text-amber-600">DNS</span>}
                          {lane.status === 'DNF' && <span className="text-amber-600">DNF</span>}
                          {lane.isNewRecord && <span className="text-amber-600 font-bold">REKOR BARU</span>}
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
                <div className="text-xs font-bold uppercase text-slate-500">KLASEMEN PEROLEHAN MEDALI & POIN KLUB</div>
                <h2 className="text-base font-extrabold text-slate-900">
                  DAFTAR JUARA UMUM KEJUARAAN RENANG RESMI
                </h2>
                <div className="text-xs text-slate-600 mt-0.5">
                  Standar Penghitungan Skor World Aquatics (Emas 9, Perak 7, Perunggu 6, dst.)
                </div>
              </div>

              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700 text-[11px]">
                  <tr>
                    <th className="py-2 px-2 text-center border-r w-12">Peringkat</th>
                    <th className="py-2 px-3 border-r">Klub / Kontingen Perkumpulan</th>
                    <th className="py-2 px-2 text-center border-r">Daerah</th>
                    <th className="py-2 px-2 text-center border-r bg-amber-100/50">Emas</th>
                    <th className="py-2 px-2 text-center border-r bg-slate-200/50">Perak</th>
                    <th className="py-2 px-2 text-center border-r bg-amber-200/30">Perunggu</th>
                    <th className="py-2 px-2 text-center border-r font-bold">Total Medali</th>
                    <th className="py-2 px-3 text-right font-bold text-sky-800">Total Skor Poin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {clubMedalTally.map((tally) => (
                    <tr key={tally.clubId} className={tally.rank === 1 ? 'bg-amber-50/50 font-bold' : ''}>
                      <td className="py-2 px-2 text-center font-mono font-bold border-r">#{tally.rank}</td>
                      <td className="py-2 px-3 text-slate-900 border-r">{tally.clubName} ({tally.clubCode})</td>
                      <td className="py-2 px-2 text-center text-slate-500 border-r">{tally.city}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-amber-600 border-r">{tally.gold}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-slate-600 border-r">{tally.silver}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-amber-700 border-r">{tally.bronze}</td>
                      <td className="py-2 px-2 text-center font-mono font-extrabold text-slate-900 border-r">{tally.totalMedals}</td>
                      <td className="py-2 px-3 text-right font-mono font-extrabold text-sky-700">{tally.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* DOCUMENT 4: BEST SWIMMERS (PERENANG TERBAIK) */}
          {activePrintDoc === 'best_swimmer' && (
            <div className="space-y-6">
              <div className="border-b border-slate-300 pb-2 text-center">
                <div className="text-xs font-bold uppercase text-slate-500">DAFTAR ATLET TERBAIK (BEST SWIMMERS)</div>
                <h2 className="text-base font-extrabold text-slate-900">
                  PENGHARGAAN ATLET TERBAIK PER KELOMPOK USIA & GENDER
                </h2>
              </div>

              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700 text-[11px]">
                  <tr>
                    <th className="py-2 px-3 border-r">Kelompok Usia</th>
                    <th className="py-2 px-2 text-center border-r">Gender</th>
                    <th className="py-2 px-3 border-r">Nama Perenang</th>
                    <th className="py-2 px-3 border-r">Klub</th>
                    <th className="py-2 px-2 text-center border-r">Emas</th>
                    <th className="py-2 px-2 text-center border-r">Perak</th>
                    <th className="py-2 px-2 text-center border-r">Perunggu</th>
                    <th className="py-2 px-2 text-center border-r">Rekor Pecah</th>
                    <th className="py-2 px-3 text-right font-bold text-sky-800">Total Skor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {bestSwimmers.map((swimmer, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-900 border-r">
                        {formatAgeGroupLabel(swimmer.ageGroup)}
                      </td>
                      <td className="py-2 px-2 text-center text-slate-600 border-r">
                        {swimmer.gender === 'MALE' ? 'Putra' : 'Putri'}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900 border-r">{swimmer.athleteName}</td>
                      <td className="py-2 px-3 text-slate-700 border-r">{swimmer.clubName}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-amber-600 border-r">{swimmer.gold}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-slate-500 border-r">{swimmer.silver}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-amber-700 border-r">{swimmer.bronze}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-indigo-600 border-r">
                        {swimmer.recordsBroken > 0 ? `${swimmer.recordsBroken} Rekor` : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-extrabold text-sky-700">{swimmer.totalPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* DOCUMENT 5: BERITA ACARA RESMI */}
          {activePrintDoc === 'official_minutes' && (
            <div className="space-y-6">
              <div className="border-b border-slate-300 pb-2 text-center">
                <div className="text-xs font-bold uppercase text-slate-500">BERITA ACARA RESMI PERLOMBAAN</div>
                <h2 className="text-base font-extrabold text-slate-900">
                  LAPORAN TEKNIS DELEGASI & WASIT UTAMA
                </h2>
                <div className="text-xs text-slate-600 font-mono mt-0.5">
                  Nomor Dokumen: {officialMinutes.docNumber} · Tanggal {officialMinutes.generatedDate}
                </div>
              </div>

              {/* Conditions summary */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <span className="font-bold text-slate-500 block uppercase text-[10px]">Kondisi Cuaca & Suhu Udara:</span>
                  <div className="font-medium text-slate-800 mt-0.5">{officialMinutes.weatherNotes}</div>
                </div>
                <div>
                  <span className="font-bold text-slate-500 block uppercase text-[10px]">Suhu Air Kolam (Water Temp):</span>
                  <div className="font-medium text-slate-800 mt-0.5">{officialMinutes.waterTemp}</div>
                </div>
              </div>

              {/* Incidents table if any */}
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-700 mb-2">
                  Daftar Insiden Teknis, Diskualifikasi (DQ), dan Protes:
                </h3>
                {incidents.length === 0 ? (
                  <div className="p-4 border border-dashed border-slate-200 rounded text-center text-xs text-slate-400">
                    Tidak ada insiden teknis atau protes resmi yang tercatat selama perlombaan.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border border-slate-300">
                    <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700 text-[11px]">
                      <tr>
                        <th className="py-1.5 px-2 w-16 border-r">Waktu</th>
                        <th className="py-1.5 px-2 border-r">Tipe</th>
                        <th className="py-1.5 px-3 border-r">Nomor / Atlet</th>
                        <th className="py-1.5 px-3 border-r">Keterangan Aturan World Aquatics</th>
                        <th className="py-1.5 px-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {incidents.map((inc) => (
                        <tr key={inc.id}>
                          <td className="py-1.5 px-2 font-mono text-slate-500 border-r">{inc.timestamp}</td>
                          <td className="py-1.5 px-2 font-bold text-slate-800 border-r">{inc.ruleCode}</td>
                          <td className="py-1.5 px-3 border-r">
                            <div className="font-bold text-slate-900">{inc.athleteName || '-'}</div>
                            <div className="text-[10px] text-slate-500">{inc.eventTitle} (H{inc.heatNumber}/L{inc.laneNumber})</div>
                          </td>
                          <td className="py-1.5 px-3 text-slate-700 border-r">{inc.reason}</td>
                          <td className="py-1.5 px-2 text-center font-bold text-rose-600">{inc.refereeDecision}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* General notes */}
                <div className="mt-4">
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

          {/* Standard Official Signature Blocks (always present at bottom of printed reports except entry_list) */}
          {activePrintDoc !== 'entry_list' && (
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
          )}

        </div>

      </div>
    </div>
  );
};
