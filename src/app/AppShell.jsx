import TopBar from "../components/TopBar.jsx";

export function AppShell({ children, freezeBanner }) {
  return (
    <div className="hl-app-shell">
      <div className="hl-app-shell__content">
        <TopBar freezeBanner={freezeBanner} />
        {children}
      </div>
    </div>
  );
}
