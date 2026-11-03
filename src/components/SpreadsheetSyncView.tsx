/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useSwimData } from '../context/SwimDataContext';
import { 
  buildChampionshipSpreadsheetData, 
  downloadChampionshipExcel, 
  getGoogleAppsScriptCode 
} from '../utils/spreadsheetExport';
import { 
  FileSpreadsheet, 
  CloudUpload, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Code2, 
  Table, 
  Info, 
  HelpCircle,
  FileCode,
  Layers,
  Users,
  Trophy,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export const SpreadsheetSyncView: React.FC = () => {
  const { 
    championship, 
    clubs, 
    athletes, 
    events, 
    incidents, 
    clubMedalTally, 
    getStrokeLabel, 
    getEventAgeGroupsLabel,
    googleAppsScriptUrl,
    setGoogleAppsScriptUrl,
    lastSpreadsheetSync,
    setLastSpreadsheetSync
  } = useSwimData();

  const [inputUrl, setInputUrl] = useState<string>(googleAppsScriptUrl || '');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedTable, setCopiedTable] = useState<string | null>(null);
  const [activePreviewSheet, setActivePreviewSheet] = useState<
    'infoKejuaraan' | 'dataKlub' | 'dataAtlet' | 'nomorLomba' | 'startingListSeri' | 'hasilLomba' | 'klasemenMedali' | 'catatanKasusDQ'
  >('dataAtlet');

  // Build the complete dataset
  const spreadsheetData = useMemo(() => {
    return buildChampionshipSpreadsheetData(
      championship,
      clubs,
      athletes,
      events,
      incidents,
      clubMedalTally,
      getStrokeLabel,
      getEventAgeGroupsLabel
    );
  }, [championship, clubs, athletes, events, incidents, clubMedalTally, getStrokeLabel, getEventAgeGroupsLabel]);

  const gasCode = useMemo(() => getGoogleAppsScriptCode(), []);

  // Save URL
  const handleSaveUrl = () => {
    const trimmed = inputUrl.trim();
    setGoogleAppsScriptUrl(trimmed);
    setSyncStatus('IDLE');
    setStatusMessage('URL Google Apps Script berhasil disimpan.');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  // Copy Google Apps Script code to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(gasCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Download Code.gs file
  const handleDownloadCodeFile = () => {
    const element = document.createElement('a');
    const file = new Blob([gasCode], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = 'Code.gs';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Download complete Excel (.xlsx) file
  const handleDownloadExcel = () => {
    downloadChampionshipExcel(spreadsheetData);
  };

  // Sync directly to Google Spreadsheet via Apps Script Web App
  const handleSyncToSpreadsheet = async () => {
    const url = inputUrl.trim() || googleAppsScriptUrl.trim();
    if (!url) {
      setSyncStatus('ERROR');
      setStatusMessage('Silakan masukkan URL Aplikasi Web Google Apps Script terlebih dahulu.');
      return;
    }

    if (!url.startsWith('https://script.google.com/macros/s/') || !url.includes('/exec')) {
      setSyncStatus('ERROR');
      setStatusMessage('Format URL tidak valid. Pastikan URL berasal dari deployment Google Apps Script yang berakhiran /exec.');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('IDLE');
    setStatusMessage('Sedang mengirim seluruh data kejuaraan ke Google Spreadsheet...');

    try {
      // Send payload
      // Using mode: 'no-cors' allows sending cross-origin data to Google Apps Script Web App without CORS preflight blocks
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(spreadsheetData),
      });

      const now = new Date().toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      setGoogleAppsScriptUrl(url);
      setLastSpreadsheetSync(now);
      setSyncStatus('SUCCESS');
      setStatusMessage(`Data kejuaraan berhasil dikirim dan disimpan ke seluruh lembar kerja Google Spreadsheet pada ${now}.`);
    } catch (err: any) {
      console.error('Spreadsheet sync error:', err);
      setSyncStatus('ERROR');
      setStatusMessage(`Gagal menyinkronkan data: ${err.message || 'Terjadi kesalahan jaringan'}. Periksa izin deployment Web App (Pastikan: Siapa saja / Anyone).`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Copy current active preview table as TSV (can be pasted directly into Excel / Google Sheets)
  const handleCopyActiveTable = async (sheetKey: typeof activePreviewSheet) => {
    const rows = spreadsheetData.sheets[sheetKey];
    if (!rows || rows.length === 0) return;
    const tsv = rows.map(r => r.join('\t')).join('\n');
    try {
      await navigator.clipboard.writeText(tsv);
      setCopiedTable(sheetKey);
      setTimeout(() => setCopiedTable(null), 2000);
    } catch (err) {
      console.error('Failed to copy table:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-md inline-flex items-center gap-1">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Integrasi Google Spreadsheet
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Multi-Sheet Sync · 8 Lembar Kerja
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Simpan Seluruh Data Kejuaraan ke Spreadsheet
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
            Fitur khusus untuk mengekspor dan menyinkronkan seluruh database kejuaraan renang (Info Kejuaraan, Klub, Atlet, Nomor Lomba, Starting List, Hasil, Medali, &amp; Catatan Kasus) langsung ke Google Spreadsheet via Google Apps Script Web App atau unduh berkas Excel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors cursor-pointer"
            title="Unduh seluruh database kejuaraan ke file Excel (.xlsx) dengan 8 lembar kerja terformat"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Unduh File Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={handleSyncToSpreadsheet}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white shadow-xs transition-colors cursor-pointer"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Menyimpan ke Spreadsheet...</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-4 h-4" />
                <span>Simpan ke Google Spreadsheet</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Alert if available */}
      {statusMessage && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
          syncStatus === 'SUCCESS' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : syncStatus === 'ERROR'
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-sky-50 border-sky-200 text-sky-900'
        }`}>
          {syncStatus === 'SUCCESS' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : syncStatus === 'ERROR' ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs">
            <p className="font-semibold">{statusMessage}</p>
            {lastSpreadsheetSync && syncStatus === 'SUCCESS' && (
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Waktu Sinkronisasi Terakhir: <strong>{lastSpreadsheetSync}</strong>
              </p>
            )}
          </div>
        </div>
      )}

      {/* 8 Sheets Summary Cards */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Daftar 8 Lembar Kerja (Sheets) yang Dibuat Otomatis
          </h2>
          <span className="text-xs text-slate-400">
            Terstruktur &amp; Otomatis Diformat Rapi
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-sky-300 transition-colors">
            <div className="text-[11px] font-mono font-bold text-sky-600">1_INFO_KEJUARAAN</div>
            <div className="text-base font-bold text-slate-900 mt-1">Detail Kejuaraan</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Venue, Kolam &amp; Ringkasan</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-colors">
            <div className="text-[11px] font-mono font-bold text-emerald-600">2_DATA_KLUB</div>
            <div className="text-base font-bold text-slate-900 mt-1">{clubs.length} Klub Renang</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Kode, Pelatih &amp; Kontak</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors">
            <div className="text-[11px] font-mono font-bold text-blue-600">3_DATA_ATLET</div>
            <div className="text-base font-bold text-slate-900 mt-1">{athletes.length} Atlet</div>
            <div className="text-[11px] text-slate-500 mt-0.5">KU A-I, No. Reg &amp; Tgl Lahir</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-red-300 transition-colors">
            <div className="text-[11px] font-mono font-bold text-red-600">4_NOMOR_LOMBA</div>
            <div className="text-base font-bold text-slate-900 mt-1">{events.length} Nomor Lomba</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Sesi, Jarak, Gaya &amp; Kategori</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-300 transition-colors">
            <div className="text-[11px] font-mono font-bold text-indigo-600">5_STARTING_LIST_SERI</div>
            <div className="text-base font-bold text-slate-900 mt-1">Susunan Lintasan</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Seri, Lintasan &amp; Seed Time</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-colors">
            <div className="text-[11px] font-mono font-bold text-emerald-600">6_HASIL_LOMBA</div>
            <div className="text-base font-bold text-slate-900 mt-1">Hasil &amp; Peringkat</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Waktu Akhir, Selisih &amp; Poin</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-amber-300 transition-colors">
            <div className="text-[11px] font-mono font-bold text-amber-600">7_KLASEMEN_MEDALI</div>
            <div className="text-base font-bold text-slate-900 mt-1">Klasemen Medali</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Emas, Perak, Perunggu &amp; Poin</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-rose-300 transition-colors">
            <div className="text-[11px] font-mono font-bold text-rose-600">8_CATATAN_KASUS_DQ</div>
            <div className="text-base font-bold text-slate-900 mt-1">{incidents.length} Laporan Kasus</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Insiden, Pelanggaran &amp; Wasit</div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Web App Configuration & Code.gs Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Configuration & Step-by-Step Guide */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Card: URL Connection Form */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                <CloudUpload className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  URL Web App Google Apps Script
                </h3>
                <p className="text-[11px] text-slate-500">
                  Masukkan URL deployment Aplikasi Web dari skrip Google Spreadsheet Anda
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Web App URL (berakhiran <code>/exec</code>):
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleSaveUrl}
                  className="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Simpan URL
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                URL akan disimpan otomatis di browser agar Anda tidak perlu mengetiknya ulang.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs">
                <span className="text-slate-500">Status Endpoint: </span>
                {googleAppsScriptUrl ? (
                  <span className="font-semibold text-emerald-600 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    URL Terpasang
                  </span>
                ) : (
                  <span className="font-semibold text-amber-600">
                    Belum Dikonfigurasi
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {googleAppsScriptUrl && (
                  <a
                    href={googleAppsScriptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-sky-600 hover:text-sky-800 underline inline-flex items-center gap-1"
                  >
                    <span>Uji Buka di Tab Baru</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleSyncToSpreadsheet}
                  disabled={isSyncing}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sedang Sinkron...</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-3.5 h-3.5" />
                      <span>Sinkronkan Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Card: Step-by-Step Instructions */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Panduan Menghubungkan ke Google Spreadsheet (Hanya 3 Menit)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Ikuti langkah mudah di bawah ini untuk mengaktifkan koneksi otomatis
                </p>
              </div>
            </div>

            <ol className="space-y-3 text-xs text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-slate-900 font-semibold">Buat Spreadsheet Baru di Google:</strong>
                  <p className="text-slate-500 mt-0.5">
                    Buka <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="text-sky-600 underline font-medium inline-flex items-center gap-0.5">sheets.new <ExternalLink className="w-2.5 h-2.5" /></a> di browser Anda dan beri nama dokumen (misal: <em>Kejuaraan Renang 2026</em>).
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-slate-900 font-semibold">Buka Apps Script:</strong>
                  <p className="text-slate-500 mt-0.5">
                    Di Google Spreadsheet, klik menu <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>. Jendela editor kode akan terbuka.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-slate-900 font-semibold">Salin &amp; Tempel Kode <code>Code.gs</code>:</strong>
                  <p className="text-slate-500 mt-0.5">
                    Hapus kode bawaan di editor Apps Script, lalu klik tombol <strong>"Salin Seluruh Kode .gs"</strong> di panel kanan, dan tempelkan (paste) ke editor. Tekan <strong>Ctrl+S / Cmd+S</strong> untuk menyimpan.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <strong className="text-slate-900 font-semibold">Terapkan sebagai Aplikasi Web (Web App):</strong>
                  <div className="text-slate-600 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1 text-[11.5px]">
                    <p>• Klik tombol biru <strong>Terapkan (Deploy)</strong> &gt; <strong>Deployment baru (New deployment)</strong>.</p>
                    <p>• Klik ikon gerigi (Pilih jenis) &gt; pilih <strong>Aplikasi Web (Web app)</strong>.</p>
                    <p>• <em>Jalankan sebagai (Execute as)</em>: <strong>Saya (Me)</strong>.</p>
                    <p>• <em>Akses (Who has access)</em>: <strong className="text-emerald-700">Siapa saja (Anyone)</strong> <span className="text-red-600 font-bold">*Wajib agar bisa menerima data</span>.</p>
                    <p>• Klik <strong>Terapkan (Deploy)</strong>, izinkan akses akun Google Anda jika diminta.</p>
                  </div>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  5
                </span>
                <div>
                  <strong className="text-slate-900 font-semibold">Tempel URL Web App ke Aplikasi:</strong>
                  <p className="text-slate-500 mt-0.5">
                    Salin URL Web App yang berakhiran <code>/exec</code>, tempelkan ke kolom URL di atas, lalu klik <strong>Simpan &amp; Sinkronkan Sekarang</strong>! Seluruh 8 lembar kerja akan langsung terisi secara otomatis.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>

        {/* Right Column: Interactive Code.gs Viewer & One-Click Copy */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 shadow-md overflow-hidden flex flex-col h-full max-h-[700px]">
            
            {/* Code Box Header */}
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span className="font-mono font-bold text-xs text-slate-200">
                  Code.gs (Google Apps Script)
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                  doPost &amp; doGet
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCodeFile}
                  className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
                  title="Unduh berkas Code.gs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Unduh .gs</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    copiedCode
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 hover:text-white'
                  }`}
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Kode Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Seluruh Kode .gs</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Code Editor Body */}
            <div className="p-4 overflow-y-auto flex-1 font-mono text-[11px] leading-relaxed text-slate-300 select-all bg-slate-900/90 scrollbar-thin">
              <pre className="whitespace-pre">
                <code>{gasCode}</code>
              </pre>
            </div>

            {/* Code Footer Notice */}
            <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
              <span>Siap pakai · Format otomatis &amp; Anti Overlap</span>
              <span className="text-emerald-400 font-semibold font-mono">Standar Google Sheets v4 API</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Section: Tabular Sheet Preview & Quick Copy */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Table className="w-4 h-4 text-emerald-600" />
              Pratinjau Struktur Data Setiap Lembar Kerja
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Lihat susunan kolom dan baris yang akan tersimpan ke dalam spreadsheet Anda
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopyActiveTable(activePreviewSheet)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              title="Salin isi tabel ini dalam format Tab-Separated (bisa langsung di-paste ke Excel / Google Sheets)"
            >
              {copiedTable === activePreviewSheet ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Tabel Berhasil Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Salin Tabel Ini (Copy-Paste)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Buttons to Switch Preview Sheet */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'dataAtlet', label: '3_DATA_ATLET' },
            { id: 'dataKlub', label: '2_DATA_KLUB' },
            { id: 'nomorLomba', label: '4_NOMOR_LOMBA' },
            { id: 'startingListSeri', label: '5_STARTING_LIST_SERI' },
            { id: 'hasilLomba', label: '6_HASIL_LOMBA' },
            { id: 'klasemenMedali', label: '7_KLASEMEN_MEDALI' },
            { id: 'catatanKasusDQ', label: '8_CATATAN_KASUS_DQ' },
            { id: 'infoKejuaraan', label: '1_INFO_KEJUARAAN' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActivePreviewSheet(tab.id as typeof activePreviewSheet)}
              className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                activePreviewSheet === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table Viewer */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-80">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px] sticky top-0 z-10">
                {spreadsheetData.sheets[activePreviewSheet][0]?.map((colName, cIdx) => (
                  <th key={cIdx} className="py-2.5 px-3 whitespace-nowrap border-r border-slate-200 last:border-r-0">
                    {colName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11.5px]">
              {spreadsheetData.sheets[activePreviewSheet].slice(1, 15).map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-2 px-3 border-r border-slate-100 last:border-r-0 text-slate-800 whitespace-nowrap">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center justify-between">
          <span>Menampilkan hingga 15 baris pertama pratinjau dari total {spreadsheetData.sheets[activePreviewSheet].length} baris.</span>
          <span>Seluruh baris lengkap akan otomatis terisi saat disinkronkan ke Spreadsheet.</span>
        </div>
      </div>
    </div>
  );
};
