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
    
    const [overtime, setOvertime] = useState(() => {
      const savedOvertime = localStorage.getItem("overtime");
      return savedOvertime ? savedOvertime : "on"; // Default to on if not found
    });
    
    const [autoArchive, setAutoArchive] = useState(() => {
      const savedAutoArchive = localStorage.getItem("autoArchive");
      return savedAutoArchive ? savedAutoArchive : "off"; // Default to off if not found
    });
    
    const [customCursor, setCustomCursor] = useState(() => {
      const savedCustomCursor = localStorage.getItem("customCursor");
      return savedCustomCursor ? savedCustomCursor : "on"; // Default to on if not found
    });
    
    useEffect(() => {
      localStorage.setItem("timeFormat", timeFormat);
    }, [timeFormat]);

    useEffect(() => {
      localStorage.setItem("defaultTaskLength", defaultTaskLength);
    }, [defaultTaskLength]);
    
    useEffect(() => {
      localStorage.setItem("overtime", overtime);
    }, [overtime]);
    
    useEffect(() => {
      localStorage.setItem("autoArchive", autoArchive);
    }, [autoArchive]);

    const handleTimeFormatChange = (event) => {
      setTimeFormat(event.target.value);
      window.location.reload(); // Recharge la page pour appliquer les changements
    };

    const handleDefaultTaskLengthChange = (event) => {
      setDefaultTaskLength(event.target.value);
    };
    
    const handleOvertimeChange = (event) => {
      setOvertime(event.target.value);
    };
    
    const handleAutoArchiveChange = (event) => {
      setAutoArchive(event.target.value);
    };

    // Ensure this useEffect is present
    useEffect(() => {
      localStorage.setItem("customCursor", customCursor);
    }, [customCursor]);
    
    // Ensure the dropdown updates the state
    const handleCustomCursorChange = (event) => {
      const newValue = event.target.value;
      setCustomCursor(newValue);
      localStorage.setItem("customCursor", newValue);
      window.dispatchEvent(new CustomEvent("customCursorChanged", { detail: newValue }));
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
          {/* <div className="settings-option">
            <p className="settings-option-text">Overtime</p>
            <select 
              className="settings-dropdown"
              value={overtime}
              onChange={handleOvertimeChange}
            >
              <option value="on">ON</option>
              <option value="off">OFF</option>
            </select>
          </div> */}
          <div className="settings-option">
            <p className="settings-option-text">Overtime</p>
            <select 
              className="settings-dropdown"
              value={autoArchive}
              onChange={handleAutoArchiveChange}
            >
              <option value="on">OFF</option>
              <option value="off">ON</option>
            </select>
          </div>
          <div className="settings-option">
            <p className="settings-option-text">Custom Cursor</p>
            <select className="settings-dropdown" value={customCursor} onChange={handleCustomCursorChange}>
              <option value="on">ON</option>
              <option value="off">OFF</option>
            </select>
          </div>
        </div>
      </motion.div>
    );
}

export default Settings;