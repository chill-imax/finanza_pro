export const generateGoogleCalendarUrl = (title: string, details: string, date?: string): string => {
  const baseUrl = "https://calendar.google.com/calendar/render";
  const action = "TEMPLATE";
  
  // Format date for Google Calendar (YYYYMMDD)
  // If no date provided, default to tomorrow
  const targetDate = date ? new Date(date) : new Date(Date.now() + 86400000);
  
  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getDate()).padStart(2, '0');
  
  const dateStr = `${yyyy}${mm}${dd}`;
  const dates = `${dateStr}/${dateStr}`; // All day event

  const params = new URLSearchParams({
    action,
    text: `FinanzaPro: ${title}`,
    details: details,
    dates: dates,
  });

  return `${baseUrl}?${params.toString()}`;
};