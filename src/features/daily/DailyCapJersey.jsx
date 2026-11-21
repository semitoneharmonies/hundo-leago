export function DailyCapJersey({ amount }) {
  const value = `$${amount}`;
  return <svg className="hda-cap-jersey" viewBox="0 0 100 110" role="img" aria-label={`Remaining cap ${value}`}>
    <path d="M32 8 20 13 3 39 19 50 27 38 24 103H76L73 38 81 50 97 39 80 13 68 8Q50 17 32 8Z"
      fill="#101b30" stroke="#d49acb" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M32 8Q50 30 68 8M20 14 28 30M80 14 72 30" fill="none" stroke="#74426f" strokeWidth="4"/>
    <path d="m7 33 15 11m56 0 15-11" fill="none" stroke="#b970ad" strokeWidth="5"/>
    <path d="M25 88H75L75.5 94H24.5Z" fill="#b970ad"/>
    <path d="M24.5 97H75.5" fill="none" stroke="#e8cce3" strokeWidth="2"/>
    <rect x="33" y="26" width="34" height="14" rx="2" fill="#392b48"/>
    <text x="50" y="36" textAnchor="middle" fill="#f6eaf3" fontFamily="var(--hl-font-body, Sora, sans-serif)" fontSize="10" fontWeight="700" letterSpacing="1.5">CAP</text>
    <text x="50" y="73" textAnchor="middle" fill="#fff" stroke="#040912" strokeWidth="2" paintOrder="stroke fill"
      fontFamily="var(--hl-font-display, Barlow Condensed, sans-serif)" fontSize={value.length > 3 ? '27' : '32'} fontWeight="800">{value}</text>
  </svg>;
}
