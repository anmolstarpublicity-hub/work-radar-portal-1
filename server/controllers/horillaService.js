const axios = require('axios');

let token = '';

function extractToken(payload) {
  if (!payload || typeof payload !== 'object') return '';
  const candidates = [
    payload.access,
    payload.access_token,
    payload.token,
    payload.auth_token,
    payload.jwt,
    payload.key,
    payload?.tokens?.access,
    payload?.data?.access,
    payload?.data?.access_token,
    payload?.data?.token,
  ];
  return candidates.find(value => typeof value === 'string' && value.trim()) || '';
}

async function login() {
  const res = await axios.post(`${process.env.HORILLA_URL}/api/auth/login/`, {
    username: process.env.HORILLA_USERNAME,
    password: process.env.HORILLA_PASSWORD,
  }, { timeout: 20000 });
  const extractedToken = extractToken(res.data);
  if (!extractedToken) {
    throw new Error(`Horilla login succeeded but no token was returned. Response: ${JSON.stringify(res.data)}`);
  }
  token = extractedToken;
}

async function horillaGet(endpoint) {
  if (!token) await login();
  const url = String(endpoint || '').trim().startsWith('http')
    ? endpoint
    : `${process.env.HORILLA_URL}${endpoint}`;
  try {
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 20000,
    });
    return res.data;
  } catch (err) {
    // Token may have expired — retry once after re-login
    if (err.response?.status === 401) {
      await login();
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 20000,
      });
      return res.data;
    }
    throw err;
  }
}

function extractAttendanceRecords(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  const arrays = Object.values(payload).filter(value => Array.isArray(value));
  return arrays.length ? arrays.reduce((largest, current) => current.length > largest.length ? current : largest, arrays[0]) : [];
}

function resolveNextPageUrl(payload) {
  const next = getNestedValue(payload, 'next');
  if (!next || typeof next !== 'string') return null;
  const trimmed = next.trim();
  if (!trimmed) return null;
  return trimmed.startsWith('http') ? trimmed : `${process.env.HORILLA_URL}${trimmed}`;
}

async function getAttendance(date, employeeId = '', employeeName = '', stopOnMatch = false) {
  const query = [];
  if (date) query.push(`date=${encodeURIComponent(convertToHorillaDate(date))}`);
  if (employeeId) query.push(`employee_id=${encodeURIComponent(employeeId)}`);
  const initialEndpoint = `/api/integration/attendance/${query.length ? `?${query.join('&')}` : ''}`;

  const targetDate = date ? normalizeIsoDate(date) : null;
  let records = [];
  let nextUrl = initialEndpoint;
  const seen = new Set();
  let pageCount = 0;
  while (nextUrl && !seen.has(nextUrl) && pageCount < 100) {
    pageCount += 1;
    seen.add(nextUrl);

    const payload = await horillaGet(nextUrl);
    const pageRecords = extractAttendanceRecords(payload);
    records = records.concat(pageRecords);

    if (stopOnMatch && pageRecords.length && employeeId && targetDate) {
      const foundTargetDateMatch = pageRecords.some(record => {
        return recordDateMatches(record, date) && (isExactEmployeeMatch(record, employeeId, employeeName) || isLooseEmployeeMatch(record, employeeId, employeeName));
      });
      if (foundTargetDateMatch) break;
    }

    if (targetDate && pageRecords.length) {
      const pageDates = pageRecords
        .map(r => getRecordDate(r))
        .filter(Boolean)
        .sort();

      if (pageDates.length) {
        const maxDate = pageDates[pageDates.length - 1];
        const minDate = pageDates[0];

        // If the page only contains dates older than the target, we can stop.
        if (maxDate < targetDate) break;

        // If we've already reached the target date and the current page contains only target or older dates,
        // there is no need to fetch further pages.
        if (pageDates.some(d => d === targetDate) && minDate <= targetDate && maxDate <= targetDate) {
          break;
        }
      }
    }

    nextUrl = resolveNextPageUrl(payload);
  }

  return records;
}

