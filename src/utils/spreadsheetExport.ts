/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { 
  Athlete, 
  ChampionshipInfo, 
  Club, 
  ClubMedalTally, 
  IncidentReport, 
  SwimEvent 
} from '../types/swim';
import { formatDateToDDMMYYYY, getCategoryLetter, formatTimeDifference } from './timeUtils';

export interface ChampionshipSpreadsheetData {
  summaryInfo: {
    name: string;
    organizer: string;
    venue: string;
    poolLength: string;
    poolLanes: number;
    startDate: string;
    endDate: string;
    city: string;
    totalClubs: number;
    totalAthletes: number;
    totalEvents: number;
    totalIncidents: number;
    exportedAt: string;
  };
  sheets: {
    infoKejuaraan: (string | number)[][];
    dataKlub: (string | number)[][];
    dataAtlet: (string | number)[][];
    nomorLomba: (string | number)[][];
    startingListSeri: (string | number)[][];
    hasilLomba: (string | number)[][];
    klasemenMedali: (string | number)[][];
    catatanKasusDQ: (string | number)[][];
  };
}

/**
 * Builds the comprehensive structured dataset of the championship
 */
export function buildChampionshipSpreadsheetData(
  championship: ChampionshipInfo,
  clubs: Club[],
  athletes: Athlete[],
  events: SwimEvent[],
  incidents: IncidentReport[],
  medalTally: ClubMedalTally[],
  getStrokeLabel: (code: string) => string,
  getEventAgeGroupsLabel: (ev: SwimEvent) => string
): ChampionshipSpreadsheetData {
  const clubMap = new Map(clubs.map(c => [c.id, c]));
  const eventMap = new Map(events.map(e => [e.id, e]));
  const athleteMap = new Map(athletes.map(a => [a.id, a]));

  const exportedAt = new Date().toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  // 1. INFO KEJUARAAN
  const infoKejuaraan: (string | number)[][] = [
    ['INFORMASI RESMI KEJUARAAN RENANG'],
    ['Waktu Ekspor', exportedAt],
    [''],
    ['Parameter', 'Keterangan'],
    ['Nama Kejuaraan', championship.name],
    ['Penyelenggara', championship.organizer],
    ['Lokasi / Venue', championship.venue],
    ['Kota Penyelenggaraan', championship.city],
    ['Spesifikasi Kolam', `${championship.poolLength} (${championship.poolLanes} Lintasan)`],
    ['Tanggal Mulai', championship.startDate],
    ['Tanggal Selesai', championship.endDate],
    ['Sistem Timing', championship.timingDeviceType === 'AUTOMATIC_TOUCHPAD' ? 'Automatic Timing System (Touchpad)' : championship.timingDeviceType === 'SEMI_AUTOMATIC' ? 'Semi-Automatic' : 'Manual Stopwatch'],
    ['Kunci Data / Status', championship.isLocked ? 'Terkunci (Final)' : 'Aktif (Berjalan)'],
    [''],
    ['RINGKASAN REKAPITULASI DATA', ''],
    ['Total Klub Terdaftar', clubs.length],
    ['Total Atlet Terdaftar', athletes.length],
    ['Total Atlet Putra (PA)', athletes.filter(a => a.gender === 'MALE').length],
    ['Total Atlet Putri (PI)', athletes.filter(a => a.gender === 'FEMALE').length],
    ['Total Nomor Perlombaan', events.length],
    ['Total Catatan Kasus & DQ', incidents.length],
  ];

  // 2. DATA KLUB
  const dataKlub: (string | number)[][] = [
    ['NO', 'KODE KLUB', 'NAMA LENGKAP KLUB', 'NAMA PELATIH', 'NO. TELEPON', 'KOTA', 'PROVINSI', 'JML ATLET', 'JML NOMOR DIIKUTI']
  ];
  clubs.forEach((c, idx) => {
    const clubAthletes = athletes.filter(a => a.clubId === c.id);
    const totalEntries = clubAthletes.reduce((sum, a) => sum + (a.registeredEvents?.length || 0), 0);
    dataKlub.push([
      idx + 1,
      c.code,
      c.name,
      c.coach || '-',
      c.contactNumber || '-',
      c.city,
      c.province,
      clubAthletes.length,
      totalEntries
    ]);
  });

  // 3. DATA ATLET
  const dataAtlet: (string | number)[][] = [
    ['NO', 'NO. REGISTRASI', 'NIK / ID', 'NAMA LENGKAP ATLET', 'GENDER', 'KU', 'TGL LAHIR', 'USIA', 'KODE KLUB', 'NAMA KLUB', 'JML NOMOR DIIKUTI']
  ];
  athletes.forEach((a, idx) => {
    const club = clubMap.get(a.clubId);
    dataAtlet.push([
      idx + 1,
      a.regNumber || '-',
      a.nik || '-',
      a.name,
      a.gender === 'MALE' ? 'Putra' : 'Putri',
      getCategoryLetter(a.ageGroup, a.age),
      formatDateToDDMMYYYY(a.birthDate),
      a.age,
      club?.code || 'IND',
      club?.name || 'Independen',
      a.registeredEvents?.length || 0
    ]);
  });

  // 4. NOMOR LOMBA
  const nomorLomba: (string | number)[][] = [
    ['NO. LOMBA', 'JUDUL NOMOR LOMBA', 'SESI', 'JARAK (M)', 'GAYA', 'GENDER', 'KELOMPOK USIA (KU)', 'BABAK', 'JML PESERTA', 'JML SERI', 'STATUS']
  ];
  const sortedEvents = [...events].sort((a, b) => a.eventNumber - b.eventNumber);
  sortedEvents.forEach(ev => {
    const participantsCount = athletes.filter(a => a.registeredEvents?.some(r => r.eventId === ev.id)).length;
    nomorLomba.push([
      ev.eventNumber,
      ev.title,
      ev.session,
      ev.distance,
      getStrokeLabel(ev.stroke),
      ev.gender === 'MALE' ? 'Putra' : ev.gender === 'FEMALE' ? 'Putri' : 'Campuran',
      getEventAgeGroupsLabel(ev),
      ev.round === 'TIMED_FINAL' ? 'Timed Final' : ev.round === 'PRELIM' ? 'Penyisihan' : 'Final',
      participantsCount,
      ev.heats?.length || 0,
      ev.status
    ]);
  });

  // 5. STARTING LIST (SUSUNAN SERI & LINTASAN)
  const startingListSeri: (string | number)[][] = [
    ['NO. LOMBA', 'NAMA NOMOR LOMBA', 'SESI', 'SERI KE', 'DARI TOTAL SERI', 'LINTASAN', 'NO. REGISTRASI', 'NAMA ATLET', 'GENDER', 'KU', 'KLUB', 'SEED TIME', 'STATUS']
  ];
  sortedEvents.forEach(ev => {
    if (ev.heats && ev.heats.length > 0) {
      ev.heats.forEach(heat => {
        const sortedLanes = [...heat.lanes].sort((a, b) => a.laneNumber - b.laneNumber);
        sortedLanes.forEach(lane => {
          const ath = athleteMap.get(lane.athleteId);
          const club = ath ? clubMap.get(ath.clubId) : null;
          startingListSeri.push([
            ev.eventNumber,
            ev.title,
            ev.session,
            heat.heatNumber,
            ev.heats.length,
            lane.laneNumber,
            ath?.regNumber || '-',
            ath?.name || 'Tanpa Nama',
            ath?.gender === 'MALE' ? 'L' : 'P',
            getCategoryLetter(ath?.ageGroup, ath?.age),
            club ? `${club.name} (${club.code})` : '-',
            lane.seedTime || 'NT',
            lane.status
          ]);
        });
      });
    }
  });

  // 6. HASIL PERLOMBAAN
  const hasilLomba: (string | number)[][] = [
    ['NO. LOMBA', 'NAMA NOMOR LOMBA', 'SESI', 'PERINGKAT', 'SERI', 'LINTASAN', 'NO. REGISTRASI', 'NAMA ATLET', 'GENDER', 'KU', 'KLUB', 'WAKTU AKHIR', 'SELISIH', 'POIN', 'STATUS', 'REKOR']
  ];
  sortedEvents.forEach(ev => {
    if (ev.heats && ev.heats.length > 0) {
      const allLanes = ev.heats.flatMap(h => h.lanes.map(l => ({ ...l, heatNumber: h.heatNumber })));
      const sortedResults = [...allLanes].sort((a, b) => {
        if (a.rankInEvent && b.rankInEvent) return a.rankInEvent - b.rankInEvent;
        if (a.rankInEvent) return -1;
        if (b.rankInEvent) return 1;
        return (a.finalTimeMs || 9999999) - (b.finalTimeMs || 9999999);
      });
      const winnerMs = sortedResults.find(r => r.rankInEvent === 1)?.finalTimeMs || 0;

      sortedResults.forEach(l => {
        const ath = athleteMap.get(l.athleteId);
        const club = ath ? clubMap.get(ath.clubId) : null;
        hasilLomba.push([
          ev.eventNumber,
          ev.title,
          ev.session,
          l.rankInEvent || '-',
          l.heatNumber,
          l.laneNumber,
          ath?.regNumber || '-',
          ath?.name || 'Tanpa Nama',
          ath?.gender === 'MALE' ? 'L' : 'P',
          getCategoryLetter(ath?.ageGroup, ath?.age),
          club ? `${club.name} (${club.code})` : '-',
          l.finalTime || '-',
          (l.finalTime && winnerMs && l.finalTimeMs && l.rankInEvent !== 1) ? formatTimeDifference(l.finalTimeMs, winnerMs) : '-',
          l.points || 0,
          l.status,
          l.isNewRecord ? 'REKOR BARU' : '-'
        ]);
      });
    }
  });

  // 7. KLASEMEN MEDALI
  const klasemenMedali: (string | number)[][] = [
    ['PERINGKAT', 'KODE KLUB', 'NAMA KLUB RENANG', 'EMAS (GOLD)', 'PERAK (SILVER)', 'PERUNGGU (BRONZE)', 'TOTAL MEDALI', 'TOTAL POIN KEJUARAAN']
  ];
  medalTally.forEach((t, idx) => {
    klasemenMedali.push([
      idx + 1,
      t.clubCode,
      t.clubName,
      t.gold,
      t.silver,
      t.bronze,
      t.totalMedals,
      t.points
    ]);
  });

  // 8. CATATAN KASUS & DQ
  const catatanKasusDQ: (string | number)[][] = [
    ['NO', 'ID KASUS', 'WAKTU PELAPORAN', 'NO. LOMBA', 'NAMA NOMOR LOMBA', 'SERI', 'LINTASAN', 'NAMA ATLET', 'KLUB', 'KODE ATURAN', 'ALASAN PELANGGARAN', 'PUTUSAN WASIT', 'DITANDATANGANI']
  ];
  incidents.forEach((inc, idx) => {
    catatanKasusDQ.push([
      idx + 1,
      inc.id,
      new Date(inc.timestamp).toLocaleString('id-ID'),
      inc.eventNumber,
      inc.eventTitle,
      inc.heatNumber || '-',
      inc.laneNumber || '-',
      inc.athleteName || '-',
      inc.clubName || '-',
      inc.ruleCode || inc.category || 'DQ',
      inc.reason,
      inc.refereeDecision,
      inc.signedByRef ? 'Ya (Disahkan Wasit)' : 'Belum Disahkan'
    ]);
  });

  return {
    summaryInfo: {
      name: championship.name,
      organizer: championship.organizer,
      venue: championship.venue,
      poolLength: championship.poolLength,
      poolLanes: championship.poolLanes,
      startDate: championship.startDate,
      endDate: championship.endDate,
      city: championship.city,
      totalClubs: clubs.length,
      totalAthletes: athletes.length,
      totalEvents: events.length,
      totalIncidents: incidents.length,
      exportedAt,
    },
    sheets: {
      infoKejuaraan,
      dataKlub,
      dataAtlet,
      nomorLomba,
      startingListSeri,
      hasilLomba,
      klasemenMedali,
      catatanKasusDQ,
    }
  };
}

