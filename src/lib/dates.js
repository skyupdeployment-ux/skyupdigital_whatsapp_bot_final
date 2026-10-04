/**
 * dates.js — in-WhatsApp demo date & time slot options.
 *
 * Replaces the old web calendar. The bot shows the next 7 days as list
 * rows, with a "Next 7 days" row to page forward (and "Earlier dates" to
 * page back). Pagination is stateless — the next offset is encoded in the
 * row id (e.g. demo_more_7), so no extra session field is needed.
 *
 * All day math is anchored to IST (Asia/Kolkata) so "Today"/"Tomorrow" are
 * correct even though the server runs in UTC.
 */

const TZ = 'Asia/Kolkata';

const PAGE_SIZE = 7;    // days shown per page
const MAX_DAYS  = 28;   // how far ahead a customer may book

// ── Time slots offered (business hours, IST) ────────────────────────
const TIME_SLOTS = [
  { key: '1000', label: '10:00 AM' },
  { key: '1100', label: '11:00 AM' },
  { key: '1200', label: '12:00 PM' },
  { key: '1400', label: '02:00 PM' },
  { key: '1500', label: '03:00 PM' },
  { key: '1600', label: '04:00 PM' },
  { key: '1700', label: '05:00 PM' },
  { key: '1800', label: '06:00 PM' },
];

// Today's date in IST as 'YYYY-MM-DD'.
function istTodayYMD() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  });
  return fmt.format(new Date());
}

// Parse 'YYYY-MM-DD' to a UTC-midnight Date (stable, server-TZ independent).
function ymdToUTC(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

// Build one date option from an absolute day index (0 = today IST).
function dateOptionFromIndex(dayIndex) {
  const base = ymdToUTC(istTodayYMD());
  const dt = new Date(base.getTime() + dayIndex * 86400000);
  const ymd = dt.toISOString().slice(0, 10);

  const weekdayShort = dt.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
  const weekdayLong  = dt.toLocaleDateString('en-US', { weekday: 'long',  timeZone: 'UTC' });
  const dayMon       = dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' }); // "06 Oct"

  let prefix = '';
  if (dayIndex === 0) prefix = 'Today · ';
  else if (dayIndex === 1) prefix = 'Tomorrow · ';

  return {
    id:      `demo_date_${ymd}`,
    ymd,
    title:   `${prefix}${weekdayShort} ${dayMon}`.slice(0, 24), // WhatsApp row title max 24
    desc:    weekdayLong,
    human:   `${weekdayLong}, ${dayMon}`,   // e.g. "Tuesday, 06 Oct"
  };
}

/**
 * buildDateSections(offset) → { sections, options }
 * `sections` is ready to pass to sendList; `options` is the raw list.
 */
function buildDateSections(offset = 0) {
  const start = Math.max(0, Math.min(offset, MAX_DAYS - 1));
  const options = [];
  for (let i = 0; i < PAGE_SIZE; i++) {
    const dayIndex = start + i;
    if (dayIndex >= MAX_DAYS) break;
    options.push(dateOptionFromIndex(dayIndex));
  }

  const dateRows = options.map((o) => ({
    id: o.id, title: o.title, description: o.desc,
  }));

  const navRows = [];
  if (start > 0) {
    navRows.push({
      id: `demo_back_${Math.max(0, start - PAGE_SIZE)}`,
      title: '⬅️ Earlier dates',
    });
  }
  if (start + PAGE_SIZE < MAX_DAYS) {
    navRows.push({
      id: `demo_more_${start + PAGE_SIZE}`,
      title: '➡️ Next 7 days',
      description: 'See more dates',
    });
  }

  const sections = [{ title: 'Available dates', rows: dateRows }];
  if (navRows.length) sections.push({ title: 'More', rows: navRows });

  return { sections, options };
}

// Time-slot list sections (with a "change date" escape row).
function buildTimeSections() {
  const rows = TIME_SLOTS.map((s) => ({ id: `demo_time_${s.key}`, title: s.label }));
  return [
    { title: 'Available time slots', rows },
    { title: 'More', rows: [{ id: 'demo_change_date', title: '⬅️ Change date' }] },
  ];
}

// Look up a date option by its 'YYYY-MM-DD' for the human label on confirm.
function humanDateFromYMD(ymd) {
  try {
    const dt = ymdToUTC(ymd);
    const weekdayLong = dt.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
    const dayMon      = dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
    return `${weekdayLong}, ${dayMon}`;
  } catch {
    return ymd;
  }
}

function labelFromTimeKey(key) {
  const slot = TIME_SLOTS.find((s) => s.key === key);
  return slot ? slot.label : key;
}

module.exports = {
  PAGE_SIZE,
  MAX_DAYS,
  TIME_SLOTS,
  buildDateSections,
  buildTimeSections,
  humanDateFromYMD,
  labelFromTimeKey,
};
