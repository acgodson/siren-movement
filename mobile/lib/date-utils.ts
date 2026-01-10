import { formatDistanceToNow, format } from 'date-fns';

/**
 * Convert timestamp to relative time (e.g., "2 mins ago", "3 hours ago")
 * @param timestamp - Unix timestamp in seconds (from blockchain)
 * @returns Relative time string
 */
export function getRelativeTime(timestamp: number): string {
  const date = new Date(timestamp * 1000); // Convert seconds to milliseconds
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format timestamp for detail views
 * @param timestamp - Unix timestamp in seconds (from blockchain)
 * @returns Formatted date string (e.g., "Jan 10, 2026 3:45 PM")
 */
export function formatFullDate(timestamp: number): string {
  const date = new Date(timestamp * 1000); // Convert seconds to milliseconds
  return format(date, 'MMM dd, yyyy h:mm a');
}
