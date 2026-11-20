import { dailyUserStripeStyle } from "./dailyUserStripes.js";
import "./DailyProfile.css";

// Place inside a manager cell with className="hd-user-stripe-cell".
// The decorative paint fades within that cell and never covers the stat columns.
export function DailyUserStripes({ appearance }) {
  const style = dailyUserStripeStyle(appearance);
  return style["--daily-stripe-image"]
    ? <span className="hd-user-stripes" style={style} aria-hidden="true"/>
    : null;
}