function getRecordDate(record) {
  if (!record || typeof record !== 'object') return null;
  const keys = [
    'attendance_date',
    'date',
    'attendance_date__str',
    'attendance_date_str',
    'log_date',
    'record_date',
    'working_date',
    'attendance?.date',
    'attendance.date',
    'attendance_data.date',
    'attendance_data?.date',
  ];

  for (const key of keys) {
    const value = getNestedValue(record, key);
    const normalized = normalizeIsoDate(value);
    if (normalized) return normalized;
  }

  return null;
}

// Returns all attendance records (optionally filtered by date)
function pad(value) {
  return String(value).padStart(2, '0');
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isDdMmYyyy(value) {
  return /^\d{2}-\d{2}-\d{4}$/.test(value);
}

function convertToHorillaDate(value) {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (isDdMmYyyy(trimmed)) return trimmed;
  if (isIsoDate(trimmed)) {
    const [year, month, day] = trimmed.split('-');
    return `${day}-${month}-${year}`;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const day = pad(parsed.getDate());
    const month = pad(parsed.getMonth() + 1);
    const year = parsed.getFullYear();
    return `${day}-${month}-${year}`;
  }

  return trimmed;
}

function normalizeIsoDate(value) {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split('-');
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  return '';
}

// Returns punch in/out for a specific employee name on a date
function normalizeName(value) {
  return String(value || '').trim().toLowerCase();
}

function extractIdFromText(value) {
  if (!value) return '';
  const text = String(value);
  const match = text.match(/\(([A-Za-z0-9\-_.]+)\)/);
  return match ? match[1].trim().toLowerCase() : '';
}

function getNestedValue(record, key) {
  if (!record || !key) return null;
  const path = key.replace(/\?\./g, '.').split('.');
  let current = record;
  for (const part of path) {
    if (current == null) return null;
    current = current[part];
  }
  return current;
}

function isExactEmployeeMatch(record, employeeId, employeeName) {
  const normalizedId = normalizeName(employeeId);
  const normalizedName = normalizeName(employeeName);
  if (!normalizedId && !normalizedName) return false;

  const idKeys = [
    'employee_id',
    'employee?.id',
    'user?.id',
    'emp_id',
    'employee?.employee_id',
    'user?.employee_id',
    'employee?.emp_id',
    'user?.emp_id',
  ];

  if (normalizedId) {
    const idMatch = idKeys.some(key => {
      const rawValue = getNestedValue(record, key);
      const value = normalizeName(rawValue);
      return value && (value === normalizedId || extractIdFromText(rawValue) === normalizedId);
    });
    if (idMatch) return true;
  }

  if (!normalizedName) return false;

  const nameKeys = [
    'employee_name',
    'employee_name__str',
    'employee?.name',
    'employee?.full_name',
    'name',
    'employee?.employee_name',
    'employee?.display_name',
    'user?.name',
    'user?.full_name',
    'attendance_employee_name',
  ];

  return nameKeys.some(key => {
    const value = getNestedValue(record, key);
    return normalizeName(value) === normalizedName;
  });
}

function isLooseEmployeeMatch(record, employeeId, employeeName) {
  const normalizedId = normalizeName(employeeId);
  const normalizedName = normalizeName(employeeName);
  if (!normalizedId && !normalizedName) return false;

  const idKeys = [
    'employee_id',
    'employee?.id',
    'user?.id',
    'emp_id',
    'employee?.employee_id',
    'user?.employee_id',
    'employee?.emp_id',
    'user?.emp_id',
  ];

  if (normalizedId) {
    const idMatch = idKeys.some(key => {
      const value = normalizeName(getNestedValue(record, key));
      return value && (value.includes(normalizedId) || normalizedId.includes(value));
    });
    if (idMatch) return true;
  }

  if (!normalizedName) return false;

  const nameKeys = [
    'employee_name',
    'employee_name__str',
    'employee?.name',
    'employee?.full_name',
    'name',
    'employee?.employee_name',
    'employee?.display_name',
    'user?.name',
    'user?.full_name',
    'attendance_employee_name',
  ];

  return nameKeys.some(key => {
    const value = normalizeName(getNestedValue(record, key));
    return value && (value.includes(normalizedName) || normalizedName.includes(value));
  });
}

function recordDateMatches(record, date) {
  const targetDate = normalizeIsoDate(date);
  if (!targetDate) return false;

  const keys = [
    'attendance_date',
    'date',
    'attendance_date__str',
    'attendance_date_str',
    'log_date',
    'record_date',
    'working_date',
    'attendance?.date',
    'attendance.date',
    'attendance_data.date',
    'attendance_data?.date',
  ];

  for (const key of keys) {
    const value = getNestedValue(record, key);
    const normalized = normalizeIsoDate(value);
    if (normalized && normalized === targetDate) return true;
  }

  return false;
}

function getAttendanceValue(record, keys) {
  for (const key of keys) {
    const value = getNestedValue(record, key);
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return null;
}

function parseTimeValue(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (/^\d{2}:\d{2}(?::\d{2})?$/.test(text)) {
    const [hours, minutes, seconds = '00'] = text.split(':');
    const date = new Date();
    date.setHours(Number(hours), Number(minutes), Number(seconds), 0);
    return date;
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getBestPunchTime(records, keys, compareFn) {
  let best = null;
  for (const record of records) {
    for (const key of keys) {
      const value = getNestedValue(record, key);
      if (value === undefined || value === null || value === '') continue;
      const parsed = parseTimeValue(value);
      if (!parsed) continue;
      if (!best || compareFn(parsed, best)) {
        best = parsed;
      }
    }
  }
  return best ? best.toTimeString().split(' ')[0] : null;
}

async function getPunchData({ employeeId, employeeName }, date) {
  // Use Horilla's date query and employee filter first, but fall back to local filtering if necessary.
  const all = await getAttendance(date, employeeId, employeeName, true);
  const records = extractAttendanceRecords(all);

  console.log(`[Horilla] getPunchData for "${employeeName}" (${employeeId}) on ${date}: ${records.length} records fetched`);
  if (records.length > 0) {
    console.log(`[Horilla] Sample record keys:`, Object.keys(records[0]));
    console.log(`[Horilla] Sample record:`, JSON.stringify(records[0], null, 2).slice(0, 800));
  }

  const exactEmployeeMatches = records.filter(r => isExactEmployeeMatch(r, employeeId, employeeName));
  const looseEmployeeMatches = records.filter(r => isLooseEmployeeMatch(r, employeeId, employeeName));
  const exactMatches = exactEmployeeMatches.filter(r => recordDateMatches(r, date));
  const looseMatches = looseEmployeeMatches.filter(r => recordDateMatches(r, date));
  const matchRecords = exactMatches.length ? exactMatches : looseMatches;

  console.log(`[Horilla] exactMatches=${exactMatches.length} looseMatches=${looseMatches.length} used=${matchRecords.length}`);

  if (!matchRecords.length) return { punchIn: null, punchOut: null };

  const punchIn = getBestPunchTime(matchRecords, ['attendance_clock_in', 'punch_in', 'clock_in', 'check_in', 'in_time', 'attendance_in', 'attendance_data?.in_time', 'attendance_data.in_time', 'time_in', 'checkin', 'checkin_time'], (a, b) => a < b);
  const punchOut = getBestPunchTime(matchRecords, ['attendance_clock_out', 'punch_out', 'clock_out', 'check_out', 'out_time', 'attendance_out', 'attendance_data?.out_time', 'attendance_data.out_time', 'time_out', 'checkout', 'checkout_time'], (a, b) => a > b);

  console.log(`[Horilla] punchIn=${punchIn} punchOut=${punchOut}`);

  return { punchIn, punchOut };
}

module.exports = { getAttendance, getPunchData };
