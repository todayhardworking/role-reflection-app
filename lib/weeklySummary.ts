export interface WeeklySummary {
  weekId: string;
  summary: string;
  wins: string[];
  challenges: string[];
  nextWeek: string[];
  createdAt: string;
}

function toLocalDate(date = new Date(), timeZone = "Asia/Kuala_Lumpur") {
  const localizedString = date.toLocaleString("en-US", { timeZone });
  return new Date(localizedString);
}

export function getCurrentWeekId(date = new Date(), timeZone = "Asia/Kuala_Lumpur") {
  const localDate = toLocalDate(date, timeZone);
  const target = new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const paddedWeek = weekNumber.toString().padStart(2, "0");
  return `${target.getUTCFullYear()}-W${paddedWeek}`;
}

export function getCurrentWeekRange(date = new Date(), timeZone = "Asia/Kuala_Lumpur") {
  const localDate = toLocalDate(date, timeZone);
  const dayOfWeek = localDate.getDay();
  const daysFromMonday = (dayOfWeek + 6) % 7;

  const start = new Date(localDate);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - daysFromMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function formatWeekLabel(date = new Date(), timeZone = "Asia/Kuala_Lumpur") {
  const { start, end } = getCurrentWeekRange(date, timeZone);

  const formatOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };

  const startLabel = start.toLocaleDateString(undefined, formatOptions);
  const endLabel = end.toLocaleDateString(undefined, formatOptions);

  return `Week of ${startLabel} – ${endLabel}`;
}
