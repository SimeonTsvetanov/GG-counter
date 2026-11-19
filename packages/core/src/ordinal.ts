// Ordinal numbers for the share text: English ("1st", "2nd", "11th") and Bulgarian ("1-во", "2-ро",
// "11-то") — the place of a player in the ranking.

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

/**
 * Returns the Bulgarian ordinal for a 1-based whole-number `position`, in the neuter form that goes
 * with "място" (place): "1-во", "2-ро", "7-мо", "8-мо", "11-то", "21-во", "100-тно", "1000-но".
 */
export function bulgarianOrdinal(position: number): string {
  const text = String(position);
  const lastTwo = position % 100;
  // Whole hundreds and thousands are words of their own: стотно, двестотно … хилядно.
  if (lastTwo === 0 && position > 0) return `${text}-${position % 1000 === 0 ? "но" : "тно"}`;
  // 11–19 are "-надесето" (единадесето, дванадесето), whatever their last digit.
  if (lastTwo >= 11 && lastTwo <= 19) return `${text}-то`;
  switch (position % 10) {
    case 1:
      return `${text}-во`;
    case 2:
      return `${text}-ро`;
    case 7:
    case 8:
      return `${text}-мо`;
    default:
      return `${text}-то`;
  }
}
