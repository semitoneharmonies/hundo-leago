import { canonicalNhlTeam } from '../../shared/nhlTeams.js';
import { nhlTeamColours } from './nhlTeamColours.js';
import glyphWidths from './nhlNumberWidths.json';
import styles from './PlayerJersey.module.css';

export function PlayerJersey({ team, number }) {
  if (!Number.isInteger(number) || number < 1 || number > 99) return null;
  const canonicalTeam = canonicalNhlTeam(team);
  // User-approved temporary fallback. Utah retains its own colours.
  const numeralTeam = canonicalTeam === 'UTA' ? 'BOS' : canonicalTeam;
  const widths = glyphWidths[numeralTeam];
  const digits = String(number).split('');
  const gap = 9, margin = 7;
  const width = widths ? digits.reduce((sum, digit) => sum + widths[digit], margin * 2) + (digits.length - 1) * gap : 100;
  return <div className={styles.jersey} style={nhlTeamColours(canonicalTeam)}
    role="img" aria-label={`${team} jersey number ${number}`} data-numeral-team={widths ? numeralTeam : 'fallback'}>
    <span className={styles.team} aria-hidden="true">{team}</span>
    {widths ? <svg className={styles.number} viewBox={`0 0 ${width} 114`} aria-hidden="true" focusable="false">
      {digits.map((digit, index) => {
        const x = margin + digits.slice(0, index).reduce((sum, prior) => sum + widths[prior] + gap, 0);
        const href = `${import.meta.env.BASE_URL}nhl-numbers/${numeralTeam}.svg#n${digit}`;
        const placement = { x, y: margin, width: widths[digit], height: 100 };
        return <g key={index}>
          <use {...placement} href={href} className={styles.outer} />
          <use {...placement} href={href} className={styles.outline} />
          <use {...placement} href={href} className={styles.fill} />
          {numeralTeam === 'NSH' && <use {...placement} href={`${import.meta.env.BASE_URL}nhl-numbers/NSH.svg#detail${digit}`} className={styles.detail} />}
        </g>;
      })}
    </svg> : <span className={styles.fallback} aria-hidden="true">{number}</span>}
    <span className={styles.caption} aria-hidden="true">Player collection</span>
  </div>;
}