/**
 * Downloads a complete multi-sheet Excel (.xlsx) file containing all championship data
 */
export function downloadChampionshipExcel(data: ChampionshipSpreadsheetData, customFileName?: string) {
  const wb = XLSX.utils.book_new();

  // Helper to add sheet
  const addSheet = (rows: (string | number)[][], sheetName: string) => {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31)); // Excel max sheet name is 31 chars
  };

  addSheet(data.sheets.infoKejuaraan, '1_INFO_KEJUARAAN');
  addSheet(data.sheets.dataKlub, '2_DATA_KLUB');
  addSheet(data.sheets.dataAtlet, '3_DATA_ATLET');
  addSheet(data.sheets.nomorLomba, '4_NOMOR_LOMBA');
  addSheet(data.sheets.startingListSeri, '5_STARTING_LIST_SERI');
  addSheet(data.sheets.hasilLomba, '6_HASIL_LOMBA');
  addSheet(data.sheets.klasemenMedali, '7_KLASEMEN_MEDALI');
  addSheet(data.sheets.catatanKasusDQ, '8_CATATAN_KASUS_DQ');

  const fileName = customFileName || `Data_Lengkap_Kejuaraan_${data.summaryInfo.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Generates the complete, production-ready Google Apps Script Code.gs
 */
export function getGoogleAppsScriptCode(): string {
  return `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: SINKRONISASI DATA KEJUARAAN RENANG (SWIMRACE MANAGER)
 * =========================================================================
 * Skrip ini menerima payload JSON data kejuaraan renang dari aplikasi web
 * dan secara otomatis membuat/memperbarui 8 lembar kerja (sheets) dalam
 * Google Spreadsheet aktif secara terstruktur dan terformat rapi.
 *
 * LEMBAR KERJA YANG DIHASILKAN:
 * 1. 1_INFO_KEJUARAAN    - Detail kejuaraan, spesifikasi kolam, dan ringkasan
 * 2. 2_DATA_KLUB         - Seluruh data master klub & kontingen renang
 * 3. 3_DATA_ATLET        - Seluruh atlet terdaftar lengkap dengan KU (A-I)
 * 4. 4_NOMOR_LOMBA       - Daftar nomor perlombaan, sesi, dan status
 * 5. 5_STARTING_LIST_SERI- Susunan lintasan (heats & lanes) seluruh seri
 * 6. 6_HASIL_LOMBA       - Hasil akhir perlombaan, ranking, waktu, dan poin
 * 7. 7_KLASEMEN_MEDALI   - Rekap perolehan medali dan poin tim
 * 8. 8_CATATAN_KASUS_DQ  - Rekap laporan kasus insiden dan diskualifikasi
 *
 * =========================================================================
 * PANDUAN PENERAPAN (DEPLOYMENT):
 * 1. Buka spreadsheet baru di Google Sheets (sheets.google.com).
 * 2. Klik menu 'Ekstensi' (Extensions) > 'Apps Script'.
 * 3. Hapus seluruh isi default editor, lalu tempelkan (paste) kode ini.
 * 4. Klik ikon 'Simpan' (ikon disket / Ctrl+S / Cmd+S).
 * 5. Klik tombol biru 'Terapkan' (Deploy) > 'Deployment baru' (New deployment).
 * 6. Klik ikon gerigi (Pilih jenis) > pilih 'Aplikasi Web' (Web app).
 * 7. Konfigurasi:
 *    - Deskripsi: SwimRace Sync Webhook
 *    - Jalankan sebagai (Execute as): 'Saya' (Me - akun Google Anda)
 *    - Siapa yang memiliki akses (Who has access): 'Siapa saja' (Anyone)  <-- PENTING!
 * 8. Klik 'Terapkan' (Deploy). Jika muncul verifikasi keamanan Google:
 *    - Klik 'Tinjau Izin' (Review Permissions)
 *    - Pilih akun Google Anda
 *    - Klik 'Lanjutan' (Advanced) > Klik 'Buka Skrip Tidak Aman' (Go to Untitled project)
 *    - Klik 'Izinkan' (Allow)
 * 9. Salin URL Aplikasi Web (berakhiran /exec).
 * 10. Tempelkan URL tersebut ke kolom URL di aplikasi SwimRace dan klik 'Simpan & Sinkronkan Sekarang'.
 * =========================================================================
 */

