const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const supabaseFetch = async (endpoint) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
  return res.json();
};

// Get all activity logs for an employee on a specific date
const getActivityLogs = async (employeeName, date) => {
  return supabaseFetch(
    `activity_logs?employee_name=eq.${encodeURIComponent(employeeName)}&date=eq.${date}&order=timestamp.asc`
  );
};

// Get PC start time = earliest timestamp for employee on that date
const getPCStartTime = async (employeeName, date) => {
  const logs = await supabaseFetch(
    `activity_logs?employee_name=eq.${encodeURIComponent(employeeName)}&date=eq.${date}&order=timestamp.asc&limit=1`
  );
  return logs.length > 0 ? logs[0].timestamp : null;
};

// Get PC shutdown time = latest timestamp for employee on that date
const getPCShutdownTime = async (employeeName, date) => {
  const logs = await supabaseFetch(
    `activity_logs?employee_name=eq.${encodeURIComponent(employeeName)}&date=eq.${date}&order=timestamp.desc&limit=1`
  );
  return logs.length > 0 ? logs[0].timestamp : null;
};

// Get total app usage summary for an employee on a date
const getAppUsageSummary = async (employeeName, date) => {
  const logs = await supabaseFetch(
    `activity_logs?employee_name=eq.${encodeURIComponent(employeeName)}&date=eq.${date}&order=duration.desc`
  );
  const totalDuration = logs.reduce((sum, log) => sum + (log.duration || 0), 0);
  return { logs, totalDuration };
};

// Get count of distinct dates PC was started for a month
const getPCDaysForMonth = async (employeeName, year, month) => {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(Date.UTC(parseInt(year), parseInt(month), 0)).toISOString().split('T')[0];
  const logs = await supabaseFetch(
    `activity_logs?employee_name=eq.${encodeURIComponent(employeeName)}&date=gte.${startDate}&date=lte.${endDate}&select=date`
  );
  const uniqueDates = new Set(logs.map(l => l.date));
  return uniqueDates.size;
};

module.exports = { getActivityLogs, getPCStartTime, getPCShutdownTime, getAppUsageSummary, getPCDaysForMonth };
