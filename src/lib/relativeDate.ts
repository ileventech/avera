export function relativeDate(dateStr: string): string {
  const then = new Date(dateStr.length <= 10 ? `${dateStr}T00:00:00` : dateStr);
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((new Date(now.toDateString()).getTime() - new Date(then.toDateString()).getTime()) / dayMs);

  if (dateStr.length > 10) {
    const diffMs = now.getTime() - then.getTime();
    if (diffMs < 60_000) return 'Just now';
    if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)} min ago`;
    if (diffDays === 0) return then.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays === -1) return 'Tomorrow';
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < -1 && diffDays > -7) return `In ${-diffDays} days`;
  return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: then.getFullYear() === now.getFullYear() ? undefined : 'numeric' });
}
