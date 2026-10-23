import { AppStatus } from "../features/install/AppStatus.jsx";
import { InstalledPushPrompt } from "../features/install/InstalledPushPrompt.jsx";
import TopBar from "../components/TopBar.jsx";
import { NavigationMotionProvider } from "../components/NavigationMotionProvider.jsx";
import "../components/DesktopSidebar.css";

export function AppShell({ children, freezeBanner }) {
  return (
    <NavigationMotionProvider><div className="hl-app-shell">
      <div className="hl-app-shell__content">
        <TopBar freezeBanner={freezeBanner} />
        <AppStatus />
        <InstalledPushPrompt />
        {children}
      </div>
    </div></NavigationMotionProvider>
  );
}
