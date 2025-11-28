import { DateTime } from "luxon";

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
  return toDateTime(dateInput, timeZone).toJSDate();
}

export function formatMonth(dateInput: string | Date, timeZone = DEFAULT_TIME_ZONE) {
  return toDateTime(dateInput, timeZone).toFormat("yyyy-MM");
}

export function weekBelongsToMonth(weekStartISO: string, timeZone: string, targetMonth: string) {
  return formatMonth(weekStartISO, timeZone) === targetMonth;
}

export function startOfWeekInTZ(dateInput: string | Date = new Date(), timeZone = DEFAULT_TIME_ZONE) {
  const start = toDateTime(dateInput, timeZone).set({ weekday: 1 }).startOf("day");
  return start.toUTC().toJSDate();
}

export function startOfMonthInTZ(dateInput: string | Date = new Date(), timeZone = DEFAULT_TIME_ZONE) {
  const start = toDateTime(dateInput, timeZone).startOf("month");
  return start.toUTC().toJSDate();
}

function toDateTime(dateInput: string | Date | number, timeZone = DEFAULT_TIME_ZONE) {
  if (typeof dateInput === "string") {
    return DateTime.fromISO(dateInput, { zone: "utc" }).setZone(timeZone);
  }

  if (typeof dateInput === "number") {
    return DateTime.fromMillis(dateInput, { zone: "utc" }).setZone(timeZone);
  }

  return DateTime.fromJSDate(dateInput, { zone: "utc" }).setZone(timeZone);
}
