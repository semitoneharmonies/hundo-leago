import styles from "./AavRangeFilter.module.css";

export function AavRangeFilter({ range, onChange, valid }) {
  const sliderMaximum = Math.max(20, Math.ceil(Number(range.maximum) || 0));
  const minimum = Number(range.minimum) || 0;
  const maximum = Number(range.maximum) || 0;
  const sliderMinimum = Math.max(0, Math.min(minimum, sliderMaximum));
  const sliderUpper = Math.max(sliderMinimum, Math.min(maximum, sliderMaximum));

  function change(bound, value) {
    onChange({ ...range, enabled: true, [bound]: value });
  }

  return (
    <fieldset className={styles.range}>
      <legend>AAV range</legend>
      <div className={styles.sliderField}>
        <div className={styles.rangeHeader}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={range.enabled}
              onChange={(event) => onChange({ ...range, enabled: event.target.checked })}
            />
            Filter by AAV
          </label>
          <div className={styles.summary}>
            <span>{valid ? `(between $${minimum.toFixed(2)} and $${maximum.toFixed(2)})` : "Choose a valid range"}</span>
          </div>
        </div>
        <div
          className={styles.slider}
          style={{ "--aav-minimum": `${sliderMinimum / sliderMaximum * 100}%`, "--aav-maximum": `${sliderUpper / sliderMaximum * 100}%` }}
        >
          <div className={styles.track} aria-hidden="true"><div className={styles.selection} /></div>
          <input
            className={sliderMinimum === sliderMaximum ? styles.frontHandle : undefined}
            type="range"
            aria-label="Minimum AAV slider"
            aria-valuetext={`$${minimum.toFixed(2)}`}
            aria-valuemax={sliderUpper}
            aria-describedby="player-aav-help"
            min="0"
            max={sliderMaximum}
            step="0.25"
            value={sliderMinimum}
            onChange={(event) => change("minimum", String(Math.min(Number(event.target.value), sliderUpper)))}
          />
          <input
            type="range"
            aria-label="Maximum AAV slider"
            aria-valuetext={`$${maximum.toFixed(2)}`}
            aria-valuemin={sliderMinimum}
            aria-describedby="player-aav-help"
            min="0"
            max={sliderMaximum}
            step="0.25"
            value={sliderUpper}
            onChange={(event) => change("maximum", String(Math.max(Number(event.target.value), sliderMinimum)))}
          />
        </div>
      </div>
      <p id="player-aav-help" role={range.enabled && !valid ? "alert" : undefined}>
        {range.enabled && !valid
          ? "Choose a minimum no higher than the maximum."
          : range.enabled
            ? "Signed contracts only. Both limits included."
            : "Any AAV. Drag either handle to filter in $0.25 steps."}
      </p>
    </fieldset>
  );
}
