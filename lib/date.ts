export function formatSmartTimestamp(value?: string) {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const isToday = now.toDateString() === date.toDateString();
  if (isToday) {
    if (diffMinutes < 60) {
      return `${diffMinutes || 1} minute${diffMinutes === 1 ? "" : "s"} ago`;
    }
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  if (diffDays < 7) {
    const dayName = date.toLocaleDateString(undefined, { weekday: "long" });
    return `${dayName} — ${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
