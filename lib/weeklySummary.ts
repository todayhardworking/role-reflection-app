export interface WeeklySummary {
  weekId: string;
  summary: string;
  wins: string[];
  challenges: string[];
  nextWeek: string[];
  createdAt: string;
}

export interface WeeklyAnalysis {
  weekId: string;
  summary: string;
  createdAt: string;
}

export interface WeeklyReflection {
  id: string;
  text: string;
  createdAt: string;
  rolesInvolved: string[];
  title?: string;
}

function toLocalDate(date = new Date(), timeZone = "Asia/Kuala_Lumpur") {
  const localizedString = date.toLocaleString("en-US", { timeZone });
  return new Date(localizedString);
}

export function getWeekCompletionInfo(
  weekId: string,
  options?: { timeZone?: string; currentDate?: Date },
): { weekEnd: Date; isComplete: boolean } {
  const timeZone = options?.timeZone ?? "Asia/Kuala_Lumpur";
  const currentDate = options?.currentDate ?? new Date();
  const { inclusiveEnd: weekEnd } = getWeekRangeFromWeekId(weekId, timeZone);
  const now = toLocalDate(currentDate, timeZone);

  return {
    weekEnd,
    isComplete: now.getTime() >= weekEnd.getTime(),
  };
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

export function getWeekRangeFromWeekId(weekId: string, timeZone = "Asia/Kuala_Lumpur") {
  const match = /^([0-9]{4})-W([0-9]{2})$/.exec(weekId);

  if (!match) {
    throw new Error(`Invalid weekId: ${weekId}`);
  }

  const [, yearString, weekString] = match;
  const year = Number.parseInt(yearString, 10);
  const weekNumber = Number.parseInt(weekString, 10);

  const januaryFourth = new Date(Date.UTC(year, 0, 4));
  const januaryFourthDay = januaryFourth.getUTCDay() || 7;
  const weekStart = new Date(januaryFourth);
  weekStart.setUTCDate(januaryFourth.getUTCDate() - (januaryFourthDay - 1) + (weekNumber - 1) * 7);

  const start = toLocalDate(weekStart, timeZone);
  start.setHours(0, 0, 0, 0);

  const endExclusive = new Date(start);
  endExclusive.setDate(start.getDate() + 7);
  endExclusive.setHours(0, 0, 0, 0);

  const inclusiveEnd = new Date(endExclusive);
  inclusiveEnd.setDate(inclusiveEnd.getDate() - 1);
  inclusiveEnd.setHours(23, 59, 59, 999);

  return { start, endExclusive, inclusiveEnd };
}

export function getWeekIdFromDate(dateInput: string | Date, timeZone = "Asia/Kuala_Lumpur") {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return getCurrentWeekId(date, timeZone);
}

export function formatWeekLabelFromWeekId(weekId: string, timeZone = "Asia/Kuala_Lumpur") {
  const { start, inclusiveEnd } = getWeekRangeFromWeekId(weekId, timeZone);
  const weekNumber = weekId.split("-W")[1] ?? "";

  const startMonth = start.toLocaleString(undefined, { month: "short" });
  const endMonth = inclusiveEnd.toLocaleString(undefined, { month: "short" });

  const startLabel = `${start.getDate()}${startMonth !== endMonth ? ` ${startMonth}` : ""}`;
  const endLabel = `${inclusiveEnd.getDate()} ${endMonth}`;

  const rangeLabel = startMonth === endMonth ? `${start.getDate()}–${inclusiveEnd.getDate()} ${endMonth}` : `${startLabel}–${endLabel}`;

  return `Week ${Number.parseInt(weekNumber, 10)} (${rangeLabel})`;
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
