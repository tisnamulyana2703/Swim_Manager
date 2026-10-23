/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgeGroupCode, AgeGroupConfig, DQViolation, Stroke } from '../types/swim';

export const AGE_GROUPS: AgeGroupConfig[] = [
  { code: 'OPEN', name: 'Terbuka / Umum (Open)', minAge: 0, maxAge: 99, description: 'Kategori Terbuka Tanpa Batasan Umur' },
  { code: 'SENIOR', name: 'Senior (19+ Tahun)', minAge: 19, maxAge: 99, description: 'Atlet Usia 19 Tahun ke Atas' },
  { code: 'KU_I', name: 'KU I (16-18 Tahun)', minAge: 16, maxAge: 18, description: 'Kelompok Umur I' },
  { code: 'KU_II', name: 'KU II (14-15 Tahun)', minAge: 14, maxAge: 15, description: 'Kelompok Umur II' },
  { code: 'KU_III', name: 'KU III (12-13 Tahun)', minAge: 12, maxAge: 13, description: 'Kelompok Umur III' },
  { code: 'KU_IV', name: 'KU IV (10-11 Tahun)', minAge: 10, maxAge: 11, description: 'Kelompok Umur IV' },
  { code: 'KU_V', name: 'KU V (≤9 Tahun)', minAge: 0, maxAge: 9, description: 'Kelompok Umur V Pemula' },
];

/**
 * Calculate age based on birth date and cutoff date (typically 31 Dec of competition year)
 */
