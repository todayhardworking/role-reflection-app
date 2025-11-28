import { startOfMonth, startOfWeek } from "date-fns";
import { format, utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";

export const DEFAULT_TIME_ZONE = "UTC";

function getAdminDb() {
  return import("@/lib/firebaseAdmin").then((mod) => mod.adminDb);
}

export async function getUserTimezone(uid: string): Promise<string> {
  const adminDb = await getAdminDb();
  const doc = await adminDb.collection("users").doc(uid).get();
  const data = doc.data() as { timezone?: unknown } | undefined;
  const timezone = typeof data?.timezone === "string" && data.timezone ? data.timezone : DEFAULT_TIME_ZONE;
  return timezone;
}

export async function ensureUserTimezone(uid: string, timezoneGuess?: string): Promise<string> {
  const adminDb = await getAdminDb();
  const docRef = adminDb.collection("users").doc(uid);
  const snapshot = await docRef.get();
  const data = snapshot.data() as { timezone?: unknown } | undefined;

  const fallbackTimezone = timezoneGuess || (typeof Intl !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : undefined);
  const timezone = typeof data?.timezone === "string" && data.timezone ? data.timezone : fallbackTimezone || DEFAULT_TIME_ZONE;

  if (!data?.timezone) {
    await docRef.set({ timezone }, { merge: true });
  }

  return timezone;
}

export function toUserZonedDate(dateInput: string | Date | number, timeZone = DEFAULT_TIME_ZONE) {
  const date = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  return utcToZonedTime(date, timeZone);
}

export function formatMonth(dateInput: string | Date, timeZone = DEFAULT_TIME_ZONE) {
  const zonedDate = toUserZonedDate(dateInput, timeZone);
  return format(zonedDate, "yyyy-MM", { timeZone });
}

export function weekBelongsToMonth(weekStartISO: string, timeZone: string, targetMonth: string) {
  return formatMonth(weekStartISO, timeZone) === targetMonth;
}

export function startOfWeekInTZ(dateInput: string | Date = new Date(), timeZone = DEFAULT_TIME_ZONE) {
  const zonedDate = toUserZonedDate(dateInput, timeZone);
  const start = startOfWeek(zonedDate, { weekStartsOn: 1 });
  return zonedTimeToUtc(start, timeZone);
}

export function startOfMonthInTZ(dateInput: string | Date = new Date(), timeZone = DEFAULT_TIME_ZONE) {
  const zonedDate = toUserZonedDate(dateInput, timeZone);
  const start = startOfMonth(zonedDate);
  return zonedTimeToUtc(start, timeZone);
}
