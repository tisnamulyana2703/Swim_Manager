/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useSwimData } from '../context/SwimDataContext';
import { calculateAge, determineAgeGroup } from '../utils/timeUtils';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Check, 
  AlertCircle, 
  X, 
  FileText, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface ParsedAthleteRow {
  nik: string;
  regNumber: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  customKU?: string;
  clubCode: string;
  clubName: string;
  eventNumbers: number[];
  seedTimes: Record<number, string>;
  calculatedAge: number;
  calculatedKU: string;
  isValid: boolean;
  validationError?: string;
  isExistingClub: boolean;
}

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose }) => {
  const { 
    championship, 
    clubs, 
    events, 
    customAgeGroups, 
    getAgeGroupLabel, 
    getStrokeLabel, 
    importBulkAthletes 
  } = useSwimData();

  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pasteText, setPasteText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedAthleteRow[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const existingClubCodes = new Set(clubs.map(c => c.code.toUpperCase()));
  const existingClubNames = new Set(clubs.map(c => c.name.toLowerCase()));

  // Normalize column names
  const findColumnKey = (row: Record<string, unknown>, possibleNames: string[]): string | undefined => {
    const keys = Object.keys(row);
    for (const name of possibleNames) {
      const found = keys.find(k => k.trim().toLowerCase() === name.toLowerCase());
      if (found) return found;
    }
    return undefined;
  };

  // Helper to parse raw object records
  const processRawRecords = (records: Record<string, unknown>[]) => {
    const processed: ParsedAthleteRow[] = [];

    records.forEach((r, idx) => {
      // Find Name
      const nameKey = findColumnKey(r, [
        'nama', 'nama lengkap', 'nama perenang', 'name', 'atlet', 'nama atlet', 'swimmer', 'athlete name'
      ]);
      const nameVal = nameKey ? String(r[nameKey] || '').trim() : '';
      if (!nameVal) return; // skip empty rows

      // Find Register Number (optional / auto-generated)
      const regKey = findColumnKey(r, [
        'no. register', 'no register', 'nomor register', 'register', 'reg number', 'reg no', 'no reg', 'kode register', 'id register', 'no_register'
      ]);
      const regVal = regKey && r[regKey] ? String(r[regKey]).trim() : '';

      // Find NIK
      const nikKey = findColumnKey(r, [
        'nik', 'id', 'no identitas', 'nomor identitas', 'nik/id', 'ktp', 'nisn', 'no ktp', 'nik atlet'
      ]);
      const nikVal = nikKey && r[nikKey] ? String(r[nikKey]).trim() : '';

      // Find Gender
      const genderKey = findColumnKey(r, [
        'gender', 'jenis kelamin', 'jk', 'sex', 'l/p', 'kategori', 'kategori gender'
      ]);
      const genderRaw = genderKey ? String(r[genderKey] || '').trim().toLowerCase() : '';
      const gender: 'MALE' | 'FEMALE' = 
        genderRaw.startsWith('p') && !genderRaw.startsWith('pu') && genderRaw.length <= 2 
          ? 'FEMALE'
          : genderRaw.includes('putri') || genderRaw.includes('female') || genderRaw.includes('wanita') || genderRaw === 'f'
          ? 'FEMALE'
          : 'MALE';

      // Find Birth Date
      const birthKey = findColumnKey(r, [
        'tanggal lahir', 'tgl lahir', 'birthdate', 'birth date', 'dob', 'lahir', 'tgl_lahir'
      ]);
      let birthDateVal = '2016-01-01';
      if (birthKey && r[birthKey]) {
        const rawDate = r[birthKey];
        if (typeof rawDate === 'number') {
          // Excel serial date number
          const jsDate = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
          birthDateVal = jsDate.toISOString().slice(0, 10);
        } else {
          const strDate = String(rawDate).trim();
          // Check DD/MM/YYYY or DD-MM-YYYY
          if (strDate.includes('/') || strDate.includes('-')) {
            const separator = strDate.includes('/') ? '/' : '-';
            const parts = strDate.split(separator);
            if (parts.length === 3) {
              if (parts[2].length === 4) {
                // DD/MM/YYYY
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2];
                birthDateVal = `${year}-${month}-${day}`;
              } else if (parts[0].length === 4) {
                // YYYY/MM/DD
                birthDateVal = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
              }
            }
          }
        }
      }

      // Calculate Age & KU
      const age = calculateAge(birthDateVal, championship.cutoffDate);
      const ageGroup = determineAgeGroup(age);

      // Custom KU column if present
      const customKUKey = findColumnKey(r, [
        'kelompok usia', 'kelompok umur', 'ku', 'age group', 'kategori usia', 'kelompok_usia'
      ]);
      const customKUVal = customKUKey && r[customKUKey] ? String(r[customKUKey]).trim() : undefined;

      // Club
      const clubCodeKey = findColumnKey(r, [
        'kode klub', 'kode perkumpulan', 'kode', 'club code', 'id klub', 'kode_klub'
      ]);
      const clubNameKey = findColumnKey(r, [
        'nama klub', 'klub', 'club', 'perkumpulan', 'asal klub', 'kontingen', 'nama perkumpulan'
      ]);
      const clubCode = clubCodeKey ? String(r[clubCodeKey] || '').toUpperCase().trim() : (clubNameKey ? String(r[clubNameKey] || '').slice(0, 8).toUpperCase().trim() : 'IND');
      const clubName = clubNameKey ? String(r[clubNameKey] || '').trim() : clubCode;

      const isExisting = existingClubCodes.has(clubCode) || existingClubNames.has(clubName.toLowerCase());

      // Events & Seed Time
      const eventKey = findColumnKey(r, [
        'nomor lomba', 'nomor acara', 'event', 'events', 'no lomba', 'lomba', 'no acara', 'nomor_lomba'
      ]);
      const seedKey = findColumnKey(r, [
        'seed time', 'seed', 'entry time', 'waktu terbaik', 'best time', 'waktu', 'seed times', 'catatan waktu', 'seed_time'
      ]);
      
      const eventNumbers: number[] = [];
      const seedTimes: Record<number, string> = {};

      if (eventKey && r[eventKey]) {
        const rawEvent = String(r[eventKey]);
        const matches = rawEvent.match(/\d+/g);
        if (matches) {
          matches.forEach(m => {
            const num = parseInt(m, 10);
            if (!isNaN(num) && !eventNumbers.includes(num)) {
              eventNumbers.push(num);
            }
          });
        }
      }

      // Split multiple seed times if multiple events were entered
      const rawSeed = seedKey && r[seedKey] ? String(r[seedKey]).trim() : '';
      const parsedSeedList = rawSeed
        ? rawSeed.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean)
        : [];

      if (eventNumbers.length > 0) {
        eventNumbers.forEach((evNum, evIdx) => {
          let sTime = parsedSeedList[evIdx] || parsedSeedList[0] || '00:00.00';
          if (/^\d{1,2}\.\d{2}$/.test(sTime)) {
            sTime = `00:${sTime.padStart(5, '0')}`;
          }
          seedTimes[evNum] = sTime;
        });
      }

      const finalReg = regVal || `REG-${nameVal.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 899)}`;
      const finalNik = nikVal || finalReg;

      processed.push({
        nik: finalNik,
        regNumber: finalReg,
        name: nameVal,
        gender,
        birthDate: birthDateVal,
        customKU: customKUVal,
        clubCode: clubCode || 'IND',
        clubName: clubName || 'Independen',
        eventNumbers,
        seedTimes,
        calculatedAge: age,
        calculatedKU: ageGroup,
        isValid: Boolean(nameVal),
        isExistingClub: isExisting,
      });
    });

    setParsedRows(processed);
    setSelectedIndices(new Set(processed.map((_, i) => i)));
    setImportStatusMessage(null);
  };

  // Handle Excel/CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const targetSheetName = workbook.SheetNames.find(n => 
          n.toLowerCase().includes('formulir') || n.toLowerCase().includes('pendaftar') || n.toLowerCase().includes('atlet')
        ) || workbook.SheetNames[0];

        const worksheet = workbook.Sheets[targetSheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        if (json.length === 0) {
          alert('Berkas Excel kosong atau tidak memiliki baris data pada lembar formulir.');
          return;
        }

        processRawRecords(json);
      } catch {
        alert('Gagal membaca berkas Excel. Pastikan format berkas valid (.xlsx, .xls, .csv).');
      }
    };

    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // Handle direct paste from Excel / Google Sheets
  const handleProcessPaste = () => {
    if (!pasteText.trim()) return;

    try {
      const lines = pasteText.trim().split('\n');
      if (lines.length < 2) {
        alert('Data yang ditempelkan minimal harus memiliki 1 baris header dan 1 baris atlet.');
        return;
      }

      // Detect separator (tab for Excel copy, or comma/semicolon for CSV)
      const firstLine = lines[0];
      const separator = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';

      const headers = firstLine.split(separator).map(h => h.trim().replace(/^["']|["']$/g, ''));
      const records: Record<string, unknown>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = line.split(separator).map(v => v.trim().replace(/^["']|["']$/g, ''));
        const row: Record<string, unknown> = {};
        headers.forEach((header, colIdx) => {
          row[header] = values[colIdx] || '';
        });
        records.push(row);
      }

      setFileName('Salinan Spreadsheet');
      processRawRecords(records);
    } catch {
      alert('Gagal mengurai teks yang disalin. Pastikan format kolom sesuai.');
    }
  };

  // Download Sample Template with multiple sheets matching the latest registration form
  const handleDownloadTemplate = () => {
    const workbook = XLSX.utils.book_new();

    // 1. Sheet: Formulir_Pendaftar (Main Form matching latest registration fields)
    const sampleRegistrationData = [
      {
        'No. Register': 'REG-ALV-128',
        'Nama Lengkap': 'Dimas Alvaro Pratama',
        'Jenis Kelamin': 'Putra',
        'Tanggal Lahir': '2018-05-12',
        'Kelompok Usia': 'C',
        'Kode Klub': 'MILL-JKT',
        'Nama Klub': 'Millennium Aquatic Jakarta',
        'NIK': '3171011205180001',
        'Nomor Lomba': '100',
        'Seed Time': '00:18.50'
      },
      {
        'No. Register': 'REG-ARK-129',
        'Nama Lengkap': 'Arkan Naufal Rasyid',
        'Jenis Kelamin': 'Putra',
        'Tanggal Lahir': '2018-08-20',
        'Kelompok Usia': 'C',
        'Kode Klub': 'PARI',
        'Nama Klub': 'Pari Sakti Swimming Club',
        'NIK': '3172021508180002',
        'Nomor Lomba': '100',
        'Seed Time': '00:19.20'
      },
      {
        'No. Register': 'REG-NAY-102',
        'Nama Lengkap': 'Nayla Putri Azzahra',
        'Jenis Kelamin': 'Putri',
        'Tanggal Lahir': '2017-02-14',
        'Kelompok Usia': 'D',
        'Kode Klub': 'JAQ',
        'Nama Klub': 'Jakarta Aquatic Club',
        'NIK': '3172021508170003',
        'Nomor Lomba': '101',
        'Seed Time': '00:26.50'
      },
      {
        'No. Register': '',
        'Nama Lengkap': 'Kenzo Alfarizi Pratama',
        'Jenis Kelamin': 'Putra',
        'Tanggal Lahir': '2016-07-22',
        'Kelompok Usia': 'E',
        'Kode Klub': 'PETRO',
        'Nama Klub': 'Petrokimia Gresik Aquatic Club',
        'NIK': '3525181102160018',
        'Nomor Lomba': '102, 104',
        'Seed Time': '00:31.40, 01:10.20'
      },
      {
        'No. Register': '',
        'Nama Lengkap': 'Siti Rahmawati',
        'Jenis Kelamin': 'Putri',
        'Tanggal Lahir': '2014-11-03',
        'Kelompok Usia': 'G',
        'Kode Klub': 'BEAST',
        'Nama Klub': 'Beast Aquatic Club Bandung',
        'NIK': '',
        'Nomor Lomba': '103',
        'Seed Time': '00:29.80'
      }
    ];

    const wsForm = XLSX.utils.json_to_sheet(sampleRegistrationData);
    wsForm['!cols'] = [
      { wch: 16 }, // No. Register
      { wch: 28 }, // Nama Lengkap
      { wch: 14 }, // Jenis Kelamin
      { wch: 15 }, // Tanggal Lahir
      { wch: 16 }, // Kelompok Usia
      { wch: 14 }, // Kode Klub
      { wch: 32 }, // Nama Klub
      { wch: 20 }, // NIK
      { wch: 16 }, // Nomor Lomba
      { wch: 22 }, // Seed Time
    ];
    XLSX.utils.book_append_sheet(workbook, wsForm, 'Formulir_Pendaftar');

    // 2. Sheet: Daftar_Nomor_Lomba (Active Championship Events reference)
    const eventsData = events.map(e => ({
      'No. Lomba': e.eventNumber,
      'Nama Nomor Acara': e.title,
      'Jarak': `${e.distance}m`,
      'Gaya Renang': getStrokeLabel(e.stroke),
      'Jenis Kelamin': e.gender === 'MALE' ? 'Putra' : 'Putri',
      'Kelompok Usia': getAgeGroupLabel(e.ageGroup),
      'Sesi Lomba': `Sesi ${e.session}`,
      'Babak': e.round === 'TIMED_FINAL' ? 'Timed Final' : e.round
    }));

    const wsEvents = XLSX.utils.json_to_sheet(eventsData);
    wsEvents['!cols'] = [
      { wch: 12 },
      { wch: 38 },
      { wch: 10 },
      { wch: 18 },
      { wch: 14 },
      { wch: 20 },
      { wch: 12 },
      { wch: 14 }
    ];
    XLSX.utils.book_append_sheet(workbook, wsEvents, 'Daftar_Nomor_Lomba');

    // 3. Sheet: Panduan_Kelompok_Usia (Current Age Groups A-I guide & Cutoff date)
    const ageGroupsData = customAgeGroups.map(ag => ({
      'Kode KU': ag.code,
      'Nama Kategori': ag.name,
      'Usia Minimal': ag.minAge,
      'Usia Maksimal': ag.maxAge >= 90 ? 'Tak Terbatas' : ag.maxAge,
      'Batas Umur (Tahun)': ag.minAge === ag.maxAge ? `${ag.minAge} Tahun` : `${ag.minAge} s/d ${ag.maxAge} Tahun`,
      'Tanggal Batas Cutoff': championship.cutoffDate,
      'Keterangan': ag.description || 'Kategori resmi kejuaraan'
    }));

    const wsAgeGroups = XLSX.utils.json_to_sheet(ageGroupsData);
    wsAgeGroups['!cols'] = [
      { wch: 16 },
      { wch: 26 },
      { wch: 14 },
      { wch: 16 },
      { wch: 22 },
      { wch: 22 },
      { wch: 36 }
    ];
    XLSX.utils.book_append_sheet(workbook, wsAgeGroups, 'Panduan_Kelompok_Usia');

    // 4. Sheet: Daftar_Klub (Existing clubs reference)
    const clubsData = clubs.map(c => ({
      'Kode Klub': c.code,
      'Nama Perkumpulan / Klub': c.name,
      'Kota': c.city || '-',
      'Provinsi': c.province || '-',
      'Pelatih': c.coach || '-',
      'Kontak': c.contactNumber || '-'
    }));

    const wsClubs = XLSX.utils.json_to_sheet(clubsData);
    wsClubs['!cols'] = [
      { wch: 14 },
      { wch: 34 },
      { wch: 16 },
      { wch: 18 },
      { wch: 20 },
      { wch: 16 }
    ];
    XLSX.utils.book_append_sheet(workbook, wsClubs, 'Daftar_Klub');

    XLSX.writeFile(workbook, `Template_Pendaftaran_Atlet_${championship.name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
  };

  const toggleSelectRow = (idx: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === parsedRows.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(parsedRows.map((_, i) => i)));
    }
  };

  const handleExecuteImport = () => {
    const rowsToImport = parsedRows.filter((_, idx) => selectedIndices.has(idx));
    if (rowsToImport.length === 0) {
      alert('Pilih setidaknya 1 baris atlet untuk diimpor.');
      return;
    }

    const result = importBulkAthletes(rowsToImport.map(r => ({
      nik: r.nik,
      regNumber: r.regNumber,
      name: r.name,
      gender: r.gender,
      birthDate: r.birthDate,
      clubCode: r.clubCode,
      clubName: r.clubName,
      eventNumbers: r.eventNumbers,
      seedTimes: r.seedTimes,
    })));

    setImportStatusMessage(`Berhasil mengimpor ${result.count} atlet! (${result.newClubsCount} perkumpulan baru didaftarkan)`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Impor Data Atlet dari Excel / Spreadsheet
              </h3>
              <p className="text-xs text-slate-500">
                Otomatisasi pengelompokan umur (KU), verifikasi klub, dan pendaftaran nomor lomba
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer"
              title="Unduh berkas contoh template Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Template Excel</span>
            </button>

            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Method Selector Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Unggah Berkas (.xlsx, .xls, .csv)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'paste'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Salin & Tempel (Copy-Paste Spreadsheet)
              </button>
            </div>

            <span className="text-[11px] text-slate-500">
              Cutoff KU: <strong>{championship.cutoffDate}</strong>
            </span>
          </div>

          {/* TAB 1: Upload File */}
          {activeTab === 'upload' && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/70 rounded-2xl p-8 text-center cursor-pointer transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <div className="text-sm font-bold text-slate-800">
                Klik atau Seret Berkas Excel (.xlsx, .xls) atau .csv ke sini
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
                Format terbaru mencakup: <strong>No. Register</strong>, <strong>Nama Lengkap</strong>, <strong>Jenis Kelamin</strong>, <strong>Tanggal Lahir</strong>, <strong>Kelompok Usia (A s/d I)</strong>, <strong>Kode & Nama Klub</strong>, <strong>NIK</strong>, <strong>Nomor Lomba</strong>, dan <strong>Seed Time</strong>.
              </p>
              <div className="mt-2 text-[11px] text-emerald-700 bg-emerald-100/70 py-1 px-3 rounded-full inline-block">
                Template kini dilengkapi 4 Sheet: Formulir, Daftar Nomor Lomba, Panduan Kelompok Usia (A-I), dan Daftar Klub
              </div>
              {fileName && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-emerald-300 rounded-full text-xs font-mono text-emerald-800 font-bold">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{fileName}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Direct Paste */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Tempelkan baris data langsung dari Google Sheets atau Microsoft Excel:
              </label>
              <textarea
                rows={5}
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder={"No. Register\tNama Lengkap\tJenis Kelamin\tTanggal Lahir\tKelompok Usia\tKode Klub\tNama Klub\tNIK\tNomor Lomba\tSeed Time\nREG-ALV-128\tDimas Alvaro Pratama\tPutra\t2018-05-12\tC\tMILL-JKT\tMillennium Aquatic Jakarta\t3171011205180001\t100\t00:18.50"}
                className="w-full p-3 text-xs font-mono border border-slate-300 rounded-xl focus:outline-hidden focus:border-emerald-500"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleProcessPaste}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-colors"
                >
                  Proses & Periksa Data
                </button>
              </div>
            </div>
          )}

          {/* Live Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    Pratinjau Data Terbaca ({parsedRows.length} Atlet)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    · {selectedIndices.size} baris dipilih untuk diimpor
                  </span>
                </div>

                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs font-semibold text-sky-600 hover:underline"
                >
                  {selectedIndices.size === parsedRows.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] sticky top-0">
                    <tr>
                      <th className="py-2 px-3 w-8 text-center">✓</th>
                      <th className="py-2 px-3">No. Register</th>
                      <th className="py-2 px-3">Nama Lengkap & NIK</th>
                      <th className="py-2 px-3">Gender</th>
                      <th className="py-2 px-3">Tgl Lahir / Usia</th>
                      <th className="py-2 px-3 font-semibold">Kelompok Usia (KU)</th>
                      <th className="py-2 px-3">Klub / Kontingen</th>
                      <th className="py-2 px-3">Nomor Lomba & Seed</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => {
                      const isSelected = selectedIndices.has(idx);
                      const displayKU = row.customKU || getAgeGroupLabel(row.calculatedKU, row.calculatedAge);

                      return (
                        <tr 
                          key={idx} 
                          onClick={() => toggleSelectRow(idx)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-emerald-50/30' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectRow(idx)}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 text-[11px]">
                              {row.regNumber}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{row.name}</div>
                            <div className="font-mono text-[11px] text-slate-400">
                              {row.nik && row.nik !== row.regNumber ? `NIK: ${row.nik}` : '-'}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={row.gender === 'MALE' ? 'text-sky-700 font-semibold' : 'text-pink-700 font-semibold'}>
                              {row.gender === 'MALE' ? 'Putra' : 'Putri'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {row.birthDate} ({row.calculatedAge} th)
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">
                            <span className="inline-block bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                              {displayKU}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-800">{row.clubCode}</span>
                            <span className="block text-[10px] text-slate-500 truncate max-w-[140px]">{row.clubName}</span>
                            {!row.isExistingClub && (
                              <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 inline-block mt-0.5">
                                Klub Baru
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {row.eventNumbers.length > 0 ? (
                              <div className="space-y-0.5">
                                {row.eventNumbers.map(evNum => {
                                  const evMatch = events.find(e => e.eventNumber === evNum);
                                  const seed = row.seedTimes[evNum];
                                  return (
                                    <div key={evNum} className="text-[10px] text-slate-700 font-mono">
                                      #{evNum} {evMatch ? evMatch.title.split(' ')[0] : ''} <span className="font-bold text-slate-900">({seed || 'NT'})</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {row.isValid ? (
                              <span className="text-emerald-700 font-bold text-[11px] flex items-center justify-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Siap
                              </span>
                            ) : (
                              <span className="text-rose-600 font-bold text-[11px] flex items-center justify-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" /> Tidak Lengkap
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {importStatusMessage && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-700" />
              <span>{importStatusMessage}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            {parsedRows.length > 0 
              ? `${selectedIndices.size} dari ${parsedRows.length} atlet siap ditambahkan ke database kompetisi.`
              : 'Silakan pilih berkas Excel atau tempelkan data terlebih dahulu.'}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              disabled={selectedIndices.size === 0}
              onClick={handleExecuteImport}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan & Impor Data Atlet ({selectedIndices.size})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