export function calculateAge(birthDateStr: string, cutoffDateStr: string): number {
  if (!birthDateStr) return 0;
  const birth = new Date(birthDateStr);
  const cutoff = new Date(cutoffDateStr);
  let age = cutoff.getFullYear() - birth.getFullYear();
  const m = cutoff.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && cutoff.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

/**
 * Determine Kelompok Umur (Age Group) code automatically based on calculated age
 */
export function determineAgeGroup(age: number): AgeGroupCode {
  if (age >= 19) return 'SENIOR';
  if (age >= 16) return 'KU_I';
  if (age >= 14) return 'KU_II';
  if (age >= 12) return 'KU_III';
  if (age >= 10) return 'KU_IV';
  return 'KU_V';
}

/**
 * Parse time string (e.g. "25.43", "00:25.43", "1:02.15", "01:02.15") to milliseconds
 */
export function parseTimeToMs(timeStr: string | null | undefined): number {
  if (!timeStr) return 0;
  const clean = timeStr.trim();
  if (clean === '' || clean === 'NT' || clean === '0') return 0;

  // Pattern with minutes and seconds: mm:ss.xx or m:ss.xx
  if (clean.includes(':')) {
    const [minPart, secPart] = clean.split(':');
    const mins = parseInt(minPart, 10) || 0;
    const secs = parseFloat(secPart) || 0;
    return Math.round((mins * 60 + secs) * 1000);
  }

  // Seconds only: ss.xx
  const secs = parseFloat(clean);
  if (isNaN(secs)) return 0;
  return Math.round(secs * 1000);
}

/**
 * Format milliseconds into standard swimming display "mm:ss.xx" or "ss.xx"
 */
export function formatMsToTime(ms: number | null | undefined, forceMinutes = false): string {
  if (ms === null || ms === undefined || ms <= 0) return 'NT';
  
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSecs = (totalSeconds % 60).toFixed(2);
  const [secWhole, secDec] = remainingSecs.split('.');
  const paddedSecWhole = secWhole.padStart(2, '0');
  const paddedDec = (secDec || '00').padEnd(2, '0');

  if (minutes > 0 || forceMinutes) {
    const paddedMins = minutes.toString().padStart(2, '0');
    return `${paddedMins}:${paddedSecWhole}.${paddedDec}`;
  }

  return `${paddedSecWhole}.${paddedDec}`;
}

export function formatTimeDifference(baseMs: number, targetMs: number): string {
  if (!baseMs || !targetMs || targetMs <= baseMs) return '-';
  const diffMs = targetMs - baseMs;
  return `+${(diffMs / 1000).toFixed(2)}`;
}

/**
 * Split a swimming time string ("00:25.40" or "25.40") into Minutes, Seconds, and Centiseconds (perseratus detik)
 */
export function splitTimeComponents(timeStr: string | null | undefined): {
  minutes: string;
  seconds: string;
  centiseconds: string;
} {
  if (!timeStr || timeStr === 'NT' || timeStr.trim() === '') {
    return { minutes: '', seconds: '', centiseconds: '' };
  }

  const clean = timeStr.trim();
  let minPart = '00';
  let secDecPart = clean;

  if (clean.includes(':')) {
    const parts = clean.split(':');
    minPart = parts[0].padStart(2, '0');
    secDecPart = parts[1] || '00.00';
  }

  let secPart = '00';
  let centiPart = '00';

  if (secDecPart.includes('.')) {
    const sParts = secDecPart.split('.');
    secPart = sParts[0].padStart(2, '0');
    centiPart = (sParts[1] || '00').padEnd(2, '0').slice(0, 2);
  } else {
    secPart = secDecPart.padStart(2, '0');
  }

  return {
    minutes: minPart === '00' ? '' : minPart,
    seconds: secPart,
    centiseconds: centiPart,
  };
}

/**
 * Combine Minutes, Seconds, and Centiseconds back into a standard time string
 * e.g. min "0" or "1", sec "05", centi "20" -> "01:05.20"
 */
export function combineTimeComponents(
  minutes: string | number,
  seconds: string | number,
  centiseconds: string | number
): string | null {
  const minStr = String(minutes || '').trim();
  const secStr = String(seconds || '').trim();
  const centiStr = String(centiseconds || '').trim();

  // If all are blank
  if (!minStr && !secStr && !centiStr) {
    return null;
  }

  const mins = parseInt(minStr, 10) || 0;
  const secs = parseInt(secStr, 10) || 0;
  const centis = parseInt(centiStr, 10) || 0;

  const paddedMins = mins.toString().padStart(2, '0');
  const paddedSecs = secs.toString().padStart(2, '0');
  const paddedCentis = centis.toString().padStart(2, '0');

  return `${paddedMins}:${paddedSecs}.${paddedCentis}`;
}

export const STROKE_LABELS: Record<Stroke, string> = {
  FREESTYLE: 'Gaya Bebas',
  BACKSTROKE: 'Gaya Punggung',
  BREASTSTROKE: 'Gaya Dada',
  BUTTERFLY: 'Gaya Kupu-kupu',
  INDIVIDUAL_MEDLEY: 'Gaya Ganti Perorangan',
  RELAY_FREESTYLE: 'Estafet Gaya Bebas',
  RELAY_MEDLEY: 'Estafet Gaya Ganti',
};

export const STROKE_SHORT: Record<Stroke, string> = {
  FREESTYLE: 'Bebas',
  BACKSTROKE: 'Punggung',
  BREASTSTROKE: 'Dada',
  BUTTERFLY: 'Kupu',
  INDIVIDUAL_MEDLEY: 'Ganti',
  RELAY_FREESTYLE: 'Est. Bebas',
  RELAY_MEDLEY: 'Est. Ganti',
};

/**
 * Official World Aquatics (FINA) Disqualification Rules Reference for official reports
 */
export const OFFICIAL_DQ_RULES: DQViolation[] = [
  {
    id: 'SW-4.4',
    ruleCode: 'SW 4.4',
    title: 'False Start / Mendahului Aba-aba',
    description: 'Perenang mendahului atau bergerak maju sebelum aba-aba start dibunyikan.',
    stroke: 'GENERAL'
  },
  {
    id: 'SW-5.2',
    ruleCode: 'SW 5.2',
    title: 'Gaya Bebas - Tidak Menyentuh Dinding Pembalikan',
    description: 'Bagian tubuh perenang tidak menyentuh dinding saat berputar balik atau finis.',
    stroke: 'FREESTYLE'
  },
  {
    id: 'SW-6.4',
    ruleCode: 'SW 6.4',
    title: 'Gaya Punggung - Putaran Balik Tidak Kontinu',
    description: 'Pembalikan tidak dilakukan secara kontinu setelah meninggalkan posisi telentang.',
    stroke: 'BACKSTROKE'
  },
  {
    id: 'SW-6.5',
    ruleCode: 'SW 6.5',
    title: 'Gaya Punggung - Finis Tidak Telentang',
    description: 'Perenang tidak menyentuh dinding finis dalam posisi telentang sesuai aturan.',
    stroke: 'BACKSTROKE'
  },
  {
    id: 'SW-7.2',
    ruleCode: 'SW 7.2',
    title: 'Gaya Dada - Siklus Kayuhan Tidak Simetris',
    description: 'Semua gerakan lengan dan kaki harus simultan dan sejajar pada bidang horizontal yang sama.',
    stroke: 'BREASTSTROKE'
  },
  {
    id: 'SW-7.6',
    ruleCode: 'SW 7.6',
    title: 'Gaya Dada - Sentuhan Finis/Balik Tidak Dua Tangan Bersamaan',
    description: 'Sentuhan pada setiap pembalikan dan finis harus dilakukan dengan kedua tangan secara bersamaan.',
    stroke: 'BREASTSTROKE'
  },
  {
    id: 'SW-8.3',
    ruleCode: 'SW 8.3',
    title: 'Gaya Kupu - Gerakan Kaki Tidak Simultan / Tendangan Dada',
    description: 'Gerakan kaki ke atas dan ke bawah tidak dilakukan secara simultan atau menggunakan tendangan gaya dada.',
    stroke: 'BUTTERFLY'
  },
  {
    id: 'SW-8.4',
    ruleCode: 'SW 8.4',
    title: 'Gaya Kupu - Sentuhan Finis/Balik Tidak Dua Tangan Bersamaan',
    description: 'Sentuhan pada setiap pembalikan dan finis harus dengan kedua belah tangan secara bersamaan di atas atau di bawah air.',
    stroke: 'BUTTERFLY'
  },
  {
    id: 'SW-9.1',
    ruleCode: 'SW 9.1',
    title: 'Gaya Ganti - Urutan Gaya Salah',
    description: 'Urutan gaya ganti perorangan harus Kupu-kupu, Punggung, Dada, Bebas.',
    stroke: 'INDIVIDUAL_MEDLEY'
  },
  {
    id: 'SW-10.2',
    ruleCode: 'SW 10.2',
    title: 'Keluar Jalur / Menarik Tali Lintasan',
    description: 'Perenang menarik tali lintasan atau berpindah ke lintasan lain yang mengganggu perenang lain.',
    stroke: 'GENERAL'
  },
];
