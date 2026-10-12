import { useLayoutEffect, useRef, useState } from "react";
import { TableScroll } from "./HundoUi.jsx";

// A separate header keeps horizontal table scrolling while following page scroll.
// Its position is bounded by the original table, so it leaves with that section.
export function RosterTableScroll({ label, children }) {
  const container = useRef(null);
  const [position, setPosition] = useState(null);

  useLayoutEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const root = container.current;
    const scroller = root.querySelector(".hl-table-scroll");
    const table = scroller.querySelector("table");
    const head = table.tHead;
    let frame;
    function measure() {
      const bounds = table.getBoundingClientRect();
      const viewport = scroller.getBoundingClientRect();
      const appHeader = document.querySelector(".hl-app-header");
      const hero = document.querySelector(".hl-roster-hero");
      const top = Math.max(0, appHeader?.getBoundingClientRect().bottom || 0,
        hero && getComputedStyle(hero).position === "sticky" ? hero.getBoundingClientRect().bottom : 0);
      const height = head.getBoundingClientRect().height;
      setPosition(bounds.top < top && bounds.bottom > top ? {
        top: Math.min(top, bounds.bottom - height),
        left: viewport.left,
        width: viewport.width,
        tableWidth: bounds.width,
        scrollLeft: scroller.scrollLeft,
        columns: [...head.rows[0].cells].map((cell) => cell.getBoundingClientRect().width),
      } : null);
    }
    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    }
    const observer = new ResizeObserver(schedule);
    observer.observe(table);
    observer.observe(scroller);
    const appHeader = document.querySelector(".hl-app-header");
    const hero = document.querySelector(".hl-roster-hero");
    if (appHeader) observer.observe(appHeader);
    if (hero) observer.observe(hero);
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <div ref={container}>
      <TableScroll label={label}>{children}</TableScroll>
      {position && (
        <div className="hl-roster-floating-head" style={{ top: position.top, left: position.left, width: position.width, "--roster-scroll-left": `${position.scrollLeft}px` }}>
          <table className={children.props.className} aria-label={`${label} column headings`}
            style={{ width: position.tableWidth, minWidth: position.tableWidth, tableLayout: "fixed", transform: `translateX(${-position.scrollLeft}px)` }}>
            <colgroup>{position.columns.map((width, index) => <col key={index} style={{ width }} />)}</colgroup>
            {children.props.children[0]}
          </table>
        </div>
      )}
    </div>
  );
}
