const dateTime = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});
const shortDateTime = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/** "Tue, 6 Oct, 11:00 am" */
export function formatVisit(iso: string) {
  return dateTime.format(new Date(iso));
}

/** "6 Oct, 11:00 am" */
export function formatWhen(iso: string) {
  return shortDateTime.format(new Date(iso));
}
