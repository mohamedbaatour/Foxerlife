import React, { useState, useEffect, useRef } from 'react';
import './Stats.css';

import TimerWhiteNoises from "../components/Timer-WhiteNoise.jsx";
import { ReactComponent as StatsIcon } from "../icones/stats.svg";

import { ReactComponent as CheckMarkIcon } from "../icones/checkmark.svg";
import { ReactComponent as LaterIcon } from "../icones/later.svg";

const Stats = () => {
  // Initialize states from localStorage
  const [laterTasks, setLaterTasks] = useState(() => {
    const saved = localStorage.getItem("laterTasks");
    return saved ? JSON.parse(saved) : [];
  });

  const [archivedTasks, setArchivedTasks] = useState(() => {
    const saved = localStorage.getItem("archivedTasks");
    return saved ? JSON.parse(saved) : [];
  });

  const [nowTask, setNowTask] = useState(() => {
    const saved = localStorage.getItem("nowTask");
    return saved ? JSON.parse(saved) : null;
  });

  const [timeSpent, setTimeSpent] = useState(() => {
    const saved = localStorage.getItem("timeSpent");
    return saved ? JSON.parse(saved) : 0; // Time in minutes
  });

  // Calculate total tasks
  const totalTasks =
    laterTasks.length + archivedTasks.length + (nowTask ? 1 : 0);

  // Calculate total planned time
  const calculatePlannedTime = (tasks) => {
    return tasks.reduce((total, task) => {
      const hours = task.time.match(/(\d+)h/)
        ? parseInt(task.time.match(/(\d+)h/)[1])
        : 0;
      const minutes = task.time.match(/(\d+)m/)
        ? parseInt(task.time.match(/(\d+)m/)[1])
        : 0;
      return total + hours * 60 + minutes;
    }, 0);
  };

  const totalPlannedMinutes =
    calculatePlannedTime([...laterTasks, ...archivedTasks]) +
    (nowTask ? calculatePlannedTime([nowTask]) : 0);

  // Format time for display
  const formatTime = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "laterTasks") {
        setLaterTasks(JSON.parse(e.newValue || "[]"));
      } else if (e.key === "archivedTasks") {
        setArchivedTasks(JSON.parse(e.newValue || "[]"));
      } else if (e.key === "nowTask") {
        setNowTask(e.newValue ? JSON.parse(e.newValue) : null);
      } else if (e.key === "timeSpent") {
        setTimeSpent(JSON.parse(e.newValue || "0"));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <div className="stats-page-container">
      <div className="stats-text">
        <StatsIcon className="stats-icon" />
        <p className="stats-title">Statistics</p>
      </div>
      <div className="stats-container">
        <div className="general-stats">
          <div className="general-stats-card">
            <p className="general-stats-card-text">Total Tasks</p>
            <p className="general-stats-card-number">{totalTasks}</p>
          </div>

          <div className="general-stats-card">
            <p className="general-stats-card-text">Time Planned</p>
            <p className="general-stats-card-number">
              {formatTime(totalPlannedMinutes)}
            </p>
          </div>

          <div className="general-stats-card">
            <p className="general-stats-card-text">Time Spent</p>
            <p className="general-stats-card-number">{formatTime(timeSpent)}</p>
          </div>
        </div>
        <div className="completed-tasks-section">
          <div className="completed-tasks-header">
            <CheckMarkIcon className="completed-tasks-header-icon" />
            <p className="completed-tasks-header-text">Completed tasks</p>
          </div>
          <div className="tasks-header-columns">
            <div className="left-column"></div>
            <div className="right-columns">
              <span>Completed</span>
              <span>Spent</span>
            </div>
          </div>
          <div className="tasks-completed-container">
            <div className="task-completed-card">
              <div className="task-completed-info">
                <span className="task-completed-card-emoji">😃</span>
                <p className="task-completed-card-title">
                  My first completed task
                </p>
              </div>
              <div className="task-completed-times">
                <p className="task-completed-time">9:24AM</p>
                <p className="task-completed-duration">1h 30m</p>
              </div>
            </div>
          </div>
        </div>
        <div className="remaining-tasks-section">
          <div className="remaining-tasks-header">
            <LaterIcon className="remaining-tasks-header-icon" />
            <p className="remaining-tasks-header-text">Remaining tasks</p>
          </div>
          <div className="tasks-header-columns">
            <div className="left-column"></div>
            <div className="right-columns">
              <span>Planned</span>
              <span>Spent</span>
              <span>Remaining</span>
            </div>
          </div>
          <div className="tasks-remaining-container">
            <div className="task-remaining-card">
              <div className="task-remaining-info">
                <span className="task-remaining-card-emoji">😃</span>
                <p className="task-remaining-card-title">
                  My first completed task
                </p>
              </div>
              <div className="task-remaining-times">
                <p className="task-remaining-time">2h 30m</p>
                <p className="task-remaining-duration">0h 20m</p>
                <p className="task-remaining-duration">2h 10m</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;