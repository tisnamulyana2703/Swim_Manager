/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSwimData } from '../context/SwimDataContext';
import { ChampionshipInfo, CustomAgeGroupConfig, LaneDetailConfig, LaneSeedingMode, StrokeConfig } from '../types/swim';
import { getDefaultLaneColor, getLaneOrder } from '../utils/seeding';
import { 
  Settings, 
  Trophy, 
  Save, 
  RotateCcw, 
  Check, 
  MapPin, 
  Calendar, 
  Users, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  FileText, 
  Building2, 
  Sparkles,
  Info,
  Clock,
  Printer,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Radio,
  Activity,
  ArrowRight,
  Plus,
  Trash2,
  Edit2,
  X
} from 'lucide-react';

interface PresetItem {
  name: string;
  subTitle: string;
  venue: string;
  city: string;
  organizer: string;
  poolLength: '50m' | '25m';
  poolLanes: 6 | 8 | 10;
  activeLanes?: number[];
  laneWidthMeters?: number;
  laneSeedingMode?: LaneSeedingMode;
  customLaneOrder?: number[];
  laneDetails?: Record<number, LaneDetailConfig>;
  technicalDelegate: string;
  referee: string;
  starter: string;
  chiefJudge: string;
  chiefRecorder: string;
  chiefTimekeeper: string;
  timingDeviceType: 'AUTOMATIC_TOUCHPAD' | 'SEMI_AUTOMATIC' | 'MANUAL_STOPWATCH';
  timingBrand: string;
}

const PRESETS: Record<string, PresetItem> = {
  krapsi: {
    name: 'KEJUARAAN RENANG ANTAR PERKUMPULAN SELURUH INDONESIA (KRAPSI) 2026',
    subTitle: 'Piala Terbuka Akuatik Indonesia / Babak Kualifikasi PON & Pelatnas',
    venue: 'Stadion Akuatik Gelora Bung Karno (GBK), Senayan',
    city: 'Jakarta Pusat',
    organizer: 'Pengurus Besar Akuatik Indonesia (PB PRSI)',
    poolLength: '50m',
    poolLanes: 8,
    activeLanes: [1, 2, 3, 4, 5, 6, 7, 8],
    laneWidthMeters: 2.5,
    laneSeedingMode: 'STANDARD_SPEARHEAD',
    customLaneOrder: [4, 5, 3, 6, 2, 7, 1, 8],
    laneDetails: {
      1: { laneNumber: 1, isActive: true, timekeeperName: 'Irfan Hakim', touchpadStatus: 'OK', backupWatches: 3, customRopeColor: 'green' },
      2: { laneNumber: 2, isActive: true, timekeeperName: 'Budi Santoso', touchpadStatus: 'OK', backupWatches: 3, customRopeColor: 'blue' },
      3: { laneNumber: 3, isActive: true, timekeeperName: 'Doni Pratama', touchpadStatus: 'OK', backupWatches: 3, customRopeColor: 'blue' },
      4: { laneNumber: 4, isActive: true, timekeeperName: 'Eko Sulistyo (Chief Lane)', touchpadStatus: 'OK', backupWatches: 3, customRopeColor: 'yellow' },
      5: { laneNumber: 5, isActive: true, timekeeperName: 'Fajar Nugraha (Chief Lane)', touchpadStatus: 'OK', backupWatches: 3, customRopeColor: 'yellow' },
      6: { laneNumber: 6, isActive: true, timekeeperName: 'Gilang Ramadhan', touchpadStatus: 'OK', backupWatches: 3, customRopeColor: 'blue' },
      7: { laneNumber: 7, isActive: true, timekeeperName: 'Hadi Wijaya', touchpadStatus: 'OK', backupWatches: 3, customRopeColor: 'blue' },
      8: { laneNumber: 8, isActive: true, timekeeperName: 'Indra Gunawan', touchpadStatus: 'OK', backupWatches: 3, customRopeColor: 'green' },
    },
    technicalDelegate: 'Bambang Sutrisno, S.Pd., M.Or. (World Aquatics Ref)',
    referee: 'Dra. Siti Rahayu, M.Si. (Wasit Nasional)',
    starter: 'Drs. Agus Wijaya (Starter PB Akuatik)',
    chiefJudge: 'Ir. Hendra Gunawan',
    chiefRecorder: 'Ahmad Fauzi, S.Kom',
    chiefTimekeeper: 'Rizal Prasetyo, S.Or.',
    timingDeviceType: 'AUTOMATIC_TOUCHPAD',
    timingBrand: 'Omega Swiss Timing Quantum Aquatics (Touchpad L1-L8 + Backup 3-Watch)',
  },
  kejurdaJabar: {
    name: 'KEJUARAAN DAERAH AKUATIK JAWA BARAT 2026',
    subTitle: 'Piala Gubernur Jawa Barat & Seleksi Atlet Kejurnas',
    venue: 'Kolam Renang UPI Bandung, Jawa Barat',
    city: 'Bandung',
    organizer: 'Pengprov Akuatik Indonesia Jawa Barat',
    poolLength: '50m',
    poolLanes: 10,
    activeLanes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    laneWidthMeters: 2.5,
    laneSeedingMode: 'STANDARD_SPEARHEAD',
    customLaneOrder: [5, 6, 4, 7, 3, 8, 2, 9, 1, 10],
    laneDetails: {
      1: { laneNumber: 1, isActive: true, timekeeperName: 'Juri L1', touchpadStatus: 'OK', backupWatches: 3 },
      2: { laneNumber: 2, isActive: true, timekeeperName: 'Juri L2', touchpadStatus: 'OK', backupWatches: 3 },
      3: { laneNumber: 3, isActive: true, timekeeperName: 'Juri L3', touchpadStatus: 'OK', backupWatches: 3 },
      4: { laneNumber: 4, isActive: true, timekeeperName: 'Juri L4', touchpadStatus: 'OK', backupWatches: 3 },
      5: { laneNumber: 5, isActive: true, timekeeperName: 'Juri L5 (Utama)', touchpadStatus: 'OK', backupWatches: 3 },
      6: { laneNumber: 6, isActive: true, timekeeperName: 'Juri L6 (Utama)', touchpadStatus: 'OK', backupWatches: 3 },
      7: { laneNumber: 7, isActive: true, timekeeperName: 'Juri L7', touchpadStatus: 'OK', backupWatches: 3 },
      8: { laneNumber: 8, isActive: true, timekeeperName: 'Juri L8', touchpadStatus: 'OK', backupWatches: 3 },
      9: { laneNumber: 9, isActive: true, timekeeperName: 'Juri L9', touchpadStatus: 'OK', backupWatches: 3 },
      10: { laneNumber: 10, isActive: true, timekeeperName: 'Juri L10', touchpadStatus: 'OK', backupWatches: 3 },
    },
    technicalDelegate: 'Drs. Dedi Supriyadi, M.Pd. (Technical Delegate Jabar)',
    referee: 'H. Cecep Mulyana, S.Sos. (Wasit A Nasional)',
    starter: 'Yayan Hendrayana (Starter Daerah Jabar)',
    chiefJudge: 'Nandang Sujana, S.Pd.',
    chiefRecorder: 'Dina Marlina, S.Kom',
    chiefTimekeeper: 'Asep Saepuloh',
    timingDeviceType: 'AUTOMATIC_TOUCHPAD',
    timingBrand: 'Colorado Time Systems System 6 + Electronic Touchpads',
  },
  invitasiJatim: {
    name: 'INVITASI RENANG KELOMPOK UMUR ANTAR KLUB JAWA TIMUR 2026',
    subTitle: 'Kejuaraan Renang Short Course (25m) KU V, IV, III, II & Senior',
    venue: 'Kolam Renang Dispora Surabaya, Jawa Timur',
    city: 'Surabaya',
    organizer: 'Pengkot Akuatik Surabaya & Komisi Pembinaan Usia Dini',
    poolLength: '25m',
    poolLanes: 6,
    activeLanes: [1, 2, 3, 4, 5, 6],
    laneWidthMeters: 2.5,
    laneSeedingMode: 'STANDARD_SPEARHEAD',
    customLaneOrder: [3, 4, 2, 5, 1, 6],
    laneDetails: {
      1: { laneNumber: 1, isActive: true, timekeeperName: 'Juri L1 Sby', touchpadStatus: 'OK', backupWatches: 2 },
      2: { laneNumber: 2, isActive: true, timekeeperName: 'Juri L2 Sby', touchpadStatus: 'OK', backupWatches: 2 },
      3: { laneNumber: 3, isActive: true, timekeeperName: 'Juri L3 Sby', touchpadStatus: 'OK', backupWatches: 2 },
      4: { laneNumber: 4, isActive: true, timekeeperName: 'Juri L4 Sby', touchpadStatus: 'OK', backupWatches: 2 },
      5: { laneNumber: 5, isActive: true, timekeeperName: 'Juri L5 Sby', touchpadStatus: 'OK', backupWatches: 2 },
      6: { laneNumber: 6, isActive: true, timekeeperName: 'Juri L6 Sby', touchpadStatus: 'OK', backupWatches: 2 },
    },
    technicalDelegate: 'Ir. Sugeng Santoso (TD Jatim)',
    referee: 'Rini Indrawati, S.Pd.',
    starter: 'Budi Utomo, S.Or.',
    chiefJudge: 'Wahyu Hidayat',
    chiefRecorder: 'Farhan Maulana',
    chiefTimekeeper: 'Luki Firmansyah',
    timingDeviceType: 'SEMI_AUTOMATIC',
    timingBrand: 'Seiko Swimming Timer + Semi-Automatic Push Button Backup',
  },
  popdaJateng: {
    name: 'PEKAN OLAHRAGA PELAJAR DAERAH (POPDA) CABANG RENANG 2026',
    subTitle: 'Kompetisi Renang Tingkat Pelajar SD, SMP, SMA/SMK (Lintasan 1 & 8 Buffer Ombak)',
    venue: 'Stadion Renang Gelora Jatidiri, Semarang',
    city: 'Semarang',
    organizer: 'Dinas Kepemudaan, Olahraga dan Pariwisata Provinsi Jawa Tengah',
    poolLength: '50m',
    poolLanes: 8,
    activeLanes: [2, 3, 4, 5, 6, 7], // Buffer 1 & 8
    laneWidthMeters: 2.5,
    laneSeedingMode: 'STANDARD_SPEARHEAD',
    customLaneOrder: [4, 5, 3, 6, 2, 7],
    technicalDelegate: 'Drs. Tri Joko Raharjo, M.Si.',
    referee: 'Endang Wahyuningsih, M.Or.',
    starter: 'Kusuma Wardani, S.Pd.',
    chiefJudge: 'Heru Prasetyo',
    chiefRecorder: 'Soni Wicaksono, S.Kom',
    chiefTimekeeper: 'Anang Sudrajat',
    timingDeviceType: 'AUTOMATIC_TOUCHPAD',
    timingBrand: 'Omega Swiss Timing Ares Aquatics',
  },
};

