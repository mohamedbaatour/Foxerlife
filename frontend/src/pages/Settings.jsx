import React, { useState, useEffect } from 'react';
import { motion , AnimatePresence } from 'framer-motion';



import './Settings.css';

import { ReactComponent as SettingsIcon } from '../icones/settings.svg';
import { ReactComponent as ExportIcon } from '../icones/export.svg';
import { ReactComponent as ImportIcon } from '../icones/import.svg';
import { ReactComponent as LogoIcon } from '../icones/icon.svg';
import { ReactComponent as BoxIcon } from '../icones/box.svg';
import { ReactComponent as ColorLensIcon } from '../icones/color-lens.svg';

import { ReactComponent as BmcIcon } from "../icones/bmc.svg";

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
    return savedCustomCursor ? savedCustomCursor : "off"; // Default to on if not found
  });

  const [soundEffects, setSoundEffects] = useState(() => {
    const saved = localStorage.getItem("soundEffects");
    return saved ? saved : "off";
  });

  const [notifications, setNotifications] = useState([]);

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

  useEffect(() => {
    localStorage.setItem("soundEffects", soundEffects);
  }, [soundEffects]);

  // Helper to show notification
  const showNotification = (message) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };

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
    window.dispatchEvent(
      new CustomEvent("customCursorChanged", { detail: newValue })
    );
  };

  const exportTasks = () => {
    const laterTasks = JSON.parse(localStorage.getItem("laterTasks") || "[]");
    const archivedTasks = JSON.parse(
      localStorage.getItem("archivedTasks") || "[]"
    );
    const nowTask = JSON.parse(localStorage.getItem("nowTask") || "null");

    const exportData = {
      laterTasks,
      archivedTasks,
      nowTask: nowTask ? nowTask : null,
      exportedAt: new Date().toISOString(),
    };

    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "foxerlife_tasks_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    showNotification("Your tasks are packed and ready to go!");
  };

  const handleImportTasks = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (
          typeof data === "object" &&
          (Array.isArray(data.laterTasks) ||
            Array.isArray(data.archivedTasks) ||
            data.nowTask)
        ) {
          if (Array.isArray(data.laterTasks))
            localStorage.setItem("laterTasks", JSON.stringify(data.laterTasks));
          if (Array.isArray(data.archivedTasks))
            localStorage.setItem(
              "archivedTasks",
              JSON.stringify(data.archivedTasks)
            );
          if (data.nowTask && typeof data.nowTask === "object") {
            localStorage.setItem("nowTask", JSON.stringify(data.nowTask));
          } else {
            localStorage.removeItem("nowTask");
          }

          showNotification("Fox unpacked your tasks—you're all set!");
          setTimeout(() => window.location.reload(), 1200); // Give user time to see notification
        } else {
          showNotification(
            "Hmm… Fox can't read this file. Try a valid task file"
          );
        }
      } catch (err) {
        showNotification(
          "Fox couldn't read the file... Mind double-checking it?"
        );
      }
    };
    reader.readAsText(file);
  };

  const [appearance, setAppearance] = useState(() => {
    return localStorage.getItem("appearance") || "default";
  });

  useEffect(() => {
    function applyAppearance(mode) {
      document.body.setAttribute("data-appearance", mode);
    }

    if (appearance === "default") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      applyAppearance(mq.matches ? "dark" : "light");
      const listener = (e) => applyAppearance(e.matches ? "dark" : "light");
      mq.addEventListener("change", listener);
      // Save "default" to localStorage too!
      localStorage.setItem("appearance", "default");
      return () => mq.removeEventListener("change", listener);
    } else {
      applyAppearance(appearance);
      localStorage.setItem("appearance", appearance);
    }
  }, [appearance]);

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
          <p className="settings-option-text">Time Format</p>
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
          <p className="settings-option-text">Default Task Length</p>
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
        <button
          onClick={() => window.open("https://buymeacoffee.com/foxerlife")}
          className="settings-support"
        >
          <BmcIcon className="settings-support-icon" />
          Buy me a coffee
        </button>
        <div className="settings-seperator">
          <ColorLensIcon className="settings-seperator-icon" />
          <p className="settings-seperator-text">Personalization</p>
        </div>
        <div className="settings-option">
          <p className="settings-option-text">Apperance</p>
          <select
            className="settings-dropdown"
            value={appearance}
            onChange={(e) => setAppearance(e.target.value)}
          >
            <option value="default">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div className="settings-option">
          <p className="settings-option-text">Sound Effects</p>
          <select
            className="settings-dropdown"
            value={soundEffects}
            onChange={(e) => setSoundEffects(e.target.value)}
          >
            <option value="on">ON</option>
            <option value="off">OFF</option>
          </select>
        </div>
        {!/Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
          navigator.userAgent
        ) && (
          <div className="settings-option">
            <p className="settings-option-text">Custom Cursor</p>
            <select
              className="settings-dropdown"
              value={customCursor}
              onChange={handleCustomCursorChange}
            >
              <option value="on">ON</option>
              <option value="off">OFF</option>
            </select>
          </div>
        )}
        <div className="settings-seperator">
          <BoxIcon className="settings-seperator-icon" />
          <p className="settings-seperator-text">Task Management</p>
        </div>
        <div className="settings-option">
          <p className="settings-option-text">Export Tasks</p>
          <button className="export-import-button" onClick={exportTasks}>
            <ExportIcon className="export-import-icon" />
            Export Tasks
          </button>
        </div>
        <div className="settings-option">
          <p className="settings-option-text">Import Tasks</p>

          <input
            type="file"
            accept=".json,application/json"
            style={{ display: "none" }}
            id="import-tasks-input"
            onChange={handleImportTasks}
          />
          <button
            className="export-import-button"
            onClick={() =>
              document.getElementById("import-tasks-input").click()
            }
          >
            <ImportIcon className="export-import-icon" />
            Import Tasks
          </button>
        </div>
      </div>
      <div className="notifications-container">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              className="task-notification"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <LogoIcon className="notification-logo" />
              {notification.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Settings;

// Optionally, add some CSS for the button:
// .settings-export-button {
//   padding: 8px 18px;
//   border-radius: 8px;
//   background: #1fa2ff;
//   color: #fff;
//   border: none;
//   font-weight: 600;
//   cursor: pointer;
//   margin-top: 12px;
//   transition: background 0.2s;
// }
// .settings-export-button:hover {
//   background: #0b7bc1;
// }