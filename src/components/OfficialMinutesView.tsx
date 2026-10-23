/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSwimData } from '../context/SwimDataContext';
import { 
  FileText, 
  Printer, 
  CheckCircle, 
  AlertTriangle, 
  PenTool, 
  Sparkles, 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  Building2, 
  Thermometer,
  CloudSun,
  Settings
} from 'lucide-react';

export const OfficialMinutesView: React.FC = () => {
  const { 
    championship, 
    officialMinutes, 
    updateOfficialMinutes, 
    incidents, 
    recordBreakers, 
    athletes, 
    clubs, 
    events, 
    openPrintModal,
    setActiveTab 
  } = useSwimData();

  const [weatherInput, setWeatherInput] = useState(officialMinutes.weatherNotes);
  const [waterTempInput, setWaterTempInput] = useState(officialMinutes.waterTemp);
  const [notesInput, setNotesInput] = useState(officialMinutes.generalNotes);

  const totalHeats = events.reduce((acc, ev) => acc + ev.heats.length, 0);

  const toggleSignature = (role: 'signedTD' | 'signedReferee' | 'signedChiefJudge' | 'signedRecorder') => {
    updateOfficialMinutes({
      [role]: !officialMinutes[role],
    });
  };

  const handleSaveNotes = () => {
    updateOfficialMinutes({
      weatherNotes: weatherInput,
      waterTemp: waterTempInput,
      generalNotes: notesInput,
    });
    alert('Catatan Berita Acara berhasil disimpan.');
  };

  const getSignerName = (fullName: string) => {
    if (!fullName) return 'Official';
    const clean = fullName.split('(')[0].replace(/^(Drs\.|Dra\.|Ir\.|H\.|Hj\.)\s*/i, '').trim();
    const parts = clean.split(' ').filter(p => !p.includes('.') && p.length > 1);
    if (parts.length >= 2) return `${parts[0]} ${parts[1][0]}.`;
    if (parts.length === 1) return parts[0];
    return clean.slice(0, 14);
  };

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Berita Acara Resmi Perlombaan (Official Race Minutes)
          </h1>
          <p className="text-xs text-slate-500">
            Dokumen legal pertanggungjawaban jalannya perlombaan, pelanggaran aturan, dan verifikasi tanda tangan wasit
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Pengaturan Lomba & Perangkat</span>
          </button>

          <button
            onClick={() => openPrintModal('official_minutes')}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Berita Acara (A4 / PDF)</span>
          </button>
        </div>
      </div>

      {/* Official Document Preview Container */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 sm:p-10 max-w-4xl mx-auto space-y-8 font-sans">
        
        {/* Document Header (Kop Surat Resmi) */}
        <div className="border-b-2 border-slate-900 pb-5 text-center space-y-1.5">
          <div className="text-xs font-bold tracking-widest uppercase text-slate-600">
            {championship.organizer}
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 uppercase tracking-tight">
            BERITA ACARA PELAKSANAAN PERLOMBAAN RENANG
          </h2>
          <div className="text-xs font-semibold text-slate-700">
            Nomor: <span className="font-mono">{officialMinutes.docNumber}</span>
          </div>
          <div className="text-xs text-slate-500">
            {championship.name}
          </div>
        </div>

        {/* Section 1: Basic Information */}
        <div className="space-y-2 text-xs">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">
            I. Waktu, Tempat & Spesifikasi Venue
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700 pt-1">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Nama Kejuaraan</span>
              <span className="font-semibold text-slate-900">{championship.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tempat Pelaksanaan</span>
              <span className="font-semibold text-slate-900">{championship.venue}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tanggal Pertandingan</span>
              <span className="font-mono">{championship.startDate} s/d {championship.endDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Spesifikasi Kolam</span>
              <span>Kolam {championship.poolLength} ({championship.poolLength === '50m' ? 'Long Course' : 'Short Course'}) · {championship.poolLanes} Lintasan</span>
            </div>
            {championship.starter && (
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Starter (Pelepas)</span>
                <span className="font-semibold text-slate-900">{championship.starter}</span>
              </div>
            )}
            {championship.timingBrand && (
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Sistem Pengukur Waktu</span>
                <span className="font-mono text-slate-900">{championship.timingBrand}</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Competition Statistics Summary */}
        <div className="space-y-2 text-xs">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">
            II. Rekapitulasi Partisipasi & Statistik Lomba
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] uppercase text-slate-500 block">Total Perkumpulan</span>
              <span className="text-lg font-bold font-mono text-slate-900">{clubs.length} Klub</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] uppercase text-slate-500 block">Total Atlet</span>
              <span className="text-lg font-bold font-mono text-slate-900">{athletes.length} Orang</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] uppercase text-slate-500 block">Nomor Perlombaan</span>
              <span className="text-lg font-bold font-mono text-slate-900">{events.length} Nomor</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] uppercase text-slate-500 block">Jumlah Seri / Heat</span>
              <span className="text-lg font-bold font-mono text-slate-900">{totalHeats} Heat</span>
            </div>
          </div>
        </div>

        {/* Section 3: Disqualification & Incident Log */}
        <div className="space-y-2 text-xs">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200 flex items-center justify-between">
            <span>III. Catatan Pelanggaran & Diskualifikasi (DQ)</span>
            <span className="text-[10px] text-slate-500 font-normal">Sesuai Peraturan World Aquatics</span>
          </h3>
          
          {incidents.length > 0 ? (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 text-[11px]">
                  <tr>
                    <th className="py-2 px-3">No. Lomba</th>
                    <th className="py-2 px-3">Nama Atlet</th>
                    <th className="py-2 px-3">Klub</th>
                    <th className="py-2 px-3 font-mono">Heat/Lint</th>
                    <th className="py-2 px-3">Kode Pelanggaran</th>
                    <th className="py-2 px-3">Uraian / Keputusan Refri</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incidents.map((inc, i) => (
                    <tr key={inc.id || i} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono font-bold">#{inc.eventNumber}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{inc.athleteName}</td>
                      <td className="py-2 px-3 text-slate-600">{inc.clubName}</td>
                      <td className="py-2 px-3 font-mono">H{inc.heatNumber}/L{inc.laneNumber}</td>
                      <td className="py-2 px-3 font-mono font-bold text-rose-700">{inc.ruleCode}</td>
                      <td className="py-2 px-3 text-slate-700 text-[11px]">
                        <div>{inc.reason}</div>
                        <div className="text-slate-400 italic text-[10px] mt-0.5">{inc.refereeDecision}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-3 text-center bg-slate-50 border border-slate-200 rounded-lg text-slate-500 italic">
              Tidak ada pelanggaran atau diskualifikasi yang tercatat pada sesi ini.
            </div>
          )}
        </div>

        {/* Section 4: Broken Records */}
        <div className="space-y-2 text-xs">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">
            IV. Pemecahan Rekor Baru
          </h3>
          {recordBreakers.length > 0 ? (
            <div className="border border-amber-200 bg-amber-50/40 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-amber-100/50 border-b border-amber-200 font-semibold text-amber-900 text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Nomor Lomba</th>
                    <th className="py-2 px-3">Nama Atlet</th>
                    <th className="py-2 px-3">Klub</th>
                    <th className="py-2 px-3 font-mono">Rekor Lama</th>
                    <th className="py-2 px-3 font-mono">Waktu Baru</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {recordBreakers.map((rec, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3 font-semibold text-slate-900">{rec.eventTitle}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{rec.athleteName}</td>
                      <td className="py-2 px-3 text-slate-600">{rec.clubName}</td>
                      <td className="py-2 px-3 font-mono text-slate-500">{rec.oldRecord}</td>
                      <td className="py-2 px-3 font-mono font-extrabold text-amber-700">{rec.newTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-3 text-center bg-slate-50 border border-slate-200 rounded-lg text-slate-500 italic">
              Belum ada rekor kejuaraan baru yang terpecahkan pada sesi ini.
            </div>
          )}
        </div>

        {/* Section 5: Environmental Conditions & Technical Notes */}
        <div className="space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">
            V. Kondisi Lingkungan & Catatan Khusus Technical Delegate
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Kondisi Cuaca & Suhu Udara
              </label>
              <input
                type="text"
                value={weatherInput}
                onChange={e => setWeatherInput(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Suhu Air Kolam Renang
              </label>
              <input
                type="text"
                value={waterTempInput}
                onChange={e => setWaterTempInput(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Catatan Keseluruhan Jalannya Perlombaan (Technical Delegate & Referee)
            </label>
            <textarea
              rows={3}
              value={notesInput}
              onChange={e => setNotesInput(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden leading-relaxed"
            />
          </div>

          <div className="text-right">
            <button
              onClick={handleSaveNotes}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md transition-colors"
            >
              Simpan Perubahan Catatan
            </button>
          </div>
        </div>

        {/* Section 6: Official Sign-Off Blocks (4 Signatures) */}
        <div className="space-y-3 text-xs pt-4 border-t-2 border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              VI. Pengesahan & Tanda Tangan Perangkat Pertandingan
            </h3>
            <span className="text-[11px] text-slate-500">
              Klik kotak untuk membubuhkan tanda tangan digital
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center pt-2">
            
            {/* Signature 1: Technical Delegate */}
            <div 
              onClick={() => toggleSignature('signedTD')}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                officialMinutes.signedTD 
                  ? 'bg-sky-50/70 border-sky-300 text-sky-950' 
                  : 'bg-slate-50 border-dashed border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Technical Delegate</span>
              <div className="h-14 flex items-center justify-center my-1">
                {officialMinutes.signedTD ? (
                  <div className="text-center">
                    <span className="font-serif italic font-bold text-sky-800 text-sm block">
                      {getSignerName(championship.technicalDelegate)}
                    </span>
                    <span className="text-[9px] text-sky-600 block">✓ Terverifikasi Digital</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">Klik untuk tanda tangan</span>
                )}
              </div>
              <span className="font-bold text-slate-900 block truncate">{championship.technicalDelegate.split('(')[0]}</span>
              <span className="text-[10px] text-slate-400">World Aquatics Ref</span>
            </div>

            {/* Signature 2: Referee */}
            <div 
              onClick={() => toggleSignature('signedReferee')}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                officialMinutes.signedReferee 
                  ? 'bg-sky-50/70 border-sky-300 text-sky-950' 
                  : 'bg-slate-50 border-dashed border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Wasit Utama (Referee)</span>
              <div className="h-14 flex items-center justify-center my-1">
                {officialMinutes.signedReferee ? (
                  <div className="text-center">
                    <span className="font-serif italic font-bold text-sky-800 text-sm block">
                      {getSignerName(championship.referee)}
                    </span>
                    <span className="text-[9px] text-sky-600 block">✓ Terverifikasi Digital</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">Klik untuk tanda tangan</span>
                )}
              </div>
              <span className="font-bold text-slate-900 block truncate">{championship.referee.split('(')[0]}</span>
              <span className="text-[10px] text-slate-400">Wasit Nasional</span>
            </div>

            {/* Signature 3: Chief Judge */}
            <div 
              onClick={() => toggleSignature('signedChiefJudge')}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                officialMinutes.signedChiefJudge 
                  ? 'bg-sky-50/70 border-sky-300 text-sky-950' 
                  : 'bg-slate-50 border-dashed border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Ketua Juri Kedatangan</span>
              <div className="h-14 flex items-center justify-center my-1">
                {officialMinutes.signedChiefJudge ? (
                  <div className="text-center">
                    <span className="font-serif italic font-bold text-sky-800 text-sm block">
                      {getSignerName(championship.chiefJudge)}
                    </span>
                    <span className="text-[9px] text-sky-600 block">✓ Terverifikasi Digital</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">Klik untuk tanda tangan</span>
                )}
              </div>
              <span className="font-bold text-slate-900 block truncate">{championship.chiefJudge}</span>
              <span className="text-[10px] text-slate-400">Chief Judge</span>
            </div>

            {/* Signature 4: Chief Recorder */}
            <div 
              onClick={() => toggleSignature('signedRecorder')}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                officialMinutes.signedRecorder 
                  ? 'bg-sky-50/70 border-sky-300 text-sky-950' 
                  : 'bg-slate-50 border-dashed border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Ketua Pencatat Waktu</span>
              <div className="h-14 flex items-center justify-center my-1">
                {officialMinutes.signedRecorder ? (
                  <div className="text-center">
                    <span className="font-serif italic font-bold text-sky-800 text-sm block">
                      {getSignerName(championship.chiefRecorder)}
                    </span>
                    <span className="text-[9px] text-sky-600 block">✓ Terverifikasi Digital</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">Klik untuk tanda tangan</span>
                )}
              </div>
              <span className="font-bold text-slate-900 block truncate">{championship.chiefRecorder}</span>
              <span className="text-[10px] text-slate-400">Chief Recorder</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
