// UniFold Pure Frontend Data Service
// Zero Backend Required: Powered by pre-extracted Google Drive resources,
// university timetable schedules for 500+ batches, and 42 campus societies.

import subjectsData from '../data/subjects.json';
import societiesData from '../data/societies.json';
import statsData from '../data/stats.json';
import timetableHierarchyData from '../data/timetableHierarchy.json';

export const API_BASE = '';

// In-memory cache for the full timetable dataset (loaded on demand)
let cachedTimetable = null;
let batchLookupMap = null;

async function loadTimetableDataset() {
  if (cachedTimetable) return cachedTimetable;
  try {
    const mod = await import('../data/timetable.json');
    cachedTimetable = mod.default || mod;

    // Build fast lookup index
    batchLookupMap = new Map();
    for (const [year, branches] of Object.entries(cachedTimetable)) {
      for (const [branch, batches] of Object.entries(branches)) {
        for (const [code, days] of Object.entries(batches)) {
          batchLookupMap.set(code.toUpperCase(), {
            code,
            year,
            branch,
            days,
            ...days,
            schedule: days,
          });
        }
      }
    }
    return cachedTimetable;
  } catch (err) {
    console.error('Failed to load timetable dataset:', err);
    return {};
  }
}

/**
 * Resolves a file or download URL directly to Google Drive preview or download.
 */
export function resolveFileUrl(url) {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return url;
}

/**
 * 1. Health check - Always operational in pure frontend mode!
 */
export async function checkBackendHealth() {
  return {
    status: 'ok',
    mode: 'frontend-only',
    message: 'UniFold Campus OS running in pure frontend mode with direct Google Drive integration.',
  };
}

/**
 * 2. Campus Stats
 */
export async function getStats() {
  return statsData;
}

/**
 * 3. Academic Subjects
 */
export async function getSubjects(params = {}) {
  let list = subjectsData.map((s) => ({
    ...s,
    total_resources: s.totalResources ?? s.total_resources ?? 0,
    pdf_count: s.pdfCount ?? s.pdf_count ?? 0,
    ppt_count: s.pptCount ?? s.ppt_count ?? 0,
    notes_count: s.notesCount ?? s.notes_count ?? 0,
    other_count: s.otherCount ?? s.other_count ?? 0,
  }));

  if (params.year && params.year !== 'ALL') {
    list = list.filter((s) => String(s.year) === String(params.year));
  }

  if (params.semester) {
    list = list.filter((s) => String(s.semester) === String(params.semester));
  }

  if (params.branch && params.branch !== 'ALL') {
    list = list.filter(
      (s) => s.branch === 'ALL' || s.branch.toLowerCase() === params.branch.toLowerCase()
    );
  }

  if (params.q) {
    const q = params.q.toLowerCase().trim();
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.code && s.code.toLowerCase().includes(q)) ||
        (s.branch && s.branch.toLowerCase().includes(q))
    );
  }

  return list;
}

/**
 * 4. Single Subject Details with categorized Google Drive resources
 */
export async function getSubjectDetails(subjectId) {
  const found = subjectsData.find((s) => String(s.id) === String(subjectId));
  if (!found) {
    throw new Error(`Subject ID ${subjectId} not found`);
  }

  function normalizeResource(r) {
    return {
      ...r,
      size_bytes: r.sizeBytes ?? r.size_bytes ?? 0,
      url: r.previewUrl || r.preview_url || `https://drive.google.com/file/d/${r.driveId || r.drive_id}/preview`,
      preview_url: r.previewUrl || r.preview_url || `https://drive.google.com/file/d/${r.driveId || r.drive_id}/preview`,
      download_url: r.downloadUrl || r.download_url || `https://drive.google.com/uc?export=download&id=${r.driveId || r.drive_id}`,
    };
  }

  return {
    ...found,
    total_resources: found.totalResources ?? found.total_resources ?? 0,
    pdf_count: found.pdfCount ?? found.pdf_count ?? 0,
    ppt_count: found.pptCount ?? found.ppt_count ?? 0,
    notes_count: found.notesCount ?? found.notes_count ?? 0,
    resources: {
      pdf: (found.resources?.pdf || []).map(normalizeResource),
      ppt: (found.resources?.ppt || []).map(normalizeResource),
      notes: (found.resources?.notes || []).map(normalizeResource),
      other: (found.resources?.other || []).map(normalizeResource),
    },
  };
}

/**
 * 5. All Resources Flattened
 */
