/**
 * Date formatting utilities
 */

/**
 * Format a date string to readable format
 * @param dateString ISO date string (YYYY-MM-DD) or ISO timestamp
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format a date to a full date string with day of week
 */
export function formatFullDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format time string (HH:mm format)
 */
export function formatTime(timeString: string): string {
  return timeString; // Already in HH:mm format
}

/**
 * Check if a date is in the past
 */
export function isPastDate(dateString: string, timeString?: string): boolean {
  const date = new Date(dateString);
  if (timeString) {
    const [hours, minutes] = timeString.split(":").map(Number);
    date.setHours(hours, minutes, 0, 0);
  }
  return date < new Date();
}

/**
 * Check if a date is today
 */
export function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Get relative time string (e.g., "2 days away", "yesterday")
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 1) return `In ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}
