import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';
import { ReactComponent as LogoIcon } from '../icones/icon.svg'; 
import { ReactComponent as SettingsIcon } from '../icones/settings.svg';
import { ReactComponent as StatsIcon } from '../icones/stats.svg';
import { ReactComponent as TaskIcon } from '../icones/task.svg';

import CloudIcon from '../icones/cloud.svg';
import RainIcon from "../icones/rain.svg";
import SunIcon from "../icones/sun.svg";

const Navbar = () => {
  const getLinkClassName = ({ isActive }) => {
    return isActive ? "navbar-menu-link active" : "navbar-menu-link";
  };

  return (
    <nav className="navbar-main">
      <div className="navbar-left-section">
        <LogoIcon className="logo" /> 
        <div className="navbar-brand-name">
          Foxerlife
        </div>
      </div>

      <ul className="navbar-center-section">
        <li className="navbar-menu-item">
          <NavLink to="/" className={getLinkClassName}> 
            <TaskIcon className="navbar-menu-icon" />
            Tasks
          </NavLink>
        </li>
        <li className="navbar-menu-item">
          <NavLink to="/stats" className={getLinkClassName}>
            <StatsIcon className="navbar-menu-icon" />
            Stats
          </NavLink>
        </li>
        <li className="navbar-menu-item">
          <NavLink to="/settings" className={getLinkClassName}>
            <SettingsIcon className="navbar-menu-icon" />
            Settings
          </NavLink>
        </li>
      </ul>

      <div className="navbar-right-section">
        <img src={CloudIcon} alt="cloud" />
        <div className="navbar-time-details">
          <span className="navbar-current-time">10:00PM</span> <br />
          <span className="navbar-current-location">Tunis, Tunisia</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;