export async function getResources(params = {}) {
  let allResources = [];
  subjectsData.forEach((s) => {
    ['pdf', 'ppt', 'notes', 'other'].forEach((cat) => {
      (s.resources?.[cat] || []).forEach((r) => {
        allResources.push({
          ...r,
          subjectId: s.id,
          subjectName: s.name,
          subjectCode: s.code,
          year: s.year,
          branch: s.branch,
          url: r.previewUrl,
          preview_url: r.previewUrl,
          download_url: r.downloadUrl,
          size_bytes: r.sizeBytes,
        });
      });
    });
  });

  if (params.year && params.year !== 'ALL') {
    allResources = allResources.filter((r) => String(r.year) === String(params.year));
  }
  if (params.type && params.type !== 'ALL') {
    allResources = allResources.filter((r) => r.type === params.type);
  }
  if (params.q) {
    const q = params.q.toLowerCase().trim();
    allResources = allResources.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.subjectName.toLowerCase().includes(q) ||
        (r.subjectCode && r.subjectCode.toLowerCase().includes(q))
    );
  }

  return allResources;
}

/**
 * 6. Campus Societies
 */
export async function getSocieties(params = {}) {
  let list = [...societiesData];
  if (params.category && params.category !== 'ALL') {
    list = list.filter((s) => s.category === params.category);
  }
  if (params.q) {
    const q = params.q.toLowerCase().trim();
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.shortName && s.shortName.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
    );
  }
  return list;
}

/**
 * 7. Timetable Hierarchy (Years & Branches)
 */
export async function getTimetableHierarchy() {
  return timetableHierarchyData;
}

/**
 * 8. Timetable Batches List
 */
export async function getTimetableBatches(year, branch) {
  let results = [];
  for (const y of timetableHierarchyData) {
    if (year && y.year.toLowerCase() !== year.toLowerCase() && !y.year.startsWith(year)) {
      continue;
    }
    for (const b of y.branches) {
      if (branch && b.branch.toLowerCase() !== branch.toLowerCase()) {
        continue;
      }
      results.push(...b.batches.map((code) => ({ code, year: y.year, branch: b.branch })));
    }
  }
  return results;
}

/**
 * 9. Timetable Batch Lookup
 */
export async function getTimetableBatch(batchCode) {
  if (!batchCode) return null;
  await loadTimetableDataset();

  const code = batchCode.trim().toUpperCase();
  if (batchLookupMap && batchLookupMap.has(code)) {
    return batchLookupMap.get(code);
  }

  // Fallback search
  if (cachedTimetable) {
    for (const [year, branches] of Object.entries(cachedTimetable)) {
      for (const [branch, batches] of Object.entries(branches)) {
        for (const [c, days] of Object.entries(batches)) {
          if (c.toUpperCase() === code) {
            const entry = {
              code: c,
              year,
              branch,
              days,
              ...days,
              schedule: days,
            };
            batchLookupMap?.set(code, entry);
            return entry;
          }
        }
      }
    }
  }

  return null;
}

/**
 * 10. Full Timetable Data
 */
export async function getFullTimetableData(year) {
  const data = await loadTimetableDataset();
  if (!year) return data;
  const yrKey = Object.keys(data).find(
    (y) => y.toLowerCase() === year.toLowerCase() || y.startsWith(year)
  );
  return yrKey ? { [yrKey]: data[yrKey] } : {};
}

/**
 * 11. Client-Side iCalendar (.ics) Generator & Instant Download
 * Allows students to export their batch schedule directly to Apple Calendar, Google Calendar, or Outlook.
 */
