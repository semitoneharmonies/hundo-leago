import styles from "./AavRangeFilter.module.css";

export function AavRangeFilter({ range, onChange, valid }) {
  const sliderMaximum = Math.max(20, Math.ceil(Number(range.maximum) || 0));
  const minimum = Number(range.minimum) || 0;
  const maximum = Number(range.maximum) || 0;

  function change(bound, value) {
    onChange({ ...range, enabled: true, [bound]: value });
  }

  return (
    <fieldset className={styles.range}>
      <legend>AAV range</legend>
      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={range.enabled}
          onChange={(event) => onChange({ ...range, enabled: event.target.checked })}
        />
        Filter by AAV
      </label>
      <div className={styles.bounds}>
        <div>
          <label className="hl-field">
            Minimum AAV ($)
            <input
              type="number"
              min="0"
              step="0.01"
              value={range.minimum}
              onChange={(event) => change("minimum", event.target.value)}
              aria-invalid={range.enabled && !valid}
              aria-describedby="player-aav-help"
            />
          </label>
          <input
            type="range"
            aria-label="Minimum AAV slider"
            aria-valuetext={`$${minimum.toFixed(2)}`}
            min="0"
            max={sliderMaximum}
            step="0.01"
            value={minimum}
            onChange={(event) => change("minimum", String(Math.min(Number(event.target.value), maximum)))}
          />
        </div>
        <div>
          <label className="hl-field">
            Maximum AAV ($)
            <input
              type="number"
              min="0"
              step="0.01"
              value={range.maximum}
              onChange={(event) => change("maximum", event.target.value)}
              aria-invalid={range.enabled && !valid}
              aria-describedby="player-aav-help"
            />
          </label>
          <input
            type="range"
            aria-label="Maximum AAV slider"
            aria-valuetext={`$${maximum.toFixed(2)}`}
            min="0"
            max={sliderMaximum}
            step="0.01"
            value={maximum}
            onChange={(event) => change("maximum", String(Math.max(Number(event.target.value), minimum)))}
          />
        </div>
      </div>
      <p id="player-aav-help" role={range.enabled && !valid ? "alert" : undefined}>
        {range.enabled && !valid
          ? "Enter valid dollar amounts with a minimum no higher than the maximum."
          : range.enabled
            ? `Signed contracts from $${minimum.toFixed(2)} to $${maximum.toFixed(2)}, including both amounts.`
            : "Any AAV. Enter exact amounts or drag the sliders to filter."}
      </p>
    </fieldset>
  );
}
