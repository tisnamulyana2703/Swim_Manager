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
  name: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
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
  const { championship, clubs, events, importBulkAthletes } = useSwimData();

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
      const nameKey = findColumnKey(r, ['nama', 'nama lengkap', 'name', 'atlet', 'nama atlet', 'swimmer']);
      const nameVal = nameKey ? String(r[nameKey] || '').trim() : '';
      if (!nameVal) return; // skip empty rows

      // Find NIK
      const nikKey = findColumnKey(r, ['nik', 'id', 'no identitas', 'nomor identitas', 'nik/id', 'ktp', 'nisn']);
      const nikVal = nikKey ? String(r[nikKey] || '').trim() : `317${Date.now()}${idx}`;

      // Find Gender
      const genderKey = findColumnKey(r, ['gender', 'jenis kelamin', 'jk', 'sex', 'l/p', 'kategori']);
      const genderRaw = genderKey ? String(r[genderKey] || '').trim().toLowerCase() : '';
      const gender: 'MALE' | 'FEMALE' = 
        genderRaw.startsWith('p') && !genderRaw.startsWith('pu') && genderRaw.length <= 2 
          ? 'FEMALE'
          : genderRaw.includes('putri') || genderRaw.includes('female') || genderRaw.includes('wanita') || genderRaw === 'f'
          ? 'FEMALE'
          : 'MALE';

      // Find Birth Date
      const birthKey = findColumnKey(r, ['tanggal lahir', 'tgl lahir', 'birthdate', 'birth date', 'dob', 'lahir']);
      let birthDateVal = '2011-01-01';
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

      // Club
      const clubCodeKey = findColumnKey(r, ['kode klub', 'kode perkumpulan', 'kode', 'club code']);
      const clubNameKey = findColumnKey(r, ['nama klub', 'klub', 'club', 'perkumpulan', 'asal klub', 'kontingen']);
      const clubCode = clubCodeKey ? String(r[clubCodeKey] || '').toUpperCase().trim() : (clubNameKey ? String(r[clubNameKey] || '').slice(0, 8).toUpperCase().trim() : 'IND');
      const clubName = clubNameKey ? String(r[clubNameKey] || '').trim() : clubCode;

      const isExisting = existingClubCodes.has(clubCode) || existingClubNames.has(clubName.toLowerCase());

      // Events & Seed Time
      const eventKey = findColumnKey(r, ['nomor lomba', 'nomor acara', 'event', 'events', 'no lomba', 'lomba']);
      const seedKey = findColumnKey(r, ['seed time', 'seed', 'entry time', 'waktu terbaik', 'best time', 'waktu']);
      
      const eventNumbers: number[] = [];
      const seedTimes: Record<number, string> = {};

      if (eventKey && r[eventKey]) {
        const rawEvent = String(r[eventKey]);
        // Extract numbers like "101, 103" or "101"
        const matches = rawEvent.match(/\d+/g);
        if (matches) {
          matches.forEach(m => {
            const num = parseInt(m, 10);
            if (!isNaN(num)) eventNumbers.push(num);
          });
        }
      }

      const seedVal = seedKey && r[seedKey] ? String(r[seedKey]).trim() : '00:00.00';
      if (eventNumbers.length > 0) {
        eventNumbers.forEach(evNum => {
          seedTimes[evNum] = seedVal;
        });
      }

      processed.push({
        nik: nikVal,
        name: nameVal,
        gender,
        birthDate: birthDateVal,
        clubCode: clubCode || 'IND',
        clubName: clubName || 'Independen',
        eventNumbers,
        seedTimes,
        calculatedAge: age,
        calculatedKU: ageGroup,
        isValid: Boolean(nameVal && nikVal),
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
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        if (json.length === 0) {
          alert('Berkas Excel kosong atau tidak memiliki baris data.');
          return;
        }

        processRawRecords(json);
      } catch (err) {
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

  // Download Sample Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'NIK': '3171011205110001',
        'Nama Lengkap': 'Kenzo Alfarizi Pratama',
        'Jenis Kelamin': 'Putra',
        'Tanggal Lahir': '2011-05-12',
        'Kode Klub': 'MILL-JKT',
        'Nama Klub': 'Millennium Aquatic Jakarta',
        'Nomor Lomba': '101, 103',
        'Seed Time': '00:25.80'
      },
      {
        'NIK': '3172021508110002',
        'Nama Lengkap': 'Nayla Putri Azzahra',
        'Jenis Kelamin': 'Putri',
        'Tanggal Lahir': '2012-01-14',
        'Kode Klub': 'JAQ',
        'Nama Klub': 'Jakarta Aquatic Club',
        'Nomor Lomba': '102',
        'Seed Time': '00:28.65'
      },
      {
        'NIK': '3525181102080018',
        'Nama Lengkap': 'Dimas Wicaksono',
        'Jenis Kelamin': 'Putra',
        'Tanggal Lahir': '2008-02-11',
        'Kode Klub': 'PETRO',
        'Nama Klub': 'Petrokimia Gresik Aquatic Club',
        'Nomor Lomba': '103',
        'Seed Time': '01:06.10'
      },
      {
        'NIK': '3273241208030024',
        'Nama Lengkap': 'Triady Fauzi Sidiq',
        'Jenis Kelamin': 'Putra',
        'Tanggal Lahir': '2003-08-12',
        'Kode Klub': 'BEAST',
        'Nama Klub': 'Beast Aquatic Club Bandung',
        'Nomor Lomba': '105',
        'Seed Time': '00:24.45'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pendaftaran_Atlet');

    // Auto-fit column widths
    worksheet['!cols'] = [
      { wch: 20 }, // NIK
      { wch: 28 }, // Nama
      { wch: 14 }, // JK
      { wch: 15 }, // Tgl Lahir
      { wch: 12 }, // Kode Klub
      { wch: 30 }, // Nama Klub
      { wch: 16 }, // Nomor Lomba
      { wch: 14 }, // Seed Time
    ];

    XLSX.writeFile(workbook, 'Template_Pendaftaran_Atlet_SwimRace.xlsx');
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
      name: r.name,
      gender: r.gender,
      birthDate: r.birthDate,
      clubCode: r.clubCode,
      clubName: r.clubName,
      eventNumbers: r.eventNumbers,
      seedTimes: r.seedTimes,
    })));

    setImportStatusMessage(`Berhasil mengimpor ${result.count} atlet! (${result.newClubsCount} klub baru ditambahkan)`);
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
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Kolom yang didukung: NIK, Nama Lengkap, Jenis Kelamin (Putra/Putri), Tanggal Lahir (YYYY-MM-DD), Kode/Nama Klub, Nomor Lomba, Seed Time.
              </p>
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
                placeholder={"NIK\tNama Lengkap\tJenis Kelamin\tTanggal Lahir\tKode Klub\tNama Klub\tNomor Lomba\tSeed Time\n3171011205110001\tKenzo Alfarizi Pratama\tPutra\t2011-05-12\tMILL-JKT\tMillennium Aquatic\t101\t00:25.80"}
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
                      <th className="py-2 px-3">Nama Lengkap & NIK</th>
                      <th className="py-2 px-3">Gender</th>
                      <th className="py-2 px-3">Tgl Lahir / Usia</th>
                      <th className="py-2 px-3 font-semibold">Kelompok Umur (KU)</th>
                      <th className="py-2 px-3">Klub / Kontingen</th>
                      <th className="py-2 px-3">Nomor Lomba</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => {
                      const isSelected = selectedIndices.has(idx);
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
                            <div className="font-bold text-slate-900">{row.name}</div>
                            <div className="font-mono text-[11px] text-slate-400">{row.nik}</div>
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
                            {row.calculatedKU.replace('_', ' ')}
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
                                      #{evNum} {evMatch ? evMatch.title.split(' ')[0] : ''} ({seed || 'NT'})
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
