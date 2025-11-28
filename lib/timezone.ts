import { DateTime } from "luxon";

/**
 * Convert an ISO string (stored in UTC) to a Luxon DateTime
 * in the user's timezone.
 */
export function toUserZonedDateTime(iso: string, timeZone: string) {
  return DateTime.fromISO(iso, { zone: "utc" }).setZone(timeZone);
}

/**
 * Get the current time as an ISO string in the user's timezone.
 */
export function nowInUserTimeZone(timeZone: string) {
  return DateTime.now().setZone(timeZone).toISO();
}

/**
 * Get the start of the day (00:00) for a given ISO time,
 * in the user's timezone, returned as ISO.
 */
export function startOfDayInUserTimeZone(iso: string, timeZone: string) {
  return toUserZonedDateTime(iso, timeZone).startOf("day").toISO();
}