/**
 * Handle HTTP GET: Memverifikasi bahwa Web App Google Apps Script aktif
 */
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var html = '<!DOCTYPE html>' +
    '<html><head><meta charset="utf-8"><title>SwimRace Google Apps Script Web App</title>' +
    '<style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:40px;background:#f8fafc;color:#0f172a;line-height:1.6;}' +
    '.card{max-width:640px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);border:1px solid #e2e8f0;}' +
    'h1{color:#0284c7;margin-top:0;font-size:22px;display:flex;align-items:center;gap:10px;}' +
    '.badge{display:inline-block;padding:4px 10px;border-radius:9999px;font-size:12px;font-weight:700;background:#dcfce7;color:#166534;}' +
    'code{background:#f1f5f9;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:13px;}' +
    '</style></head><body>' +
    '<div class="card">' +
    '<h1>🏊 SwimRace Manager - Google Apps Script Web App</h1>' +
    '<p><span class="badge">STATUS: AKTIF &amp; SIAP DIGUNAKAN</span></p>' +
    '<p>Web App ini berhasil terhubung ke Google Spreadsheet: <strong>' + (ss ? ss.getName() : 'Spreadsheet Aktif') + '</strong>.</p>' +
    '<p>Silakan salin URL halaman ini (yang berakhiran <code>/exec</code>) dan masukkan ke menu <strong>Simpan ke Spreadsheet</strong> di aplikasi SwimRace Anda.</p>' +
    '<hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">' +
    '<small style="color:#64748b;">Standar World Aquatics &amp; PB Akuatik Indonesia</small>' +
    '</div></body></html>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Handle HTTP POST: Menerima data kejuaraan dan memperbarui spreadsheet
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  // Kunci eksekusi selama maksimal 30 detik untuk mencegah race condition
  lock.tryLock(30000);

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({
        success: false,
        message: 'Tidak ada payload data yang diterima.'
      });
    }

    var payload = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return createJsonResponse({
        success: false,
        message: 'Tidak dapat menemukan Spreadsheet aktif.'
      });
    }

    var sheetsData = payload.sheets || {};
    var summaryInfo = payload.summaryInfo || {};

    // 1. Simpan lembar kerja INFO KEJUARAAN
    if (sheetsData.infoKejuaraan && sheetsData.infoKejuaraan.length > 0) {
      writeAndFormatSheet(ss, '1_INFO_KEJUARAAN', sheetsData.infoKejuaraan, '#0369a1', true);
    }

    // 2. Simpan lembar kerja DATA KLUB
    if (sheetsData.dataKlub && sheetsData.dataKlub.length > 0) {
      writeAndFormatSheet(ss, '2_DATA_KLUB', sheetsData.dataKlub, '#047857');
    }

    // 3. Simpan lembar kerja DATA ATLET
    if (sheetsData.dataAtlet && sheetsData.dataAtlet.length > 0) {
      writeAndFormatSheet(ss, '3_DATA_ATLET', sheetsData.dataAtlet, '#0284c7');
    }

    // 4. Simpan lembar kerja NOMOR LOMBA
    if (sheetsData.nomorLomba && sheetsData.nomorLomba.length > 0) {
      writeAndFormatSheet(ss, '4_NOMOR_LOMBA', sheetsData.nomorLomba, '#b91c1c');
    }

    // 5. Simpan lembar kerja STARTING LIST
    if (sheetsData.startingListSeri && sheetsData.startingListSeri.length > 0) {
      writeAndFormatSheet(ss, '5_STARTING_LIST_SERI', sheetsData.startingListSeri, '#4338ca');
    }

    // 6. Simpan lembar kerja HASIL LOMBA
    if (sheetsData.hasilLomba && sheetsData.hasilLomba.length > 0) {
      writeAndFormatSheet(ss, '6_HASIL_LOMBA', sheetsData.hasilLomba, '#15803d');
    }

    // 7. Simpan lembar kerja KLASEMEN MEDALI
    if (sheetsData.klasemenMedali && sheetsData.klasemenMedali.length > 0) {
      writeAndFormatSheet(ss, '7_KLASEMEN_MEDALI', sheetsData.klasemenMedali, '#b45309');
    }

    // 8. Simpan lembar kerja CATATAN KASUS & DQ
    if (sheetsData.catatanKasusDQ && sheetsData.catatanKasusDQ.length > 0) {
      writeAndFormatSheet(ss, '8_CATATAN_KASUS_DQ', sheetsData.catatanKasusDQ, '#be123c');
    }

    // Ubah nama spreadsheet jika nama kejuaraan tersedia
    if (summaryInfo.name) {
      ss.setName('SwimRace - ' + summaryInfo.name);
    }

    return createJsonResponse({
      success: true,
      timestamp: new Date().toISOString(),
      spreadsheetName: ss.getName(),
      spreadsheetUrl: ss.getUrl(),
      message: 'Seluruh data kejuaraan berhasil disimpan ke 8 lembar kerja Google Spreadsheet!'
    });

  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.toString(),
      message: 'Gagal memproses data kejuaraan: ' + error.message
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Menulis dan memformat lembar kerja (sheet) secara otomatis
 */