export const SettingsView: React.FC = () => {
  const { 
    championship, 
    updateChampionship, 
    officialMinutes, 
    updateOfficialMinutes,
    events,
    athletes,
    clubs,
    openPrintModal,
    setActiveTab,
    runAutoSeedingForAllEvents,
    customStrokes,
    customAgeGroups,
    addCustomStroke,
    updateCustomStroke,
    deleteCustomStroke,
    resetDefaultStrokes,
    addCustomAgeGroup,
    updateCustomAgeGroup,
    deleteCustomAgeGroup,
    resetDefaultAgeGroups,
  } = useSwimData();

  // Local state for editable form
  const [formData, setFormData] = useState<ChampionshipInfo>(() => {
    const base = { ...championship };
    if (!base.activeLanes || base.activeLanes.length === 0) {
      base.activeLanes = Array.from({ length: base.poolLanes }, (_, i) => i + 1);
    }
    if (!base.laneWidthMeters) base.laneWidthMeters = 2.5;
    if (!base.laneSeedingMode) base.laneSeedingMode = 'STANDARD_SPEARHEAD';
    if (!base.customLaneOrder || base.customLaneOrder.length === 0) {
      base.customLaneOrder = getLaneOrder(base.poolLanes);
    }
    return base;
  });

  const [activeSubTab, setActiveSubTab] = useState<'info' | 'pool' | 'officials' | 'timing' | 'categories'>('info');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Modal states for Stroke
  const [showStrokeModal, setShowStrokeModal] = useState(false);
  const [editingStrokeCode, setEditingStrokeCode] = useState<string | null>(null);
  const [strokeCodeInput, setStrokeCodeInput] = useState('');
  const [strokeNameInput, setStrokeNameInput] = useState('');
  const [strokeShortInput, setStrokeShortInput] = useState('');
  const [strokeIsRelayInput, setStrokeIsRelayInput] = useState(false);
  const [strokeDescInput, setStrokeDescInput] = useState('');

  // Modal states for Age Group
  const [showAgeGroupModal, setShowAgeGroupModal] = useState(false);
  const [editingAgeGroupCode, setEditingAgeGroupCode] = useState<string | null>(null);
  const [agCodeInput, setAgCodeInput] = useState('');
  const [agNameInput, setAgNameInput] = useState('');
  const [agLabelInput, setAgLabelInput] = useState('');
  const [agMinAgeInput, setAgMinAgeInput] = useState<number>(0);
  const [agMaxAgeInput, setAgMaxAgeInput] = useState<number>(99);
  const [agDescInput, setAgDescInput] = useState('');

  const handleOpenAddStroke = () => {
    setEditingStrokeCode(null);
    setStrokeCodeInput('');
    setStrokeNameInput('');
    setStrokeShortInput('');
    setStrokeIsRelayInput(false);
    setStrokeDescInput('');
    setShowStrokeModal(true);
  };

  const handleOpenEditStroke = (s: StrokeConfig) => {
    setEditingStrokeCode(s.code);
    setStrokeCodeInput(s.code);
    setStrokeNameInput(s.name);
    setStrokeShortInput(s.shortName);
    setStrokeIsRelayInput(!!s.isRelay);
    setStrokeDescInput(s.description || '');
    setShowStrokeModal(true);
  };

  const handleSaveStroke = (e: React.FormEvent) => {
    e.preventDefault();
    if (!strokeNameInput.trim()) return;
    const finalCode = (editingStrokeCode || strokeCodeInput.trim() || strokeNameInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_')).toUpperCase();
    const finalShort = strokeShortInput.trim() || strokeNameInput.trim().slice(0, 8);

    addCustomStroke({
      code: finalCode,
      name: strokeNameInput.trim(),
      shortName: finalShort,
      isRelay: strokeIsRelayInput,
      isActive: true,
      description: strokeDescInput.trim(),
    });
    setShowStrokeModal(false);
    setSaveMessage(`Gaya renang "${strokeNameInput}" berhasil disimpan!`);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleOpenAddAgeGroup = () => {
    setEditingAgeGroupCode(null);
    setAgCodeInput('');
    setAgNameInput('');
    setAgLabelInput('');
    setAgMinAgeInput(0);
    setAgMaxAgeInput(99);
    setAgDescInput('');
    setShowAgeGroupModal(true);
  };

  const handleOpenEditAgeGroup = (ag: CustomAgeGroupConfig) => {
    setEditingAgeGroupCode(ag.code);
    setAgCodeInput(ag.code);
    setAgNameInput(ag.name);
    setAgLabelInput(ag.label || ag.name);
    setAgMinAgeInput(ag.minAge);
    setAgMaxAgeInput(ag.maxAge);
    setAgDescInput(ag.description || '');
    setShowAgeGroupModal(true);
  };

  const handleSaveAgeGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agNameInput.trim()) return;
    const finalCode = (editingAgeGroupCode || agCodeInput.trim() || `AGE_${agNameInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_')}`).toUpperCase();

    addCustomAgeGroup({
      code: finalCode,
      name: agNameInput.trim(),
      label: agLabelInput.trim() || agNameInput.trim(),
      minAge: Number(agMinAgeInput) || 0,
      maxAge: Number(agMaxAgeInput) || 99,
      isActive: true,
      description: agDescInput.trim(),
    });
    setShowAgeGroupModal(false);
    setSaveMessage(`Kelompok usia "${agNameInput}" berhasil disimpan!`);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const poolLanes = formData.poolLanes || 8;
  const activeLanes = formData.activeLanes || Array.from({ length: poolLanes }, (_, i) => i + 1);
  const currentLaneOrder = getLaneOrder(poolLanes, activeLanes, formData.customLaneOrder);

  const handleInputChange = (field: keyof ChampionshipInfo, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Change pool lane count (6, 8, or 10)
  const handlePoolLanesChange = (newLanes: 6 | 8 | 10) => {
    const allLanes = Array.from({ length: newLanes }, (_, i) => i + 1);
    const standardOrder = getLaneOrder(newLanes);

    setFormData(prev => ({
      ...prev,
      poolLanes: newLanes,
      activeLanes: allLanes,
      customLaneOrder: standardOrder,
      laneDetails: prev.laneDetails || {},
    }));
  };

  // Toggle single lane active / inactive
  const toggleLaneActive = (laneNum: number) => {
    setFormData(prev => {
      const current = prev.activeLanes || Array.from({ length: prev.poolLanes }, (_, i) => i + 1);
      const exists = current.includes(laneNum);
      if (exists) {
        if (current.length <= 2) {
          alert('Minimal 2 lintasan harus tetap aktif untuk menyelenggarakan perlombaan!');
          return prev;
        }
        const updated = current.filter(l => l !== laneNum);
        return { ...prev, activeLanes: updated };
      } else {
        const updated = [...current, laneNum].sort((a, b) => a - b);
        return { ...prev, activeLanes: updated };
      }
    });
  };

  // Quick Presets for Active & Buffer Lanes
  const handleSetPresetBuffer = (presetType: 'all' | 'buffer_outer' | 'center_only') => {
    const count = formData.poolLanes;
    let newActive: number[] = [];

    if (presetType === 'all') {
      newActive = Array.from({ length: count }, (_, i) => i + 1);
    } else if (presetType === 'buffer_outer') {
      // Deactivate outer lanes (1 and count)
      newActive = Array.from({ length: count }, (_, i) => i + 1).filter(l => l !== 1 && l !== count);
    } else if (presetType === 'center_only') {
      // 4 middle lanes
      if (count === 8) newActive = [3, 4, 5, 6];
      else if (count === 10) newActive = [4, 5, 6, 7];
      else newActive = [2, 3, 4, 5];
    }

    setFormData(prev => ({
      ...prev,
      activeLanes: newActive,
    }));
  };

  // Update specific lane detail (timekeeper name, touchpad status, backup watches)
  const handleUpdateLaneDetail = (laneNum: number, field: keyof LaneDetailConfig, value: any) => {
    setFormData(prev => {
      const existingDetails = prev.laneDetails || {};
      const currentLane = existingDetails[laneNum] || {
        laneNumber: laneNum,
        isActive: (prev.activeLanes || []).includes(laneNum),
        touchpadStatus: 'OK',
        backupWatches: 3,
      };

      return {
        ...prev,
        laneDetails: {
          ...existingDetails,
          [laneNum]: {
            ...currentLane,
            [field]: value,
          },
        },
      };
    });
  };

  const handleApplyPreset = (presetKey: string) => {
    const preset = PRESETS[presetKey];
    if (!preset) return;

    if (confirm(`Terapkan template "${preset.name}"? Ini akan memperbarui data kejuaraan, pengaturan lintasan, dan perangkat pertandingan.`)) {
      const updated: ChampionshipInfo = {
        ...formData,
        ...preset,
      };
      setFormData(updated);
      updateChampionship(updated);
      setSaveMessage('Template preset berhasil diterapkan! Pengaturan kejuaraan & lintasan telah diperbarui.');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    }
  };

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateChampionship(formData);
    
    // Also sync the official minutes doc number if it matches
    if (formData.officialMinutesNumber !== officialMinutes.docNumber) {
      updateOfficialMinutes({
        docNumber: formData.officialMinutesNumber,
      });
    }

    setSaveMessage('Pengaturan berhasil disimpan! Seluruh data kejuaraan dan lintasan telah disinkronkan.');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  // Save and immediately re-seed all events with new lane configuration
  const handleSaveAndReSeedAll = () => {
    if (confirm('Simpan pengaturan lintasan dan jalankan ulang auto-seeding untuk SEMUA nomor perlombaan? (Susunan heat dan lintasan perenang akan disesuaikan otomatis)')) {
      updateChampionship(formData);
      setTimeout(() => {
        runAutoSeedingForAllEvents();
        setSaveMessage('Pengaturan disimpan & Auto-Seeding berhasil dijalankan ulang untuk seluruh nomor lomba!');
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }, 100);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
              <Settings className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Pengaturan Perlombaan & Perangkat Pertandingan
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi nama kejuaraan, spesifikasi kolam & manajemen lintasan, serta susunan dewan wasit dan juri resmi sesuai regulasi PB Akuatik Indonesia / World Aquatics.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => openPrintModal('official_minutes')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Lihat di Berita Acara</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveAll()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </div>

      {/* Save Success Banner */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold">Berhasil Disimpan!</span> {saveMessage || 'Perubahan telah disinkronkan ke seluruh sistem dan dokumen cetak resmi.'}
            </div>
          </div>
          <button 
            onClick={() => setSaveSuccess(false)}
            className="text-xs text-emerald-600 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Presets Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xs space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Template Preset Cepat (Pilih untuk Mengisi Otomatis)</span>
        </div>
        <p className="text-xs text-slate-300">
          Pilih salah satu format turnamen resmi di bawah untuk mengisi konfigurasi kejuaraan, dewan wasit, dan perangkat kolam secara instan:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => handleApplyPreset('krapsi')}
            className="text-left p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 hover:border-sky-500 transition-all group"
          >
            <div className="text-xs font-bold text-white group-hover:text-sky-300">
              KRAPSI / Kejurnas
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              50m · 8 Lintasan (Semua Aktif) · GBK Jakarta
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset('kejurdaJabar')}
            className="text-left p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 hover:border-sky-500 transition-all group"
          >
            <div className="text-xs font-bold text-white group-hover:text-sky-300">
              Kejurda Jawa Barat
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              50m · 10 Lintasan · Kolam Renang UPI
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset('invitasiJatim')}
            className="text-left p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 hover:border-sky-500 transition-all group"
          >
            <div className="text-xs font-bold text-white group-hover:text-sky-300">
              Invitasi Short Course KU
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              25m · 6 Lintasan · Dispora Surabaya
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset('popdaJateng')}
            className="text-left p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 hover:border-sky-500 transition-all group"
          >
            <div className="text-xs font-bold text-white group-hover:text-sky-300">
              POPDA Pelajar (Buffer 1 & 8)
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              50m · 8 Lintasan (L2-L7 Aktif) · Semarang
            </div>
          </button>
        </div>
      </div>

      {/* Main Form Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Navigation Sub-Tabs */}
        <div className="border-b border-slate-200 bg-slate-50/70 px-4 flex items-center gap-1 sm:gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('info')}
            className={`py-3.5 px-3 sm:px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeSubTab === 'info'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>1. Nama & Identitas Kejuaraan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('pool')}
            className={`py-3.5 px-3 sm:px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeSubTab === 'pool'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Pengaturan Kolam & Lintasan</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-sky-100 text-sky-700 rounded-full">
              {activeLanes.length}/{poolLanes} Aktif
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('officials')}
            className={`py-3.5 px-3 sm:px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeSubTab === 'officials'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>3. Perangkat Pertandingan (Officials)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('timing')}
            className={`py-3.5 px-3 sm:px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeSubTab === 'timing'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>4. Alat Pencatat Waktu (Timing System)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('categories')}
            className={`py-3.5 px-3 sm:px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeSubTab === 'categories'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>5. Gaya Renang & Kelompok Usia</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full">
              {customAgeGroups.length} KU · {customStrokes.length} Gaya
            </span>
          </button>
        </div>

        {/* Tab Content Form */}
        <form onSubmit={handleSaveAll} className="p-6 sm:p-8 space-y-6">
          {/* TAB 1: IDENTITAS & NAMA PERLOMBAAN */}
          {activeSubTab === 'info' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">
                  Nama Resmi & Informasi Dasar Kejuaraan
                </h2>
                <p className="text-xs text-slate-500">
                  Nama kejuaraan akan ditampilkan di header utama aplikasi, buku acara pertandingan (Start List), lembar hasil lomba, dan kop surat Berita Acara resmi.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap Perlombaan / Kejuaraan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    placeholder="Contoh: KEJUARAAN RENANG ANTAR PERKUMPULAN SELURUH INDONESIA (KRAPSI) 2026"
                    className="w-full px-3.5 py-2.5 text-sm font-semibold border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Format resmi huruf kapital dianjurkan untuk kop surat standar World Aquatics dan PB Akuatik Indonesia.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sub-Judul / Kategori Kejuaraan
                  </label>
                  <input
                    type="text"
                    value={formData.subTitle}
                    onChange={e => handleInputChange('subTitle', e.target.value)}
                    placeholder="Contoh: Piala Terbuka Akuatik Indonesia / Kualifikasi PON & Pelatnas"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Badan Penyelenggara (Organizer) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.organizer}
                      onChange={e => handleInputChange('organizer', e.target.value)}
                      placeholder="Contoh: Pengurus Besar Akuatik Indonesia (PB PRSI)"
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kota Penyelenggara <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={e => handleInputChange('city', e.target.value)}
                      placeholder="Contoh: Jakarta Pusat"
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lokasi Kolam / Nama Venue <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.venue}
                      onChange={e => handleInputChange('venue', e.target.value)}
                      placeholder="Contoh: Stadion Akuatik Gelora Bung Karno (GBK), Senayan, Jakarta"
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor Dokumen Berita Acara Resmi (BA)
                    </label>
                    <input
                      type="text"
                      value={formData.officialMinutesNumber}
                      onChange={e => handleInputChange('officialMinutesNumber', e.target.value)}
                      placeholder="Contoh: 014/BA-LOMBA/KRAPSI/X/2026"
                      className="w-full px-3.5 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tanggal Mulai Perlombaan
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={e => handleInputChange('startDate', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tanggal Selesai Perlombaan
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={e => handleInputChange('endDate', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tanggal Batas Usia (Cutoff KU)
                    </label>
                    <input
                      type="date"
                      value={formData.cutoffDate}
                      onChange={e => handleInputChange('cutoffDate', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Standar: 31 Desember tahun berjalan
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Regulasi / Ketentuan Tambahan
                  </label>
                  <textarea
                    rows={2}
                    value={formData.officialNotes}
                    onChange={e => handleInputChange('officialNotes', e.target.value)}
                    placeholder="Catatan tambahan mengenai peraturan, protes, atau ketentuan seragam perlombaan..."
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PENGATURAN KOLAM & MANAJEMEN LINTASAN */}
          {activeSubTab === 'pool' && (
            <div className="space-y-8">
              {/* Header Tab 2 */}
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Pengaturan Spesifikasi Kolam & Manajemen Lintasan (Lane Settings)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Konfigurasi jumlah lintasan kolam, lintasan aktif, penyangga ombak (buffer lanes), pola penempatan seeding, serta petugas timekeeper per lintasan.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveAndReSeedAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors shrink-0"
                  title="Simpan pengaturan ini dan terapkan langsung ke seluruh heat perlombaan"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Terapkan & Re-Seed Semua Lomba</span>
                </button>
              </div>

              {/* 1. Dimensi Kolam & Jumlah Lintasan */}
              <div className="space-y-3">
                <span className="block text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-sky-600" />
                  <span>1. Dimensi Kolam & Kapasitas Lintasan</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Panjang Kolam */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <span className="block text-[11px] font-bold text-slate-700 uppercase">
                      Panjang Kolam
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleInputChange('poolLength', '50m')}
                        className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                          formData.poolLength === '50m'
                            ? 'border-sky-500 bg-sky-50 text-sky-950 font-bold shadow-2xs'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-sm font-extrabold font-mono">50m</div>
                        <div className="text-[10px] text-slate-500">Long Course</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleInputChange('poolLength', '25m')}
                        className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                          formData.poolLength === '25m'
                            ? 'border-sky-500 bg-sky-50 text-sky-950 font-bold shadow-2xs'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-sm font-extrabold font-mono">25m</div>
                        <div className="text-[10px] text-slate-500">Short Course</div>
                      </button>
                    </div>
                  </div>

                  {/* Jumlah Lintasan Fisik Kolam */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <span className="block text-[11px] font-bold text-slate-700 uppercase">
                      Jumlah Lintasan Fisik Kolam
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {[6, 8, 10].map(lanes => (
                        <button
                          key={lanes}
                          type="button"
                          onClick={() => handlePoolLanesChange(lanes as 6 | 8 | 10)}
                          className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                            formData.poolLanes === lanes
                              ? 'border-sky-500 bg-sky-50 text-sky-950 font-bold shadow-2xs'
                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-sm font-extrabold font-mono">{lanes}</div>
                          <div className="text-[10px] text-slate-500">Lintasan</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lebar Lintasan & Kedalaman */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <span className="block text-[11px] font-bold text-slate-700 uppercase">
                      Lebar per Lintasan (Standar WA)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleInputChange('laneWidthMeters', 2.5)}
                        className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                          (formData.laneWidthMeters || 2.5) === 2.5
                            ? 'border-sky-500 bg-sky-50 text-sky-950 font-bold shadow-2xs'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-sm font-extrabold font-mono">2.5 m</div>
                        <div className="text-[10px] text-slate-500">Olimpiade/World Aq</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleInputChange('laneWidthMeters', 2.0)}
                        className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                          formData.laneWidthMeters === 2.0
                            ? 'border-sky-500 bg-sky-50 text-sky-950 font-bold shadow-2xs'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-sm font-extrabold font-mono">2.0 m</div>
                        <div className="text-[10px] text-slate-500">Standar Nasional</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Pengaturan Lintasan Aktif & Penyangga Gelombang (Buffer Lanes) */}
              <div className="space-y-3 p-5 rounded-2xl border border-slate-200 bg-slate-50/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                      2. Lintasan yang Digunakan untuk Pertandingan ({activeLanes.length} dari {poolLanes} Aktif)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Klik pada lintasan untuk mengaktifkan atau menonaktifkan. Lintasan non-aktif akan otomatis dikosongkan saat auto-seeding.
                    </span>
                  </div>

                  {/* Tombol Preset Cepat Buffer */}
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-lg text-xs shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSetPresetBuffer('all')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                        activeLanes.length === poolLanes 
                          ? 'bg-sky-600 text-white font-bold' 
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Semua Aktif (1-{poolLanes})
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetPresetBuffer('buffer_outer')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                        activeLanes.length === poolLanes - 2 && !activeLanes.includes(1) && !activeLanes.includes(poolLanes)
                          ? 'bg-amber-600 text-white font-bold' 
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                      title="Mengosongkan lintasan 1 dan lintasan terluar untuk meredam pantulan ombak dinding kolam"
                    >
                      Kosongkan Tepi (Buffer 1 & {poolLanes})
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetPresetBuffer('center_only')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                        activeLanes.length === 4
                          ? 'bg-indigo-600 text-white font-bold' 
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      4 Lintasan Tengah Saja
                    </button>
                  </div>
                </div>

                {/* Grid Kartu Setiap Lintasan dengan Toggle */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-2">
                  {Array.from({ length: poolLanes }, (_, i) => i + 1).map(laneNum => {
                    const isActive = activeLanes.includes(laneNum);
                    const colorInfo = getDefaultLaneColor(laneNum, poolLanes);
                    const seedOrderIndex = currentLaneOrder.indexOf(laneNum);
                    const seedRankText = seedOrderIndex !== -1 ? `Unggulan #${seedOrderIndex + 1}` : 'Non-Aktif';

                    return (
                      <div
                        key={laneNum}
                        onClick={() => toggleLaneActive(laneNum)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer relative ${
                          isActive
                            ? 'bg-white border-slate-300 shadow-2xs hover:border-sky-500'
                            : 'bg-slate-100 border-dashed border-slate-300 opacity-60 hover:opacity-85'
                        }`}
                      >
                        {/* Top Indicator */}
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className={`w-2.5 h-2.5 rounded-full ${colorInfo.bgClass}`}></span>
                          <span className={isActive ? 'font-bold text-sky-700' : 'text-slate-400'}>
                            {isActive ? 'AKTIF' : 'BUFFER'}
                          </span>
                        </div>

                        <div className="font-mono text-2xl font-black text-slate-900">
                          L{laneNum}
                        </div>

                        <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                          {colorInfo.name.split('(')[0].trim()}
                        </div>

                        <div className={`mt-2 py-0.5 px-1.5 rounded-md text-[10px] font-bold ${
                          isActive 
                            ? 'bg-sky-50 text-sky-800 border border-sky-100' 
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          {seedRankText}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-1">
                  <Info className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>
                    Di kejuaraan resmi, lintasan tepi (1 & {poolLanes}) kerap dikosongkan (*Buffer Lanes*) demi mencegah kerugian atlet akibat benturan gelombang pantul dinding kolam.
                  </span>
                </div>
              </div>

              {/* 3. Pola Urutan Seeding Lintasan */}
              <div className="space-y-3 p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs">
                <span className="block text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-sky-600" />
                  <span>3. Pola Urutan Alokasi Seeding (Spearhead Assignment)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    (formData.laneSeedingMode || 'STANDARD_SPEARHEAD') === 'STANDARD_SPEARHEAD'
                      ? 'border-sky-500 bg-sky-50/70 text-sky-950 font-bold ring-1 ring-sky-500 shadow-2xs'
                      : 'border-slate-300 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="laneSeedingMode"
                      value="STANDARD_SPEARHEAD"
                      checked={(formData.laneSeedingMode || 'STANDARD_SPEARHEAD') === 'STANDARD_SPEARHEAD'}
                      onChange={() => handleInputChange('laneSeedingMode', 'STANDARD_SPEARHEAD')}
                      className="sr-only"
                    />
                    <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                      <span>Spearhead Standar World Aquatics</span>
                      <CheckCircle2 className="w-4 h-4 text-sky-600" />
                    </div>
                    <p className="text-[11px] font-normal text-slate-500 mt-1">
                      Perenang tercepat (Seed #1) ditempatkan di lintasan tengah (L4/L5), diikuti menyebar ke arah luar zig-zag.
                    </p>
                  </label>

                  <label className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    formData.laneSeedingMode === 'CENTER_TO_OUTWARD'
                      ? 'border-sky-500 bg-sky-50/70 text-sky-950 font-bold ring-1 ring-sky-500 shadow-2xs'
                      : 'border-slate-300 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="laneSeedingMode"
                      value="CENTER_TO_OUTWARD"
                      checked={formData.laneSeedingMode === 'CENTER_TO_OUTWARD'}
                      onChange={() => handleInputChange('laneSeedingMode', 'CENTER_TO_OUTWARD')}
                      className="sr-only"
                    />
                    <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                      <span>Pusat Kiri Tercepat (5-4-6-3...)</span>
                      <Radio className="w-4 h-4 text-sky-600" />
                    </div>
                    <p className="text-[11px] font-normal text-slate-500 mt-1">
                      Perenang unggulan pertama menempati lintasan 5, unggulan kedua di lintasan 4.
                    </p>
                  </label>

                  <label className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    formData.laneSeedingMode === 'CUSTOM'
                      ? 'border-sky-500 bg-sky-50/70 text-sky-950 font-bold ring-1 ring-sky-500 shadow-2xs'
                      : 'border-slate-300 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="laneSeedingMode"
                      value="CUSTOM"
                      checked={formData.laneSeedingMode === 'CUSTOM'}
                      onChange={() => handleInputChange('laneSeedingMode', 'CUSTOM')}
                      className="sr-only"
                    />
                    <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                      <span>Urutan Kustom Panitia</span>
                      <Radio className="w-4 h-4 text-sky-600" />
                    </div>
                    <p className="text-[11px] font-normal text-slate-500 mt-1">
                      Tentukan sendiri nomor lintasan prioritas untuk perenang tercepat sesuai kebutuhan khusus venue.
                    </p>
                  </label>
                </div>

                {/* Display Current Seeding Order Sequence */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    Urutan Alokasi Perenang (Tercepat → Terlambat):
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {currentLaneOrder.map((lane, idx) => (
                      <span
                        key={lane}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-300 font-mono text-xs font-bold text-slate-800 shadow-2xs"
                      >
                        <span className="text-[10px] text-slate-400 font-normal">#{idx + 1}</span>
                        <span>L{lane}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Visualisasi Kolam Renang Interaktif Realtime */}
              <div className="space-y-3">
                <span className="block text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-sky-600" />
                  <span>4. Visualisasi Kolam Renang & Garis Tali Lintasan (World Aquatics SW 1)</span>
                </span>

                <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 text-white space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                    <span className="font-bold text-sky-400">
                      Kolam {formData.poolLength} · {poolLanes} Lintasan Fisik · Lebar {formData.laneWidthMeters || 2.5}m/lintasan
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Tali Kuning (Pusat)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Tali Biru
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Tali Hijau (Tepi)
                      </span>
                    </div>
                  </div>

                  {/* Lanes Visual Simulation Deck */}
                  <div className="space-y-1.5">
                    {Array.from({ length: poolLanes }, (_, i) => i + 1).map(laneNum => {
                      const isActive = activeLanes.includes(laneNum);
                      const colorInfo = getDefaultLaneColor(laneNum, poolLanes);
                      const laneDetail = (formData.laneDetails || {})[laneNum];
                      const seedRank = currentLaneOrder.indexOf(laneNum);

                      return (
                        <div
                          key={laneNum}
                          className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                            isActive
                              ? 'bg-slate-900/90 border-slate-700/80 hover:bg-slate-800/80'
                              : 'bg-slate-950/60 border-dashed border-slate-800 opacity-40'
                          }`}
                        >
                          {/* Lane Number Badge */}
                          <div className="w-9 h-8 rounded-md bg-slate-800 flex items-center justify-center font-mono font-bold text-xs text-white shrink-0">
                            L{laneNum}
                          </div>

                          {/* Rope Colored Strip */}
                          <div className={`w-2.5 h-8 rounded-sm ${colorInfo.bgClass} shrink-0`}></div>

                          {/* Lane Pool Body (Water lane representation) */}
                          <div className="flex-1 min-w-0 flex items-center justify-between px-3 py-1 rounded-sm bg-gradient-to-r from-sky-950/60 via-sky-900/40 to-sky-950/60 border border-sky-800/30">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-xs font-semibold text-white">
                                {isActive ? (
                                  <span className="text-sky-300">
                                    Lintasan Kompetisi {seedRank !== -1 ? `(Alokasi Unggulan #${seedRank + 1})` : ''}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">
                                    Dikosongkan (Buffer Ombak Dinding)
                                  </span>
                                )}
                              </span>

                              {laneDetail?.timekeeperName && (
                                <span className="hidden sm:inline text-[11px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded-sm border border-slate-700">
                                  Timekeeper: {laneDetail.timekeeperName}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[10px] px-2 py-0.5 rounded-sm font-mono font-bold ${
                                isActive ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-slate-800 text-slate-500'
                              }`}>
                                {isActive ? 'STATUS: AKTIF' : 'NON-AKTIF'}
                              </span>
                            </div>
                          </div>

                          {/* Block Start Box */}
                          <div className="w-12 h-8 rounded-md bg-amber-500/20 border border-amber-500/40 flex flex-col items-center justify-center shrink-0 text-[9px] font-mono font-bold text-amber-300">
                            <span>BLOCK</span>
                            <span>#{laneNum}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 5. Detail Petugas Timekeeper & Sensor Touchpad per Lintasan */}
              <div className="space-y-3">
                <span className="block text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-600" />
                  <span>5. Petugas Timekeeper & Sensor Touchpad per Lintasan</span>
                </span>
                <p className="text-xs text-slate-500">
                  Tugaskan petugas pencatat waktu dan periksa kesiapan pelat sentuh elektrik (*touchpad*) pada masing-masing lintasan.
                </p>

                <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Lintasan</th>
                        <th className="py-2.5 px-3">Warna Tali</th>
                        <th className="py-2.5 px-3">Status Lintasan</th>
                        <th className="py-2.5 px-3">Petugas Pencatat Waktu (Timekeeper)</th>
                        <th className="py-2.5 px-3">Kondisi Touchpad</th>
                        <th className="py-2.5 px-3">Stopwatch Cadangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Array.from({ length: poolLanes }, (_, i) => i + 1).map(laneNum => {
                        const isActive = activeLanes.includes(laneNum);
                        const colorInfo = getDefaultLaneColor(laneNum, poolLanes);
                        const detail = (formData.laneDetails || {})[laneNum] || {
                          laneNumber: laneNum,
                          isActive,
                          timekeeperName: `Timekeeper L${laneNum}`,
                          touchpadStatus: 'OK',
                          backupWatches: 3,
                        };

                        return (
                          <tr key={laneNum} className={isActive ? 'hover:bg-slate-50/50' : 'bg-slate-50/40 opacity-70'}>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900">
                              L{laneNum}
                            </td>
                            <td className="py-2 px-3">
                              <span className="inline-flex items-center gap-1.5">
                                <span className={`w-2.5 h-2.5 rounded-full ${colorInfo.bgClass}`}></span>
                                <span className="text-[11px] text-slate-600">{colorInfo.name.split('(')[0]}</span>
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <button
                                type="button"
                                onClick={() => toggleLaneActive(laneNum)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                                  isActive
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                }`}
                              >
                                {isActive ? 'Aktif' : 'Non-Aktif (Buffer)'}
                              </button>
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={detail.timekeeperName || ''}
                                onChange={e => handleUpdateLaneDetail(laneNum, 'timekeeperName', e.target.value)}
                                placeholder={`Nama Petugas L${laneNum}`}
                                className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 bg-white"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={detail.touchpadStatus || 'OK'}
                                onChange={e => handleUpdateLaneDetail(laneNum, 'touchpadStatus', e.target.value)}
                                className="px-2 py-1 text-xs border border-slate-300 rounded-md focus:outline-hidden bg-white"
                              >
                                <option value="OK">Normal / Siap (OK)</option>
                                <option value="BACKUP_ONLY">Cadangan Manual Saja</option>
                                <option value="OFFLINE">Offline / Rusak</option>
                              </select>
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={detail.backupWatches || 3}
                                onChange={e => handleUpdateLaneDetail(laneNum, 'backupWatches', Number(e.target.value))}
                                className="px-2 py-1 text-xs border border-slate-300 rounded-md focus:outline-hidden bg-white font-mono"
                              >
                                <option value={3}>3 Stopwatch Manual</option>
                                <option value={2}>2 Stopwatch Manual</option>
                                <option value={1}>1 Stopwatch Manual</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PERANGKAT PERTANDINGAN (TECHNICAL OFFICIALS) */}
          {activeSubTab === 'officials' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Susunan Dewan Wasit & Perangkat Pertandingan Resmi
                  </h2>
                  <p className="text-xs text-slate-500">
                    Pejabat teknis yang memimpin jalannya perlombaan, mengesahkan hasil, dan menandatangani Berita Acara.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200">
                  Standar PB Akuatik Indonesia
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Technical Delegate */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    1. Technical Delegate (TD) <span className="text-red-500">*</span>
                  </label>
                  <span className="block text-[11px] text-slate-500">
                    Pengawas teknis tertinggi penugasan dari federasi / PB Akuatik
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.technicalDelegate}
                    onChange={e => handleInputChange('technicalDelegate', e.target.value)}
                    placeholder="Nama Lengkap & Gelar (e.g. Bambang Sutrisno, S.Pd., M.Or.)"
                    className="w-full mt-1.5 px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                {/* 2. Referee */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    2. Wasit Utama (Referee / Refri) <span className="text-red-500">*</span>
                  </label>
                  <span className="block text-[11px] text-slate-500">
                    Memimpin perlombaan, memutuskan pelanggaran & diskualifikasi
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.referee}
                    onChange={e => handleInputChange('referee', e.target.value)}
                    placeholder="Nama Wasit Utama (e.g. Dra. Siti Rahayu, M.Si.)"
                    className="w-full mt-1.5 px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                {/* 3. Starter */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    3. Starter (Pelepas Perlombaan)
                  </label>
                  <span className="block text-[11px] text-slate-500">
                    Memberikan aba-aba start dan mengidentifikasi false start
                  </span>
                  <input
                    type="text"
                    value={formData.starter || ''}
                    onChange={e => handleInputChange('starter', e.target.value)}
                    placeholder="Nama Starter (e.g. Drs. Agus Wijaya)"
                    className="w-full mt-1.5 px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                {/* 4. Chief Finish Judge */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    4. Ketua Juri Kedatangan (Chief Judge) <span className="text-red-500">*</span>
                  </label>
                  <span className="block text-[11px] text-slate-500">
                    Memimpin juri kedatangan dalam menentukan urutan finish
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.chiefJudge}
                    onChange={e => handleInputChange('chiefJudge', e.target.value)}
                    placeholder="Nama Ketua Juri (e.g. Ir. Hendra Gunawan)"
                    className="w-full mt-1.5 px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                {/* 5. Chief Recorder */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    5. Ketua Pencatat Waktu & Hasil (Chief Recorder) <span className="text-red-500">*</span>
                  </label>
                  <span className="block text-[11px] text-slate-500">
                    Mengelola rekapan catatan waktu dan penetapan ranking resmi
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.chiefRecorder}
                    onChange={e => handleInputChange('chiefRecorder', e.target.value)}
                    placeholder="Nama Ketua Rekorder (e.g. Ahmad Fauzi, S.Kom)"
                    className="w-full mt-1.5 px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                {/* 6. Chief Timekeeper */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    6. Ketua Pengukur Waktu (Chief Timekeeper)
                  </label>
                  <span className="block text-[11px] text-slate-500">
                    Mengkoordinasikan timekeeper di setiap lintasan
                  </span>
                  <input
                    type="text"
                    value={formData.chiefTimekeeper || ''}
                    onChange={e => handleInputChange('chiefTimekeeper', e.target.value)}
                    placeholder="Nama Pengukur Waktu (e.g. Rizal Prasetyo, S.Or.)"
                    className="w-full mt-1.5 px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                {/* 7. Stroke Judge */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    7. Juri Gaya (Stroke Judges)
                  </label>
                  <span className="block text-[11px] text-slate-500">
                    Mengawasi keabsahan gerakan gaya perenang sepanjang sisi kolam
                  </span>
                  <input
                    type="text"
                    value={formData.strokeJudge || ''}
                    onChange={e => handleInputChange('strokeJudge', e.target.value)}
                    placeholder="Contoh: Eko Purnomo & Maya Kusuma"
                    className="w-full mt-1.5 px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                {/* 8. Turn Judge */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    8. Juri Pembalikan (Turn Judges)
                  </label>
                  <span className="block text-[11px] text-slate-500">
                    Mengawasi sentuhan dinding pembalikan dan finish tiap lintasan
                  </span>
                  <input
                    type="text"
                    value={formData.turnJudge || ''}
                    onChange={e => handleInputChange('turnJudge', e.target.value)}
                    placeholder="Contoh: Tri Haryanto & Dian Anggraini"
                    className="w-full mt-1.5 px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                {/* 9. Clerk of Course */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    9. Pengatur Lintasan & Ruang Panggil (Clerk of Course / Call Room)
                  </label>
                  <span className="block text-[11px] text-slate-500">
                    Memeriksa kehadiran atlet di Call Room sebelum menuju blok start
                  </span>
                  <input
                    type="text"
                    value={formData.clerkOfCourse || ''}
                    onChange={e => handleInputChange('clerkOfCourse', e.target.value)}
                    placeholder="Nama Petugas Call Room (e.g. Bayu Saputra)"
                    className="w-full mt-1.5 px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                {/* 10. Announcer */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    10. Penyiar Lomba (Official Announcer)
                  </label>
                  <span className="block text-[11px] text-slate-500">
                    Mengumumkan nomor perlombaan, susunan atlet, dan perolehan waktu
                  </span>
                  <input
                    type="text"
                    value={formData.announcer || ''}
                    onChange={e => handleInputChange('announcer', e.target.value)}
                    placeholder="Nama Announcer (e.g. Dewi Lestari, S.I.Kom)"
                    className="w-full mt-1.5 px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PERANGKAT WAKTU (TIMING SYSTEM) */}
          {activeSubTab === 'timing' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">
                  Perangkat Sistem Pencatat Waktu (Timing & Judging Equipment)
                </h2>
                <p className="text-xs text-slate-500">
                  Konfigurasi jenis perangkat pencatatan waktu otomatis, semi-otomatis, atau manual stopwatch sesuai World Aquatics SW 12 & SW 13.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    Metode Utama Pengukuran Waktu Perlombaan
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      (formData.timingDeviceType || 'AUTOMATIC_TOUCHPAD') === 'AUTOMATIC_TOUCHPAD'
                        ? 'border-sky-500 bg-sky-50/80 text-sky-950 font-bold shadow-2xs ring-1 ring-sky-500'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}>
                      <input
                        type="radio"
                        name="timingDeviceType"
                        value="AUTOMATIC_TOUCHPAD"
                        checked={(formData.timingDeviceType || 'AUTOMATIC_TOUCHPAD') === 'AUTOMATIC_TOUCHPAD'}
                        onChange={() => handleInputChange('timingDeviceType', 'AUTOMATIC_TOUCHPAD')}
                        className="sr-only"
                      />
                      <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                        <span>Touchpad Otomatis (AET)</span>
                        <Cpu className="w-4 h-4 text-sky-600" />
                      </div>
                      <p className="text-[11px] font-normal text-slate-500 mt-1">
                        Sistem elektronik terintegrasi pelat sentuh dinding (Automatic Officiating Equipment). Standar Olimpiade & Kejurnas.
                      </p>
                    </label>

                    <label className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      formData.timingDeviceType === 'SEMI_AUTOMATIC'
                        ? 'border-sky-500 bg-sky-50/80 text-sky-950 font-bold shadow-2xs ring-1 ring-sky-500'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}>
                      <input
                        type="radio"
                        name="timingDeviceType"
                        value="SEMI_AUTOMATIC"
                        checked={formData.timingDeviceType === 'SEMI_AUTOMATIC'}
                        onChange={() => handleInputChange('timingDeviceType', 'SEMI_AUTOMATIC')}
                        className="sr-only"
                      />
                      <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                        <span>Semi-Otomatis (Push Button)</span>
                        <Clock className="w-4 h-4 text-indigo-600" />
                      </div>
                      <p className="text-[11px] font-normal text-slate-500 mt-1">
                        Start otomatis elektrik, pencatatan waktu finish menggunakan tombol tekan kabel juri lintasan.
                      </p>
                    </label>

                    <label className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      formData.timingDeviceType === 'MANUAL_STOPWATCH'
                        ? 'border-sky-500 bg-sky-50/80 text-sky-950 font-bold shadow-2xs ring-1 ring-sky-500'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}>
                      <input
                        type="radio"
                        name="timingDeviceType"
                        value="MANUAL_STOPWATCH"
                        checked={formData.timingDeviceType === 'MANUAL_STOPWATCH'}
                        onChange={() => handleInputChange('timingDeviceType', 'MANUAL_STOPWATCH')}
                        className="sr-only"
                      />
                      <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                        <span>Stopwatch Manual 3 Tombol</span>
                        <Layers className="w-4 h-4 text-amber-600" />
                      </div>
                      <p className="text-[11px] font-normal text-slate-500 mt-1">
                        Tiga pengukur waktu manual per lintasan dengan perhitungan waktu tengah / rata-rata resmi.
                      </p>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Merk / Model Perangkat Pencatat Waktu & Software
                  </label>
                  <input
                    type="text"
                    value={formData.timingBrand || ''}
                    onChange={e => handleInputChange('timingBrand', e.target.value)}
                    placeholder="Contoh: Omega Swiss Timing Quantum Aquatics (Touchpad L1-L8 + Backup 3-Watch)"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Spesifikasi merk peralatan ini dicantumkan pada Berita Acara Pelaksanaan Lomba.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GAYA RENANG & KELOMPOK USIA (CUSTOM) */}
          {activeSubTab === 'categories' && (
            <div className="space-y-8">
              {/* Header Tab Explanation */}
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-sky-600" />
                    <span>Pengaturan Kustomisasi Gaya Renang & Kelompok Usia</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Konfigurasi daftar gaya renang dan kelompok usia sesuai aturan Technical Meeting (TM) kejuaraan. Perubahan langsung otomatis digunakan di formulir Tambah Nomor Lomba, Filter Atlet, dan Berkas Pertandingan.
                  </p>
                </div>
              </div>

              {/* SEKSI 1: GAYA RENANG */}
              <div className="space-y-4 bg-slate-50/60 p-5 rounded-2xl border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                      <span>Daftar Gaya Renang ({customStrokes.length} Gaya Terdaftar)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Kelola nama, kode sistem, dan tipe nomor (perorangan / estafet).
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Kembalikan daftar gaya renang ke pengaturan standar World Aquatics?')) {
                          resetDefaultStrokes();
                        }
                      }}
                      className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Reset ke standar resmi FINA/World Aquatics"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                      <span>Reset Standar</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenAddStroke}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Gaya Renang</span>
                    </button>
                  </div>
                </div>

                {/* Table of Strokes */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Kode Sistem</th>
                          <th className="py-2.5 px-3">Nama Gaya Renang</th>
                          <th className="py-2.5 px-3">Singkatan</th>
                          <th className="py-2.5 px-3">Tipe</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customStrokes.map(st => (
                          <tr key={st.code} className={`hover:bg-slate-50/70 ${!st.isActive ? 'opacity-50 bg-slate-50' : ''}`}>
                            <td className="py-2.5 px-3 font-mono font-bold text-sky-800 text-[11px]">
                              {st.code}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-slate-900">{st.name}</span>
                              {st.description && (
                                <span className="block text-[10px] text-slate-400 mt-0.5">{st.description}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                                {st.shortName}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              {st.isRelay ? (
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-700">
                                  Estafet
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-100 text-sky-700">
                                  Perorangan
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <button
                                type="button"
                                onClick={() => updateCustomStroke(st.code, { isActive: !st.isActive })}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-colors cursor-pointer ${
                                  st.isActive 
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                }`}
                              >
                                {st.isActive ? 'Aktif' : 'Non-Aktif'}
                              </button>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditStroke(st)}
                                  className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-md transition-colors cursor-pointer"
                                  title="Edit Gaya"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (customStrokes.length <= 1) {
                                      alert('Minimal 1 gaya renang harus tetap ada!');
                                      return;
                                    }
                                    if (confirm(`Hapus gaya renang "${st.name}"?`)) {
                                      deleteCustomStroke(st.code);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                  title="Hapus Gaya"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* SEKSI 2: KELOMPOK USIA (AGE GROUPS) */}
              <div className="space-y-4 bg-slate-50/60 p-5 rounded-2xl border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <span>Daftar Kelompok Usia ({customAgeGroups.length} Kategori Terdaftar)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Tentukan label kode kelompok usia (contoh: A-I, KU I-V, atau Per Usia).
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Preset Picker */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-slate-400 font-semibold px-1.5 uppercase">Preset:</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Terapkan template kelompok usia format huruf A - I?')) {
                            resetDefaultAgeGroups('A_I');
                          }
                        }}
                        className="px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                        title="Format A (≤6) s/d I (14+) & Open"
                      >
                        Format A - I
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Terapkan template kelompok usia standar PB Akuatik (KU I - KU V & Senior)?')) {
                            resetDefaultAgeGroups('PRSI_KU');
                          }
                        }}
                        className="px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                        title="Format Senior & KU I - KU V"
                      >
                        Standar PRSI (KU I-V)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Terapkan template kelompok usia per usia tunggal (Usia ≤6 s/d 19+)?')) {
                            resetDefaultAgeGroups('PER_AGE');
                          }
                        }}
                        className="px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                        title="Format Usia Tunggal 6 - 19+"
                      >
                        Per Usia Tunggal
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenAddAgeGroup}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Kelompok Usia</span>
                    </button>
                  </div>
                </div>

                {/* Table of Age Groups */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Kode Sistem</th>
                          <th className="py-2.5 px-3">Nama / Label Kategori</th>
                          <th className="py-2.5 px-3">Rentang Usia (Min - Max)</th>
                          <th className="py-2.5 px-3">Deskripsi / Keterangan</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customAgeGroups.map(ag => (
                          <tr key={ag.code} className={`hover:bg-slate-50/70 ${!ag.isActive ? 'opacity-50 bg-slate-50' : ''}`}>
                            <td className="py-2.5 px-3 font-mono font-bold text-amber-800 text-[11px]">
                              {ag.code}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-extrabold text-slate-900 text-sm px-2.5 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                                {ag.name}
                              </span>
                              {ag.label && ag.label !== ag.name && (
                                <span className="text-[11px] text-slate-500 ml-2">({ag.label})</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono">
                              {ag.minAge === 0 && ag.maxAge >= 90 ? (
                                <span className="text-slate-500">Semua Usia (0 - ∞)</span>
                              ) : ag.minAge === ag.maxAge ? (
                                <span className="font-bold text-slate-800">Tepat {ag.minAge} Tahun</span>
                              ) : ag.maxAge >= 90 ? (
                                <span className="font-bold text-slate-800">≥ {ag.minAge} Tahun</span>
                              ) : ag.minAge === 0 ? (
                                <span className="font-bold text-slate-800">≤ {ag.maxAge} Tahun</span>
                              ) : (
                                <span className="font-bold text-slate-800">{ag.minAge} - {ag.maxAge} Tahun</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                              {ag.description || '-'}
                            </td>
                            <td className="py-2.5 px-3">
                              <button
                                type="button"
                                onClick={() => updateCustomAgeGroup(ag.code, { isActive: !ag.isActive })}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-colors cursor-pointer ${
                                  ag.isActive 
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                }`}
                              >
                                {ag.isActive ? 'Aktif' : 'Non-Aktif'}
                              </button>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditAgeGroup(ag)}
                                  className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                                  title="Edit Kelompok Usia"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (customAgeGroups.length <= 1) {
                                      alert('Minimal 1 kelompok usia harus tetap ada!');
                                      return;
                                    }
                                    if (confirm(`Hapus kelompok usia "${ag.name}"?`)) {
                                      deleteCustomAgeGroup(ag.code);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                  title="Hapus Kelompok Usia"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Perubahan disimpan otomatis di memori lokal peramban (localStorage).
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...championship });
                  alert('Perubahan formulir dibatalkan, mengembalikan nilai tersimpan.');
                }}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Reset Perubahan
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Pengaturan Sekarang</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Live Preview Box: Official Kop Surat & Signatures */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Pratinjau Langsung: Kop Surat & Pengesahan Perangkat Lomba
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Tampilan di Berita Acara & Lembar Hasil Resmi
          </span>
        </div>

        {/* Mock Official Header */}
        <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 text-center space-y-1">
          <div className="text-xs font-bold tracking-widest uppercase text-slate-600">
            {formData.organizer || 'PENGURUS BESAR AKUATIK INDONESIA'}
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
            {formData.name || 'NAMA PERLOMBAAN RENANG'}
          </h2>
          <div className="text-xs text-slate-600 font-medium">
            {formData.venue || 'Nama Venue / Kolam Renang'} · Kolam {formData.poolLength} ({formData.poolLanes} Lintasan, {activeLanes.length} Aktif) · {formData.startDate} s/d {formData.endDate}
          </div>
          {formData.timingBrand && (
            <div className="text-[10px] text-sky-700 pt-1 font-mono font-semibold">
              Sistem Waktu: {formData.timingBrand}
            </div>
          )}
        </div>

        {/* Mock Signatures 4-Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Technical Delegate</span>
            <div className="h-10 flex items-center justify-center font-serif italic text-sky-900 text-sm">
              {formData.technicalDelegate ? formData.technicalDelegate.split(' ')[0] : 'Nama TD'}
            </div>
            <span className="font-bold text-slate-900 block truncate text-[11px]">
              {formData.technicalDelegate || '-'}
            </span>
            <span className="text-[10px] text-slate-400">World Aquatics / PB Akuatik</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Wasit Utama (Referee)</span>
            <div className="h-10 flex items-center justify-center font-serif italic text-sky-900 text-sm">
              {formData.referee ? formData.referee.split(' ')[0] : 'Nama Refri'}
            </div>
            <span className="font-bold text-slate-900 block truncate text-[11px]">
              {formData.referee || '-'}
            </span>
            <span className="text-[10px] text-slate-400">Wasit Nasional</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Ketua Juri Kedatangan</span>
            <div className="h-10 flex items-center justify-center font-serif italic text-sky-900 text-sm">
              {formData.chiefJudge ? formData.chiefJudge.split(' ')[0] : 'Nama Juri'}
            </div>
            <span className="font-bold text-slate-900 block truncate text-[11px]">
              {formData.chiefJudge || '-'}
            </span>
            <span className="text-[10px] text-slate-400">Chief Judge</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Ketua Pencatat Waktu</span>
            <div className="h-10 flex items-center justify-center font-serif italic text-sky-900 text-sm">
              {formData.chiefRecorder ? formData.chiefRecorder.split(' ')[0] : 'Nama Rekorder'}
            </div>
            <span className="font-bold text-slate-900 block truncate text-[11px]">
              {formData.chiefRecorder || '-'}
            </span>
            <span className="text-[10px] text-slate-400">Chief Recorder</span>
          </div>
        </div>
      </div>

      {/* Modal Add / Edit Gaya Renang */}
      {showStrokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-sky-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold">
                  {editingStrokeCode ? 'Edit Gaya Renang' : 'Tambah Gaya Renang Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStrokeModal(false)}
                className="text-slate-300 hover:text-white p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStroke} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Gaya Renang <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={strokeNameInput}
                  onChange={e => {
                    setStrokeNameInput(e.target.value);
                    if (!editingStrokeCode && !strokeCodeInput) {
                      setStrokeCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '_'));
                    }
                  }}
                  placeholder="Contoh: Gaya Bebas, Papan Seluncur (Kaki)"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kode Sistem <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingStrokeCode}
                    value={strokeCodeInput}
                    onChange={e => setStrokeCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                    placeholder="Contoh: FREESTYLE"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Singkatan / Kode Cetak
                  </label>
                  <input
                    type="text"
                    value={strokeShortInput}
                    onChange={e => setStrokeShortInput(e.target.value)}
                    placeholder="Contoh: Bebas, FR"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  value={strokeDescInput}
                  onChange={e => setStrokeDescInput(e.target.value)}
                  placeholder="Contoh: Gaya Bebas resmi standar World Aquatics"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={strokeIsRelayInput}
                    onChange={e => setStrokeIsRelayInput(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 font-semibold">
                    Ini adalah nomor Estafet (Relay)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStrokeModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs cursor-pointer"
                >
                  Simpan Gaya
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Kelompok Usia */}
      {showAgeGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-amber-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold">
                  {editingAgeGroupCode ? 'Edit Kelompok Usia' : 'Tambah Kelompok Usia Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAgeGroupModal(false)}
                className="text-slate-300 hover:text-white p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAgeGroup} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Label Kategori <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={agNameInput}
                    onChange={e => {
                      setAgNameInput(e.target.value);
                      if (!editingAgeGroupCode && !agCodeInput) {
                        setAgCodeInput(`AGE_${e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`);
                      }
                    }}
                    placeholder="Contoh: A, B, I, KU I"
                    className="w-full px-3 py-2 text-xs font-extrabold border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Ditampilkan di dropdown</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kode Sistem <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingAgeGroupCode}
                    value={agCodeInput}
                    onChange={e => setAgCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                    placeholder="Contoh: AGE_6_UNDER"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Usia Minimum (Tahun) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    required
                    value={agMinAgeInput}
                    onChange={e => setAgMinAgeInput(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Usia Maksimum (Tahun) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    required
                    value={agMaxAgeInput}
                    onChange={e => setAgMaxAgeInput(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan / Deskripsi
                </label>
                <input
                  type="text"
                  value={agDescInput}
                  onChange={e => setAgDescInput(e.target.value)}
                  placeholder="Contoh: Usia 6 Tahun dan di bawahnya"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAgeGroupModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs cursor-pointer"
                >
                  Simpan Kelompok Usia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
