/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSwimData, ActiveTab } from '../context/SwimDataContext';
import { 
  Printer, 
  RotateCcw, 
  Download, 
  Upload, 
  ChevronDown, 
  Settings 
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    openPrintModal,
    championship,
    resetToDefaultData,
    exportDatabaseJSON,
    importDatabaseJSON
  } = useSwimData();

  const [showToolsMenu, setShowToolsMenu] = useState(false);

  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'dashboard', label: 'Ringkasan' },
    { id: 'athletes', label: 'Pendaftar' },
    { id: 'events', label: 'Nomor Lomba' },
    { id: 'entry_list', label: 'Entry List' },
    { id: 'nomor_list', label: 'Nomor List' },
    { id: 'seeding', label: 'Starting List' },
    { id: 'timekeeper', label: 'Input Waktu' },
    { id: 'results', label: 'Hasil dan Medali' },
    { id: 'buku_acara', label: 'Buku Acara' },
    { id: 'scoreboard', label: 'Live Skor' },
    { id: 'settings', label: 'Pengaturan' },
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
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          
          {/* Zone 1: Wordmark */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 text-left focus:outline-hidden group shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold tracking-wider text-base shadow-xs group-hover:bg-sky-700 transition-colors">
              SR
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap block">
                SwimRace Manager
              </span>
              <span className="text-[10px] text-slate-500 hidden sm:block truncate max-w-[160px]">
                {championship.poolLength} · {championship.poolLanes} Lintasan
              </span>
            </div>
          </button>

          {/* Zone 2: Primary navigation links (scrollable if needed) */}
          <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto py-1 scrollbar-none">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors ${
                    isActive
                      ? 'text-sky-700 bg-sky-50 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Tools Dropdown (Backup, Restore, Reset) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowToolsMenu(!showToolsMenu)}
                className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                title="Alat & Cadangan Data"
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              {showToolsMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50 text-xs">
                  <div className="px-3 py-1 font-semibold text-slate-400 border-b border-slate-100 text-[10px] uppercase">
                    Cadangan & Pengaturan
                  </div>
                  <button
                    onClick={() => {
                      exportDatabaseJSON();
                      setShowToolsMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
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

                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={() => {
                      if (confirm('Kembalikan seluruh data ke sampel resmi KRAPSI 2026?')) {
                        resetToDefaultData();
                        setShowToolsMenu(false);
                      }
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                    <span>Reset Data Sampel</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Settings Shortcut */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`p-1.5 rounded-md transition-colors ${
                activeTab === 'settings'
                  ? 'bg-sky-100 text-sky-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
              title="Pengaturan Perlombaan & Perangkat Pertandingan"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Zone 3 Primary Action: Cetak Dokumen Resmi */}
            <button
              onClick={() => openPrintModal('official_minutes')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Berkas Lomba</span>
            </button>
          </div>

        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'text-sky-700 bg-sky-50 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
