/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useSwimData, ActiveTab } from '../context/SwimDataContext';
import { 
  Printer, 
  RotateCcw, 
  Download, 
  Upload, 
  ChevronDown, 
  Settings,
  RefreshCw,
  BookOpen,
  FileText,
  Layers,
  FileSpreadsheet,
  Award
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    openPrintModal,
    championship,
    resetToDefaultData,
    exportDatabaseJSON,
    importDatabaseJSON,
    currentUser,
    isCloudConnected,
    isSyncing,
    syncAllToCloud,
  } = useSwimData();

  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showPrintMenu, setShowPrintMenu] = useState(false);

  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const printMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setShowToolsMenu(false);
      }
      if (printMenuRef.current && !printMenuRef.current.contains(event.target as Node)) {
        setShowPrintMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Primary 1-line navigation items
  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'dashboard', label: 'Ringkasan' },
    { id: 'athletes', label: 'Pendaftar' },
    { id: 'events', label: 'Nomor Lomba' },
    { id: 'entry_list', label: 'Entry List' },
    { id: 'nomor_list', label: 'Nomor List' },
    { id: 'seeding', label: 'Starting List' },
    { id: 'timekeeper', label: 'Input Waktu' },
    { id: 'results', label: 'Hasil' },
    { id: 'buku_acara', label: 'Buku Acara' },
    { id: 'scoreboard', label: 'Live Skor' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDatabaseJSON(content);
        if (success) {
          alert('Data kejuaraan berhasil dimuat dari berkas JSON.');
        } else {
          alert('Format berkas tidak valid untuk data kejuaraan renang.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setShowToolsMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between gap-2 h-14">
          
          {/* Zone 1: Wordmark Logo */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 text-left focus:outline-hidden group shrink-0 cursor-pointer"
            title="Kembali ke Dashboard Utama"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-extrabold tracking-wider text-sm shadow-xs group-hover:bg-sky-700 transition-colors">
              SR
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-bold tracking-tight text-slate-900 whitespace-nowrap block leading-tight">
                SwimRace
              </span>
              <span className="text-[10px] text-slate-500 block truncate max-w-[130px] font-mono leading-tight">
                {championship.poolLength} · {championship.poolLanes}L
              </span>
            </div>
          </button>

          {/* Zone 2: Navigation (Single 1-Row Responsive Bar) */}
          <nav className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none min-w-0 flex-1 justify-start sm:justify-center mx-1 sm:mx-2">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              const isBuku = item.id === 'buku_acara';

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive
                      ? (isBuku 
                          ? 'text-slate-950 bg-amber-400 font-extrabold shadow-2xs' 
                          : 'text-sky-700 bg-sky-100/80 font-bold')
                      : (isBuku 
                          ? 'text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 font-bold' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
                  }`}
                >
                  {isBuku ? '📖 Buku Acara' : item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions (Compact, 1-Row) */}
          <div className="flex items-center gap-1.5 shrink-0">
            
            {/* Realtime Cloud Sync Indicator Pill */}
            <button
              type="button"
              onClick={async () => {
                const ok = await syncAllToCloud();
                if (ok) alert('Seluruh data berhasil disinkronkan ke Cloud Firebase!');
              }}
              disabled={isSyncing}
              className="flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-lg text-[11px] font-medium shadow-2xs hover:bg-emerald-100 transition-colors cursor-pointer shrink-0"
              title="Koneksi Cloud Realtime Aktif - Klik untuk sinkronkan seluruh data ke Cloud sekarang"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden md:inline font-semibold">Realtime</span>
              <RefreshCw className={`w-3 h-3 text-emerald-700 ${isSyncing ? 'animate-spin text-sky-600' : ''}`} />
            </button>

            {/* Print Menu Dropdown (Buku Acara, Nomor List, Entry List, Berita Acara) */}
            <div className="relative shrink-0" ref={printMenuRef}>
              <button
                type="button"
                onClick={() => setShowPrintMenu(!showPrintMenu)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors whitespace-nowrap cursor-pointer"
                title="Cetak Buku Acara & Berkas Perlombaan"
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Cetak</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showPrintMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-1">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Pilih Dokumen Cetak (A4)
                  </div>
                  <button
                    onClick={() => {
                      openPrintModal('buku_acara');
                      setShowPrintMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-amber-50 text-slate-900 font-bold flex items-center gap-2 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>📖 Buku Acara (Meet Program)</span>
                  </button>
                  <button
                    onClick={() => {
                      openPrintModal('nomor_list');
                      setShowPrintMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-red-50 text-slate-800 font-medium flex items-center gap-2 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>📋 Nomor List (Peserta per Nomor)</span>
                  </button>
                  <button
                    onClick={() => {
                      openPrintModal('entry_list');
                      setShowPrintMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-800 font-medium flex items-center gap-2 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>📝 Entry List (Format PB Akuatik)</span>
                  </button>
                  <button
                    onClick={() => {
                      openPrintModal('start_list');
                      setShowPrintMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-800 font-medium flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>⏱️ Starting List (Per Nomor)</span>
                  </button>
                  <button
                    onClick={() => {
                      openPrintModal('result_sheet');
                      setShowPrintMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-800 font-medium flex items-center gap-2 cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>🏁 Lembar Hasil & Medali</span>
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={() => {
                      openPrintModal('official_minutes');
                      setShowPrintMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>📜 Berita Acara Resmi (Official Minutes)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Settings & Tools Dropdown Button */}
            <div className="relative shrink-0" ref={toolsMenuRef}>
              <button
                type="button"
                onClick={() => setShowToolsMenu(!showToolsMenu)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  activeTab === 'settings' || showToolsMenu
                    ? 'bg-sky-50 text-sky-700 border-sky-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                title="Pengaturan, Ekspor/Impor, dan Alat"
              >
                <Settings className="w-4 h-4" />
              </button>

              {showToolsMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-1">
                  <div className="px-3 py-1 font-semibold text-slate-400 border-b border-slate-100 text-[10px] uppercase tracking-wider">
                    Pengaturan & Cadangan
                  </div>
                  
                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setShowToolsMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-800 font-medium cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-sky-600" />
                    <span>Buka Pengaturan Kejuaraan</span>
                  </button>

                  <button
                    onClick={() => {
                      exportDatabaseJSON();
                      setShowToolsMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>Ekspor Data (JSON)</span>
                  </button>

                  <label className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span>Impor Data (JSON)</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {currentUser && (
                    <button
                      onClick={async () => {
                        setShowToolsMenu(false);
                        const ok = await syncAllToCloud();
                        if (ok) alert('Seluruh data berhasil disinkronkan ke Cloud Firebase!');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-sky-700 font-medium cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                      <span>Upload Semua Data ke Cloud</span>
                    </button>
                  )}

                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={() => {
                      if (confirm('Kembalikan seluruh data ke sampel resmi KRAPSI 2026?')) {
                        resetToDefaultData();
                        setShowToolsMenu(false);
                      }
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                    <span>Reset Data Sampel</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
