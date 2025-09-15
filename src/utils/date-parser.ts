/**
 * Parse uploaded_at string to Date object
 * @param uploaded_at_str The uploaded_at string from Instagram (e.g., "2 hours ago", "1 day ago", "January 15, 2024")
 * @returns Date object representing the upload time
 */
export function parseUploadedAt(uploaded_at_str: string): Date {
  const now = new Date();

  const relativeMatch = uploaded_at_str.match(
    /(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/i,
  );
  if (relativeMatch && relativeMatch[1] && relativeMatch[2]) {
    const value = parseInt(relativeMatch[1], 10);
    const unit = relativeMatch[2].toLowerCase();

    const milliseconds = {
      second: value * 1000,
      minute: value * 60 * 1000,
      hour: value * 60 * 60 * 1000,
      day: value * 24 * 60 * 60 * 1000,
      week: value * 7 * 24 * 60 * 60 * 1000,
      month: value * 30 * 24 * 60 * 60 * 1000,
      year: value * 365 * 24 * 60 * 60 * 1000,
    };

    const offset = milliseconds[unit as keyof typeof milliseconds] || 0;
    return new Date(now.getTime() - offset);
  }

  const absoluteDate = new Date(uploaded_at_str);
  if (!Number.isNaN(absoluteDate.getTime())) {
    return absoluteDate;
  }

  console.warn(
    `[DateParser]: Failed to parse uploaded_at: ${uploaded_at_str}, using now ${now.toISOString()}`,
  );
  return now;
}

/**
 * Parse comment uploaded_at object to Date
 * @param uploaded_at The uploaded_at object from comment analysis
 * @returns Date object representing the upload time
 */
export function parseCommentUploadedAt(uploaded_at: {
  unit: "second" | "minute" | "hour" | "day" | "week" | "month" | "year";
  value: number;
}): Date {
  const now = new Date();

  const milliseconds = {
    second: uploaded_at.value * 1000,
    minute: uploaded_at.value * 60 * 1000,
    hour: uploaded_at.value * 60 * 60 * 1000,
    day: uploaded_at.value * 24 * 60 * 60 * 1000,
    week: uploaded_at.value * 7 * 24 * 60 * 60 * 1000,
    month: uploaded_at.value * 30 * 24 * 60 * 60 * 1000,
    year: uploaded_at.value * 365 * 24 * 60 * 60 * 1000,
  };

  const offset = milliseconds[uploaded_at.unit];
  return new Date(now.getTime() - offset);
}
