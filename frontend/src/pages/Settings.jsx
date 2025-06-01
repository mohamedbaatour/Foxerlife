import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import './Settings.css';

import { ReactComponent as SettingsIcon } from '../icones/settings.svg';
import { ReactComponent as ArrowDownIcon } from '../icones/arrow-down.svg';


const Settings = () => {
    const [timeFormat, setTimeFormat] = useState(() => {
      const savedTimeFormat = localStorage.getItem("timeFormat");
      return savedTimeFormat ? savedTimeFormat : "24"; // Default to 12h if not found
    });

    const [defaultTaskLength, setDefaultTaskLength] = useState(() => {
      const savedDefaultTaskLength = localStorage.getItem("defaultTaskLength");
      return savedDefaultTaskLength ? savedDefaultTaskLength : "25"; // Default to 25m if not found
    });

    useEffect(() => {
      localStorage.setItem("timeFormat", timeFormat);
    }, [timeFormat]);

    useEffect(() => {
      localStorage.setItem("defaultTaskLength", defaultTaskLength);
    }, [defaultTaskLength]);

    const handleTimeFormatChange = (event) => {
      setTimeFormat(event.target.value);
      window.location.reload(); // Recharge la page pour appliquer les changements
    };

    const handleDefaultTaskLengthChange = (event) => {
      setDefaultTaskLength(event.target.value);
    };

    return (
      <motion.div
        className="settings-page-container"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="settings-text">
          <SettingsIcon className="settings-icon" />
          <p className="settings-title">Settings</p>
        </div>
        <div className="settings-options">
          <div className="settings-option">
            <p className="settings-option-text">Time format</p>
            <select
              className="settings-dropdown"
              value={timeFormat}
              onChange={handleTimeFormatChange}
            >
              <option value="24">24h</option>
              <option value="12">12h</option>
            </select>
          </div>
          <div className="settings-option">
            <p className="settings-option-text">Default task length</p>
            <select
              className="settings-dropdown"
              value={defaultTaskLength}
              onChange={handleDefaultTaskLengthChange}
            >
              <option value="25">25m</option>
              <option value="50">50m</option>
            </select>
          </div>
          <div className="settings-option">
            <p className="settings-option-text">Overtime</p>
            <select className="settings-dropdown">
              <option value="on">ON</option>
              <option value="off">OFF</option>
            </select>
          </div>
        </div>
      </motion.div>
    );
}

export default Settings;