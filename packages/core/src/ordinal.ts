// English ordinal numbers for the share text ("1st", "2nd", "11th").

/** Returns the English ordinal for a 1-based whole-number `position` ("1st", "12th", "23rd"). */
export function ordinal(position: number): string {
  const text = String(position);
  const lastTwo = position % 100;
  // 11, 12 and 13 take "th" although they end in 1, 2 and 3.
  if (lastTwo >= 11 && lastTwo <= 13) return `${text}th`;
  switch (position % 10) {
    case 1:
      return `${text}st`;
    case 2:
      return `${text}nd`;
    case 3:
      return `${text}rd`;
    default:
      return `${text}th`;
  }
}
