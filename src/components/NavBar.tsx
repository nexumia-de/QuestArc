import { Component } from "solid-js";
import { AppView } from "../hooks/useNavigation";
import "./NavBar.css";

interface NavBarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

const NavBar: Component<NavBarProps> = (props) => {
  return (
    <nav class="nav-bar">
      <button
        class={`nav-item ${props.currentView === "dashboard" ? "active" : ""}`}
        onClick={() => props.onNavigate("dashboard")}
        aria-label="Adventure"
      >
        <span class="nav-icon">⚔️</span>
        <span class="nav-label">Adventure</span>
      </button>

      <button
        class={`nav-item ${props.currentView === "settings" ? "active" : ""}`}
        onClick={() => props.onNavigate("settings")}
        aria-label="Settings"
      >
        <span class="nav-icon">⚙️</span>
        <span class="nav-label">Settings</span>
      </button>
    </nav>
  );
};

export default NavBar;
