/** A short, readable moment: just the time today, the date too otherwise. */
export function formatMoment(
  date: Date,
  now = new Date(),
  locale?: string,
): string {
  const isToday = date.toDateString() === now.toDateString();
  const time: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  };
  const options: Intl.DateTimeFormatOptions = isToday
    ? time
    : { day: 'numeric', month: 'short', ...time };
  return date.toLocaleString(locale, options);
}
