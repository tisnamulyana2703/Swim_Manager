/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useSwimData } from '../context/SwimDataContext';
import { IncidentReport, IncidentCategory, IncidentStatus } from '../types/swim';
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Printer, 
  UserCheck, 
  X, 
  RotateCcw,
  Edit2
} from 'lucide-react';

const COMMON_RULES = [
  { code: 'SW 4.4', category: 'START' as IncidentCategory, label: 'SW 4.4 - Start sebelum aba-aba / tembakan pistol (False Start)' },
  { code: 'SW 6.4', category: 'TURN' as IncidentCategory, label: 'SW 6.4 - Gerakan pembalikan gaya punggung tidak kontinyu' },
  { code: 'SW 6.5', category: 'FINISH' as IncidentCategory, label: 'SW 6.5 - Finis gaya punggung tubuh tidak dalam posisi telentang penuh' },
  { code: 'SW 7.4', category: 'STROKE' as IncidentCategory, label: 'SW 7.4 - Tarikan tangan gaya dada kedua sebelum kepala memecah permukaan air' },
  { code: 'SW 7.5', category: 'STROKE' as IncidentCategory, label: 'SW 7.5 - Gerakan kaki gunting atau tidak simetris pada gaya dada' },
  { code: 'SW 7.6', category: 'FINISH' as IncidentCategory, label: 'SW 7.6 - Sentuhan finis/pembalikan gaya dada tidak menggunakan kedua tangan serempak' },
  { code: 'SW 8.2', category: 'STROKE' as IncidentCategory, label: 'SW 8.2 - Kedua lengan tidak dibawa ke depan serempak di atas air (Gaya Kupu-kupu)' },
  { code: 'SW 8.3', category: 'STROKE' as IncidentCategory, label: 'SW 8.3 - Gerakan kaki tidak serempak / tendangan gaya dada (Gaya Kupu-kupu)' },
  { code: 'SW 8.4', category: 'FINISH' as IncidentCategory, label: 'SW 8.4 - Sentuhan pembalikan/finis gaya kupu-kupu tidak dengan kedua tangan terpisah & serempak' },
  { code: 'SW 9.1', category: 'STROKE' as IncidentCategory, label: 'SW 9.1 - Urutan gaya ganti perorangan tidak sesuai standar resmi' },
  { code: 'SW 10.7', category: 'CONDUCT' as IncidentCategory, label: 'SW 10.7 - Menarik tali pembatas lintasan kolam perlombaan' },
  { code: 'SW 10.8', category: 'CONDUCT' as IncidentCategory, label: 'SW 10.8 - Berjalan di dasar kolam atau mendorong dasar lintasan saat bertanding' },
  { code: 'PROT-01', category: 'PROTEST' as IncidentCategory, label: 'PROTES - Protes Resmi Tertulis Kontingen / Klub terhadap Keputusan Wasit' },
  { code: 'LAINNYA', category: 'OTHER' as IncidentCategory, label: 'LAINNYA - Pelanggaran atau Kasus Khusus Lainnya' },
];