export async function exportBatchCalendarIcs(batchCode, weeks = 18) {
  const batch = await getTimetableBatch(batchCode);
  if (!batch || !batch.days) {
    throw new Error(`Schedule for batch ${batchCode} not found`);
  }

  const DAY_OFFSETS = {
    MONDAY: { offset: 0, byDay: 'MO' },
    TUESDAY: { offset: 1, byDay: 'TU' },
    WEDNESDAY: { offset: 2, byDay: 'WE' },
    THURSDAY: { offset: 3, byDay: 'TH' },
    FRIDAY: { offset: 4, byDay: 'FR' },
    SATURDAY: { offset: 5, byDay: 'SA' },
    SUNDAY: { offset: 6, byDay: 'SU' },
  };

  function timeToMinutes(t) {
    if (!t) return 0;
    const m = String(t).match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!m) return 0;
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const ap = (m[3] || '').toUpperCase();
    if (ap === 'PM' && h !== 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    return h * 60 + min;
  }

  function escapeIcs(str) {
    if (!str) return '';
    return String(str)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  }

  function formatIcsDateTime(d) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  const now = new Date();
  const nowDay = now.getDay();
  const diffToMon = nowDay === 0 ? -6 : 1 - nowDay;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMon);
  const untilDate = new Date(monday.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const untilStr = `${untilDate.getUTCFullYear()}${pad(untilDate.getUTCMonth() + 1)}${pad(untilDate.getUTCDate())}T235959Z`;
  const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//University Resource Hub//Campus Timetable//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Timetable - Batch ${batch.code}`,
    'X-WR-TIMEZONE:Asia/Kolkata',
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Kolkata',
    'X-LIC-LOCATION:Asia/Kolkata',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0530',
    'TZOFFSETTO:+0530',
    'TZNAME:IST',
    'DTSTART:19700101T000000',
    'END:STANDARD',
    'END:VTIMEZONE',
  ];

  let eventIdx = 0;
  for (const [dayName, sessionList] of Object.entries(batch.days)) {
    const normDay = dayName.trim().toUpperCase();
    const dayConfig = DAY_OFFSETS[normDay];
    if (!dayConfig || !Array.isArray(sessionList)) continue;

    const eventDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + dayConfig.offset);

    for (const session of sessionList) {
      eventIdx++;
      const startMin = timeToMinutes(session.time);
      const endMin = startMin + 50;

      const startH = Math.floor(startMin / 60);
      const startM = startMin % 60;
      const endH = Math.floor(endMin / 60);
      const endM = endMin % 60;

      const startDate = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), startH, startM, 0);
      const endDate = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), endH, endM, 0);

      const dtstart = formatIcsDateTime(startDate);
      const dtend = formatIcsDateTime(endDate);

      const summary = `${session.code ? session.code + ' - ' : ''}${session.name || session.subject || 'Class'} (${session.type || 'Session'})`;
      const room = session.room || 'TBD';
      const description = `Batch: ${batch.code}\\nCourse: ${session.name || session.subject || ''}\\nCode: ${session.code || ''}\\nType: ${session.type || 'Session'}\\nRoom: ${room}\\nTime: ${session.time}\\nCampus Timetable - University Resource Hub`;
      const uid = `tt-${batch.code}-${normDay}-${startH}${startM}-${eventIdx}@campus-resource-hub`;

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${dtstamp}`);
      lines.push(`DTSTART;TZID=Asia/Kolkata:${dtstart}`);
      lines.push(`DTEND;TZID=Asia/Kolkata:${dtend}`);
      lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${dayConfig.byDay};UNTIL=${untilStr}`);
      lines.push(`SUMMARY:${escapeIcs(summary)}`);
      lines.push(`LOCATION:${escapeIcs(room)}`);
      lines.push(`DESCRIPTION:${escapeIcs(description)}`);
      lines.push('STATUS:CONFIRMED');
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push(`DESCRIPTION:Class reminder: ${escapeIcs(session.name || session.subject || 'Class')}`);
      lines.push('TRIGGER:-PT15M');
      lines.push('END:VALARM');
      lines.push('END:VEVENT');
    }
  }

  lines.push('END:VCALENDAR');
  const icsContent = lines.join('\r\n');

  // Trigger client-side file download
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `${batch.code}-timetable.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);

  return true;
}

/**
 * 12. Client-Side Authentication (Student preview & Admin demo)
 */
export async function loginUser(id, _password) {
  const normId = (id || '').trim().toLowerCase();
  const isAdmin = normId === 'admin' || normId === 'admin@campus.edu';
  return {
    success: true,
    user: {
      id: isAdmin ? 'Administrator' : id || 'student@campus.edu',
      role: isAdmin ? 'admin' : 'student',
      name: isAdmin ? 'Administrator' : 'John Doe',
      department: 'Computer Science & Engineering',
      year: 3,
    },
  };
}

/**
 * 13. Unified Global Search
 */
export async function searchAll(query) {
  if (!query || query.trim().length < 2) return { subjects: [], societies: [], batches: [] };
  const q = query.toLowerCase().trim();

  const subjects = subjectsData.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      (s.code && s.code.toLowerCase().includes(q)) ||
      (s.branch && s.branch.toLowerCase().includes(q))
  ).slice(0, 8);

  const societies = societiesData.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      (s.shortName && s.shortName.toLowerCase().includes(q)) ||
      (s.category && s.category.toLowerCase().includes(q)) ||
      (s.description && s.description.toLowerCase().includes(q))
  ).slice(0, 8);

  await loadTimetableDataset();
  const batches = [];
  if (batchLookupMap) {
    for (const [code, info] of batchLookupMap.entries()) {
      if (code.includes(q.toUpperCase())) {
        batches.push({ code: info.code, year: info.year, branch: info.branch });
        if (batches.length >= 8) break;
      }
    }
  }

  return { subjects, societies, batches };
}
