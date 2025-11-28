import { DateTime } from "luxon";

/**
 * Convert a UTC ISO timestamp to the user's timezone.
 */
export function toUserZonedDateTime(iso: string, timeZone: string) {
  return DateTime.fromISO(iso, { zone: "utc" }).setZone(timeZone);
}

/**
 * Get the current time in the user's timezone as ISO.
 */
export function nowInUserTimeZone(timeZone: string) {
  return DateTime.now().setZone(timeZone).toISO();
}

/**
 * Get the start of day (00:00) for a given ISO in the user's timezone.
 */
export function startOfDayInUserTimeZone(iso: string, timeZone: string) {
  return toUserZonedDateTime(iso, timeZone).startOf("day").toISO();
}