export const IncidentsView: React.FC = () => {
  const { 
    incidents, 
    addIncident, 
    updateIncident, 
    deleteIncident, 
    events, 
    athletes, 
    clubs, 
    championship 
  } = useSwimData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<IncidentReport | null>(null);
  const [printIncidentId, setPrintIncidentId] = useState<string | null>(null);

  // Form State
  const [formEventId, setFormEventId] = useState('');
  const [formHeatNumber, setFormHeatNumber] = useState<number>(1);
  const [formLaneNumber, setFormLaneNumber] = useState<number>(1);
  const [formAthleteName, setFormAthleteName] = useState('');
  const [formClubName, setFormClubName] = useState('');
  const [formRulePreset, setFormRulePreset] = useState(COMMON_RULES[0].code);
  const [formCustomRuleCode, setFormCustomRuleCode] = useState('');
  const [formCategory, setFormCategory] = useState<IncidentCategory>('START');
  const [formReason, setFormReason] = useState('');
  const [formReportedBy, setFormReportedBy] = useState('Juri Pembalikan');
  const [formRefereeDecision, setFormRefereeDecision] = useState('Diskualifikasi (DQ) disahkan oleh Wasit Utama.');
  const [formStatus, setFormStatus] = useState<IncidentStatus>('CONFIRMED_DQ');
  const [formOfficialNotes, setFormOfficialNotes] = useState('');

  // Selected event for auto-populating athlete
  const activeFormEvent = useMemo(() => {
    return events.find(e => e.id === formEventId);
  }, [events, formEventId]);

  // Handle auto-detecting swimmer when Event, Heat, and Lane change
  const handleEventHeatLaneChange = (evId: string, heat: number, lane: number) => {
    const ev = events.find(e => e.id === evId);
    if (!ev) return;
    const targetHeat = ev.heats.find(h => h.heatNumber === heat);
    const targetLane = targetHeat?.lanes.find(l => l.laneNumber === lane);
    if (targetLane && targetLane.athleteId) {
      const ath = athletes.find(a => a.id === targetLane.athleteId);
      if (ath) {
        setFormAthleteName(ath.name);
        const club = clubs.find(c => c.id === ath.clubId);
        setFormClubName(club?.name || 'Independen');
        return;
      }
    }
  };

  const handleRulePresetChange = (code: string) => {
    setFormRulePreset(code);
    const found = COMMON_RULES.find(r => r.code === code);
    if (found && code !== 'LAINNYA') {
      setFormCategory(found.category);
      setFormReason(found.label.split(' - ')[1] || found.label);
    }
  };

  const openCreateModal = () => {
    setEditingIncident(null);
    const defaultEv = events[0];
    setFormEventId(defaultEv?.id || '');
    setFormHeatNumber(1);
    setFormLaneNumber(1);
    setFormAthleteName('');
    setFormClubName('');
    setFormRulePreset(COMMON_RULES[0].code);
    setFormCustomRuleCode('');
    setFormCategory('START');
    setFormReason('Start sebelum aba-aba / tembakan pistol (False Start)');
    setFormReportedBy('Juri Pembalikan / Wasit Lintasan');
    setFormRefereeDecision('Diskualifikasi (DQ) disahkan oleh Wasit Utama.');
    setFormStatus('CONFIRMED_DQ');
    setFormOfficialNotes('');

    if (defaultEv) {
      handleEventHeatLaneChange(defaultEv.id, 1, 1);
    }
    setIsModalOpen(true);
  };

  const openEditModal = (inc: IncidentReport) => {
    setEditingIncident(inc);
    const matchEvent = events.find(e => e.eventNumber === inc.eventNumber);
    setFormEventId(matchEvent?.id || '');
    setFormHeatNumber(inc.heatNumber);
    setFormLaneNumber(inc.laneNumber);
    setFormAthleteName(inc.athleteName);
    setFormClubName(inc.clubName);
    const isPreset = COMMON_RULES.some(r => r.code === inc.ruleCode);
    if (isPreset) {
      setFormRulePreset(inc.ruleCode);
      setFormCustomRuleCode('');
    } else {
      setFormRulePreset('LAINNYA');
      setFormCustomRuleCode(inc.ruleCode);
    }
    setFormCategory(inc.category || 'OTHER');
    setFormReason(inc.reason);
    setFormReportedBy(inc.reportedBy || 'Juri Lintasan');
    setFormRefereeDecision(inc.refereeDecision);
    setFormStatus(inc.status || 'CONFIRMED_DQ');
    setFormOfficialNotes(inc.officialNotes || '');
    setIsModalOpen(true);
  };

  const handleSaveIncident = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRuleCode = formRulePreset === 'LAINNYA' 
      ? (formCustomRuleCode.trim() || 'ATURAN-KHUSUS')
      : formRulePreset;

    const ev = events.find(e => e.id === formEventId);
    const eventNumber = ev?.eventNumber || 1;
    const eventTitle = ev?.title || 'Nomor Perlombaan';

    if (editingIncident) {
      updateIncident(editingIncident.id, {
        eventNumber,
        eventTitle,
        heatNumber: Number(formHeatNumber),
        laneNumber: Number(formLaneNumber),
        athleteName: formAthleteName.trim() || 'Tanpa Nama',
        clubName: formClubName.trim() || 'Independen',
        ruleCode: finalRuleCode,
        reason: formReason.trim(),
        refereeDecision: formRefereeDecision.trim(),
        signedByRef: true,
        category: formCategory,
        reportedBy: formReportedBy.trim(),
        officialNotes: formOfficialNotes.trim(),
        status: formStatus,
      });
    } else {
      addIncident({
        eventNumber,
        eventTitle,
        heatNumber: Number(formHeatNumber),
        laneNumber: Number(formLaneNumber),
        athleteName: formAthleteName.trim() || 'Tanpa Nama',
        clubName: formClubName.trim() || 'Independen',
        ruleCode: finalRuleCode,
        reason: formReason.trim(),
        refereeDecision: formRefereeDecision.trim(),
        signedByRef: true,
        category: formCategory,
        reportedBy: formReportedBy.trim(),
        officialNotes: formOfficialNotes.trim(),
        status: formStatus,
      });
    }

    setIsModalOpen(false);
  };

  const handleQuickStatusChange = (id: string, newStatus: IncidentStatus) => {
    const decisionText = 
      newStatus === 'CONFIRMED_DQ' ? 'Diskualifikasi (DQ) disahkan oleh Wasit Utama.' :
      newStatus === 'WARNING' ? 'Peringatan resmi diberikan kepada perenang/pelatih.' :
      newStatus === 'OVERTURNED' ? 'Banding diterima / Keputusan dibatalkan oleh Dewan Hakim.' :
      'Protes resmi diterima, dalam proses pemeriksaan rekaman video/juri.';
    
    updateIncident(id, {
      status: newStatus,
      refereeDecision: decisionText,
    });
  };

  // Filtered list
  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = 
        !q ||
        inc.athleteName.toLowerCase().includes(q) ||
        inc.clubName.toLowerCase().includes(q) ||
        inc.ruleCode.toLowerCase().includes(q) ||
        inc.reason.toLowerCase().includes(q) ||
        inc.eventTitle.toLowerCase().includes(q);

      const matchCategory = selectedCategory === 'ALL' || inc.category === selectedCategory;
      const matchStatus = selectedStatus === 'ALL' || (inc.status || 'CONFIRMED_DQ') === selectedStatus;

      return matchQuery && matchCategory && matchStatus;
    });
  }, [incidents, searchQuery, selectedCategory, selectedStatus]);

  // Metrics
  const totalCount = incidents.length;
  const confirmedDQCount = incidents.filter(i => (i.status || 'CONFIRMED_DQ') === 'CONFIRMED_DQ').length;
  const warningCount = incidents.filter(i => i.status === 'WARNING').length;
  const overturnedCount = incidents.filter(i => i.status === 'OVERTURNED').length;
  const pendingCount = incidents.filter(i => i.status === 'PROTEST_PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header and Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-rose-600 mb-1">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider">World Aquatics Official Infraction Log</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Catatan Kasus & Pelanggaran Perlombaan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
              Pencatatan resmi diskualifikasi (DQ), pelanggaran aturan lintasan, keputusan wasit utama (Referee), serta pengajuan protes kontingen {championship.name}.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Cetak lembar laporan kasus perlombaan"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak Laporan</span>
            </button>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Pelanggaran Baru</span>
            </button>
          </div>
        </div>

        {/* High Density Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Kasus</div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">{totalCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Tercatat di sistem</div>
          </div>

          <div className="bg-rose-50/60 p-3 rounded-lg border border-rose-200/60">
            <div className="text-[11px] font-semibold text-rose-700 uppercase">Diskualifikasi (DQ)</div>
            <div className="text-2xl font-black text-rose-700 font-mono mt-0.5">{confirmedDQCount}</div>
            <div className="text-[10px] text-rose-500 mt-0.5">Hasil tidak disahkan</div>
          </div>

          <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200/60">
            <div className="text-[11px] font-semibold text-amber-700 uppercase">Peringatan Resmi</div>
            <div className="text-2xl font-black text-amber-700 font-mono mt-0.5">{warningCount}</div>
            <div className="text-[10px] text-amber-600 mt-0.5">Catatan Wasit</div>
          </div>

          <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200/60">
            <div className="text-[11px] font-semibold text-emerald-700 uppercase">Banding Diterima</div>
            <div className="text-2xl font-black text-emerald-700 font-mono mt-0.5">{overturnedCount}</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">DQ dibatalkan / Sah</div>
          </div>

          <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-200/60">
            <div className="text-[11px] font-semibold text-blue-700 uppercase">Protes Tertunda</div>
            <div className="text-2xl font-black text-blue-700 font-mono mt-0.5">{pendingCount}</div>
            <div className="text-[10px] text-blue-600 mt-0.5">Menunggu keputusan</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari nama perenang, klub, nomor acara, atau kode aturan (misal: SW 7.6, False Start)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-rose-500 focus:bg-white text-slate-900 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:border-rose-500"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="START">Start (SW 4)</option>
            <option value="STROKE">Gaya Renang (SW 5-9)</option>
            <option value="TURN">Pembalikan (Turn)</option>
            <option value="FINISH">Finis (Touch)</option>
            <option value="CONDUCT">Perilaku (Conduct)</option>
            <option value="PROTEST">Protes Kontingen</option>
            <option value="OTHER">Lainnya</option>
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:border-rose-500"
          >
            <option value="ALL">Semua Status Wasit</option>
            <option value="CONFIRMED_DQ">Terkonfirmasi DQ</option>
            <option value="WARNING">Peringatan</option>
            <option value="OVERTURNED">Banding Diterima</option>
            <option value="PROTEST_PENDING">Protes Tertunda</option>
          </select>

          {(searchQuery || selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedStatus('ALL');
              }}
              className="p-1.5 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              title="Reset Filter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Incidents Table / List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {filteredIncidents.length === 0 ? (
          <div className="text-center py-16 px-4">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3 opacity-80" />
            <h3 className="text-base font-bold text-slate-800">
              {incidents.length === 0 ? 'Belum Ada Kasus atau Pelanggaran' : 'Tidak Ada Data Sesuai Filter'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {incidents.length === 0 
                ? 'Semua sesi perlombaan berjalan tertib. Setiap catatan diskualifikasi pada modul Input Waktu atau pencatatan manual akan tampil otomatis di sini.'
                : 'Coba ubah kata kunci pencarian atau reset filter kategori di atas.'}
            </p>
            {incidents.length === 0 && (
              <button
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Catatan Kasus Baru</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Waktu & Sesi Acara</th>
                  <th className="py-3 px-4">Perenang & Klub</th>
                  <th className="py-3 px-4">Lintasan & Seri</th>
                  <th className="py-3 px-4">Aturan & Alasan Pelanggaran</th>
                  <th className="py-3 px-4">Juri Pelapor</th>
                  <th className="py-3 px-4">Status & Keputusan Wasit</th>
                  <th className="py-3 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredIncidents.map((inc, index) => {
                  const status = inc.status || 'CONFIRMED_DQ';
                  return (
                    <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {index + 1}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          #{inc.eventNumber} {inc.eventTitle}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Pukul {inc.timestamp}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {inc.athleteName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {inc.clubName}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono text-slate-800 font-semibold">
                          Lintasan {inc.laneNumber}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Seri {inc.heatNumber}
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-mono font-bold text-rose-700">
                          {inc.ruleCode}
                        </div>
                        <div className="text-slate-700 mt-0.5 text-[11px] leading-snug">
                          {inc.reason}
                        </div>
                        {inc.officialNotes && (
                          <div className="text-[10px] text-slate-400 mt-1 italic">
                            Catatan: {inc.officialNotes}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        <div className="font-medium">{inc.reportedBy || 'Juri Lintasan'}</div>
                        <div className="text-[10px] text-slate-400">Petugas Resmi</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          {status === 'CONFIRMED_DQ' && (
                            <span className="font-bold text-rose-700 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>Diskualifikasi (DQ)</span>
                            </span>
                          )}
                          {status === 'WARNING' && (
                            <span className="font-bold text-amber-700 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>Peringatan Resmi</span>
                            </span>
                          )}
                          {status === 'OVERTURNED' && (
                            <span className="font-bold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>Banding Diterima (Sah)</span>
                            </span>
                          )}
                          {status === 'PROTEST_PENDING' && (
                            <span className="font-bold text-blue-700 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              <span>Protes Tertunda</span>
                            </span>
                          )}

                          <div className="text-[10px] text-slate-500 line-clamp-2">
                            {inc.refereeDecision}
                          </div>

                          {/* Quick decision switcher */}
                          <div className="flex items-center gap-1 mt-1">
                            {status !== 'CONFIRMED_DQ' && (
                              <button
                                onClick={() => handleQuickStatusChange(inc.id, 'CONFIRMED_DQ')}
                                className="px-1.5 py-0.5 text-[9px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-sm cursor-pointer"
                              >
                                Set DQ
                              </button>
                            )}
                            {status !== 'OVERTURNED' && (
                              <button
                                onClick={() => handleQuickStatusChange(inc.id, 'OVERTURNED')}
                                className="px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-sm cursor-pointer"
                              >
                                Sahkan
                              </button>
                            )}
                            {status !== 'WARNING' && (
                              <button
                                onClick={() => handleQuickStatusChange(inc.id, 'WARNING')}
                                className="px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-sm cursor-pointer"
                              >
                                Peringatan
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setPrintIncidentId(inc.id)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="Pratinjau Lembar Pelanggaran Resmi"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => openEditModal(inc)}
                            className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-md transition-colors cursor-pointer"
                            title="Ubah Rincian Kasus"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Hapus catatan pelanggaran untuk ${inc.athleteName}?`)) {
                                deleteIncident(inc.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Hapus Catatan"
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
        )}
      </div>

      {/* Official Signatures & Reference Notice */}
      <div className="bg-slate-100 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-slate-500" />
          <span>
            Keputusan Diskualifikasi resmi disahkan oleh <strong>Wasit Utama ({championship.referee})</strong> dan <strong>Technical Delegate ({championship.technicalDelegate})</strong> sesuai Buku Peraturan Perlombaan World Aquatics.
          </span>
        </div>
        <div className="text-[11px] text-slate-400 whitespace-nowrap">
          Kota {championship.city} · PB Akuatik Indonesia
        </div>
      </div>

      {/* Modal: Catat / Edit Pelanggaran */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingIncident ? 'Ubah Catatan Kasus / Pelanggaran' : 'Catat Pelanggaran & Diskualifikasi Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveIncident} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Event selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor Acara Perlombaan
                </label>
                <select
                  value={formEventId}
                  onChange={e => {
                    setFormEventId(e.target.value);
                    handleEventHeatLaneChange(e.target.value, formHeatNumber, formLaneNumber);
                  }}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-rose-500"
                >
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      #{ev.eventNumber} - {ev.title} ({ev.heats.length} Seri)
                    </option>
                  ))}
                </select>
              </div>

              {/* Heat & Lane */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor Seri (Heat)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formHeatNumber}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 1;
                      setFormHeatNumber(val);
                      handleEventHeatLaneChange(formEventId, val, formLaneNumber);
                    }}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-rose-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor Lintasan (Lane)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={championship.poolLanes || 10}
                    value={formLaneNumber}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 1;
                      setFormLaneNumber(val);
                      handleEventHeatLaneChange(formEventId, formHeatNumber, val);
                    }}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-rose-500 font-mono"
                  />
                </div>
              </div>

              {/* Athlete & Club */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Perenang
                  </label>
                  <input
                    type="text"
                    value={formAthleteName}
                    onChange={e => setFormAthleteName(e.target.value)}
                    placeholder="Nama lengkap perenang"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Klub / Kontingen
                  </label>
                  <input
                    type="text"
                    value={formClubName}
                    onChange={e => setFormClubName(e.target.value)}
                    placeholder="Nama klub asal"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Rule Presets */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Aturan World Aquatics (Preset Cepat)
                </label>
                <select
                  value={formRulePreset}
                  onChange={e => handleRulePresetChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-rose-500"
                >
                  {COMMON_RULES.map(r => (
                    <option key={r.code} value={r.code}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {formRulePreset === 'LAINNYA' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kode Aturan Kustom
                  </label>
                  <input
                    type="text"
                    value={formCustomRuleCode}
                    onChange={e => setFormCustomRuleCode(e.target.value)}
                    placeholder="Contoh: SW 10.12 atau ATURAN-KONTINGEN"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-rose-500 font-mono"
                  />
                </div>
              )}

              {/* Category & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kategori Pelanggaran
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as IncidentCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-rose-500"
                  >
                    <option value="START">Start (SW 4)</option>
                    <option value="STROKE">Gaya Renang (SW 5-9)</option>
                    <option value="TURN">Pembalikan (Turn)</option>
                    <option value="FINISH">Finis (Touch)</option>
                    <option value="CONDUCT">Perilaku (Conduct)</option>
                    <option value="PROTEST">Protes Kontingen</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Status Keputusan Wasit
                  </label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as IncidentStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-rose-500 font-semibold"
                  >
                    <option value="CONFIRMED_DQ">Terkonfirmasi DQ (Diskualifikasi)</option>
                    <option value="WARNING">Peringatan Resmi (Warning)</option>
                    <option value="OVERTURNED">Banding Diterima / Sah</option>
                    <option value="PROTEST_PENDING">Protes Tertunda (Investigasi)</option>
                  </select>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Uraian Kronologis & Alasan Pelanggaran
                </label>
                <textarea
                  rows={2}
                  value={formReason}
                  onChange={e => setFormReason(e.target.value)}
                  placeholder="Jelaskan secara ringkas pelanggaran yang terjadi sesuai laporan pengawas lintasan..."
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-rose-500"
                />
              </div>

              {/* Reporter & Referee Decision */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Juri / Petugas Pelapor
                  </label>
                  <input
                    type="text"
                    value={formReportedBy}
                    onChange={e => setFormReportedBy(e.target.value)}
                    placeholder="Contoh: Juri Pembalikan L-4"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Teks Keputusan Wasit Utama
                  </label>
                  <input
                    type="text"
                    value={formRefereeDecision}
                    onChange={e => setFormRefereeDecision(e.target.value)}
                    placeholder="Keputusan resmi wasit"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  value={formOfficialNotes}
                  onChange={e => setFormOfficialNotes(e.target.value)}
                  placeholder="Contoh: Manajer klub telah diberi lembar pemberitahuan pada pukul 10:15"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-sm transition-colors cursor-pointer"
                >
                  {editingIncident ? 'Simpan Perubahan' : 'Catat Pelanggaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Single Incident Slip Modal */}
      {printIncidentId && (() => {
        const item = incidents.find(i => i.id === printIncidentId);
        if (!item) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 text-slate-900">
              <div className="border-b-2 border-slate-900 pb-3 mb-4 text-center">
                <div className="text-[11px] font-bold tracking-wider uppercase text-slate-600">
                  PB Akuatik Indonesia · Official Disqualification Notice
                </div>
                <h3 className="text-base font-black text-slate-900 uppercase mt-0.5">
                  Surat Laporan Pelanggaran & Diskualifikasi
                </h3>
                <div className="text-xs text-slate-500">
                  {championship.name} · {championship.venue}
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Nomor Acara:</span>
                  <span className="font-bold">#{item.eventNumber} - {item.eventTitle}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Seri / Lintasan:</span>
                  <span className="font-mono font-bold">Seri {item.heatNumber} · Lintasan {item.laneNumber}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Nama Perenang:</span>
                  <span className="font-bold text-slate-900">{item.athleteName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Klub / Kontingen:</span>
                  <span className="font-semibold">{item.clubName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Kode Aturan:</span>
                  <span className="font-mono font-bold text-rose-700">{item.ruleCode}</span>
                </div>
                <div className="border-b border-slate-100 pb-1">
                  <span className="text-slate-500 block mb-0.5">Uraian Pelanggaran:</span>
                  <span className="font-medium text-slate-800">{item.reason}</span>
                </div>
                <div className="border-b border-slate-100 pb-1">
                  <span className="text-slate-500 block mb-0.5">Keputusan Wasit Utama:</span>
                  <span className="font-bold text-rose-700">{item.refereeDecision}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Juri Pelapor:</span>
                  <span>{item.reportedBy || 'Juri Lintasan'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Waktu Kejadian:</span>
                  <span className="font-mono">{item.timestamp}</span>
                </div>
              </div>

              {/* Signature Blocks */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-200 text-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 mb-8">Juri / Petugas Pelapor</div>
                  <div className="font-semibold border-t border-slate-300 pt-1">
                    ( {item.reportedBy || 'Petugas'} )
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 mb-8">Wasit Utama (Referee)</div>
                  <div className="font-semibold border-t border-slate-300 pt-1">
                    ( {championship.referee} )
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 print:hidden">
                <button
                  onClick={() => setPrintIncidentId(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Form Ini</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
