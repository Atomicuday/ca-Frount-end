/**
 * Time-based greeting helper for CA Dashboard
 *
 * Rules:
 * - 00:00–11:59: “Hi, good morning, [Name]”
 * - 12:00–16:59: “Hi, good afternoon, [Name]”
 * - 17:00–23:59: “Hi, good evening, [Name]”
 *
 * Uses browser-local time and logged-in user name.
 */

export function getTimePeriod(date = new Date()) {
  const hours = date.getHours();
  if (hours >= 0 && hours < 12) {
    return 'good morning';
  }
  if (hours >= 12 && hours < 17) {
    return 'good afternoon';
  }
  return 'good evening';
}

export function getTimeBasedGreeting(date = new Date(), rawName = '') {
  const period = getTimePeriod(date);
  const cleanName = (rawName || '').trim() || 'Practitioner';
  return `Hi, ${period}, ${cleanName}`;
}
