export function formatActiveDuration(days: number) {
  const safeDays = Number.isFinite(days) ? Math.max(0, days) : 0;

  if (safeDays < 30) {
    const roundedDays = Math.round(safeDays);
    const label = roundedDays === 1 ? "day" : "days";
    return `${roundedDays} ${label}`;
  }

  if (safeDays < 365) {
    const months = Number((safeDays / 30).toFixed(1));
    const label = months === 1 ? "month" : "months";
    return `${months} ${label}`;
  }

  const years = Number((safeDays / 365).toFixed(1));
  const label = years === 1 ? "year" : "years";
  return `${years} ${label}`;
}
