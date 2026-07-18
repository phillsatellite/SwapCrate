import { NavLink, useLocation } from "react-router-dom";
import { HomeIcon, MatchesIcon, AccountIcon } from "./icons.jsx";
import "./TabBar.css";

const TABS = [
  { to: "/", label: "Home", Icon: HomeIcon },
  { to: "/matches", label: "My Matches", Icon: MatchesIcon },
  { to: "/account", label: "Account", Icon: AccountIcon },
];

export default function TabBar() {
  const { pathname } = useLocation();
  // Hide the tab bar inside a full-screen conversation (/matches/:id).
  if (/^\/matches\/[^/]+$/.test(pathname)) return null;

  return (
    <nav className="tabbar" aria-label="Primary">
      {TABS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) => "tab" + (isActive ? " tab--active" : "")}
        >
          {({ isActive }) => (
            <>
              <Icon filled={isActive} />
              <span className="tab__label">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
