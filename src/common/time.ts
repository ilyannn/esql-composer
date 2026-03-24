const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
});

const RELATIVE_TIME_UNITS = [
  { unit: "year", milliseconds: 365 * 24 * 60 * 60 * 1000 },
  { unit: "month", milliseconds: 30 * 24 * 60 * 60 * 1000 },
  { unit: "day", milliseconds: 24 * 60 * 60 * 1000 },
  { unit: "hour", milliseconds: 60 * 60 * 1000 },
  { unit: "minute", milliseconds: 60 * 1000 },
  { unit: "second", milliseconds: 1000 },
] as const satisfies ReadonlyArray<{
  unit: Intl.RelativeTimeFormatUnit;
  milliseconds: number;
}>;

const toTimestamp = (value: Date | number | string): number =>
  value instanceof Date ? value.getTime() : new Date(value).getTime();

export const formatRelativeTime = (
  value: Date | number | string,
  now = Date.now(),
): string => {
  const timestamp = toTimestamp(value);

  if (Number.isNaN(timestamp)) {
    return "at an unknown time";
  }

  const deltaMilliseconds = timestamp - now;

  for (const { unit, milliseconds } of RELATIVE_TIME_UNITS) {
    if (Math.abs(deltaMilliseconds) >= milliseconds || unit === "second") {
      return RELATIVE_TIME_FORMATTER.format(
        Math.round(deltaMilliseconds / milliseconds),
        unit,
      );
    }
  }

  return "just now";
};