function writeAndFormatSheet(ss, sheetName, dataArray, headerColorHex, isSummary) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  } else {
    sheet.clear();
  }

  if (!dataArray || dataArray.length === 0) return;

  var numRows = dataArray.length;
  var numCols = 0;
  for (var i = 0; i < dataArray.length; i++) {
    if (dataArray[i].length > numCols) {
      numCols = dataArray[i].length;
    }
  }

  // Normalisasi panjang baris agar simetris
  var normalizedData = [];
  for (var r = 0; r < numRows; r++) {
    var row = [];
    for (var c = 0; c < numCols; c++) {
      var val = dataArray[r][c];
      row.push(val !== undefined && val !== null ? val : '');
    }
    normalizedData.push(row);
  }

  // Tulis data ke sheet
  var range = sheet.getRange(1, 1, numRows, numCols);
  range.setValues(normalizedData);
  range.setFontFamily('Arial');
  range.setFontSize(10);
  range.setVerticalAlignment('middle');

  if (isSummary) {
    // Format khusus sheet Info Kejuaraan
    sheet.getRange(1, 1, 1, numCols)
      .setBackground(headerColorHex)
      .setFontColor('#ffffff')
      .setFontWeight('bold')
      .setFontSize(12)
      .setHorizontalAlignment('center');
    
    sheet.getRange(4, 1, 1, numCols)
      .setBackground('#f1f5f9')
      .setFontColor('#0f172a')
      .setFontWeight('bold');

    sheet.getRange(14, 1, 1, numCols)
      .setBackground('#f1f5f9')
      .setFontColor('#0f172a')
      .setFontWeight('bold');

    sheet.setFrozenRows(1);
  } else {
    // Format standar tabel: Header baris pertama
    var headerRange = sheet.getRange(1, 1, 1, numCols);
    headerRange
      .setBackground(headerColorHex)
      .setFontColor('#ffffff')
      .setFontWeight('bold')
      .setFontSize(10.5)
      .setHorizontalAlignment('center');

    // Bekukan baris pertama agar selalu terlihat saat scrolling
    sheet.setFrozenRows(1);

    // Zebra striping untuk keterbacaan
    if (numRows > 1) {
      for (var rowIdx = 2; rowIdx <= numRows; rowIdx++) {
        if (rowIdx % 2 === 0) {
          sheet.getRange(rowIdx, 1, 1, numCols).setBackground('#f8fafc');
        }
      }
    }
  }

  // Atur border tipis halus
  range.setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);

  // Auto-fit kolom
  for (var colIdx = 1; colIdx <= numCols; colIdx++) {
    sheet.autoResizeColumn(colIdx);
    // Berikan ruang padding ekstra minimal
    var currentWidth = sheet.getColumnWidth(colIdx);
    if (currentWidth < 70) {
      sheet.setColumnWidth(colIdx, 70);
    } else if (currentWidth > 350) {
      sheet.setColumnWidth(colIdx, 350);
    }
  }
}

/**
 * Helper JSON Response
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
}
