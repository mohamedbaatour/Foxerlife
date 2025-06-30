import React, { useState, useEffect, useRef } from "react";
import "./Stats.css";

import TimerWhiteNoises from "../components/Timer-WhiteNoise.jsx";
import { ReactComponent as StatsIcon } from "../icones/stats.svg";

import { ReactComponent as CheckMarkIcon } from "../icones/checkmark.svg";
import { ReactComponent as LaterIcon } from "../icones/later.svg";

import {ReactComponent as LogoIcon } from "../icones/icon.svg";

import { ReactComponent as ArchiveIcon } from "../icones/archive.svg";

import { motion } from "framer-motion";

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

  // Add state for completed tasks
  const [completedTasks, setCompletedTasks] = useState(() => {
    const saved = localStorage.getItem("completedTasks");
    return saved ? JSON.parse(saved) : [];
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
    calculatePlannedTime([...laterTasks, ...archivedTasks, ...completedTasks]) +
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
      } else if (e.key === "completedTasks") {
        setCompletedTasks(JSON.parse(e.newValue || "[]"));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Helper to parse duration string to seconds
  const parseDurationToSeconds = (duration) => {
    if (!duration) return 0;
    const parts = duration.match(/(\d+)h\s*(\d+)m/);
    if (parts) {
      const hours = parseInt(parts[1]) || 0;
      const minutes = parseInt(parts[2]) || 0;
      return hours * 3600 + minutes * 60;
    }
    return 0;
  };

  // Helper to get time spent for a task
  const getTaskTimeSpent = (task) => {
    if (!task) return 0;
    const savedTimeRemaining = localStorage.getItem(`timerState-${task.id}`);
    const initialSeconds = parseDurationToSeconds(task.time);

    if (savedTimeRemaining !== null) {
      const remainingSeconds = parseInt(savedTimeRemaining);
      const spentSeconds = initialSeconds - remainingSeconds;
      return Math.max(0, spentSeconds);
    }
    return 0; // If no saved state, assume 0 spent time for tasks not currently running
  };

  return (
    <motion.div
      className="stats-page-container"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
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
        {/* Completed Tasks Section */}
        <div className="completed-tasks-section">
          <div className="completed-tasks-header">
            <CheckMarkIcon className="completed-tasks-header-icon" />
            <p className="completed-tasks-header-text">Completed tasks</p>
          </div>
          {completedTasks.length > 0 && (
            <div className="tasks-header-columns">
              <div className="left-column"></div>
              <div className="right-columns">
                <span>Completed</span>
                <span>Spent</span>
              </div>
            </div>
          )}
          <div className="tasks-completed-container">
            {completedTasks.length > 0 ? (
              completedTasks.map((task) => (
                <div key={task.id} className="task-completed-card">
                  <div className="task-completed-info">
                    <span className="task-completed-card-emoji">
                      {task.emoji}
                    </span>
                    <p className="task-completed-card-title">
                      {task.title.length > 25 ? task.title.slice(0, 25) + "..." : task.title}
                    </p>
                  </div>
                  <div className="task-completed-times">
                    <p className="task-completed-time">{task.completedAt}</p>
                    <p className="task-completed-duration">{task.timeSpent}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-completed-tasks">
                <LogoIcon className="logo-icon" />
                No victories yet — time to chase some!
              </div>
            )}
          </div>
        </div>

        {/* Remaining Tasks Section */}
        <div className="remaining-tasks-section">
          <div className="remaining-tasks-header">
            <LaterIcon className="remaining-tasks-header-icon" />
            <p className="remaining-tasks-header-text">Remaining tasks</p>
          </div>
          {(laterTasks.length > 0 || nowTask) && (
            <div className="tasks-header-columns">
              <div className="left-column"></div>
              <div className="right-columns">
                <span>Planned</span>
                <span>Spent</span>
                <span>Remaining</span>
              </div>
            </div>
          )}
          <div className="tasks-remaining-container">
            {nowTask &&
              !completedTasks.some((task) => task.id === nowTask.id) && (
                <div
                  key={nowTask.id}
                  className="task-remaining-card now-task-card"
                >
                  <div className="task-remaining-info">
                    <span className="task-remaining-card-emoji">
                      {nowTask.emoji}
                    </span>
                    <p className="task-remaining-card-title">
                      {(nowTask.title.length > 25 ? nowTask.title.slice(0, 25) + "..." : nowTask.title) + " (Now)"}
                    </p>
                  </div>
                  <div className="task-remaining-times">
                    <p className="task-remaining-time">{nowTask.time}</p>
                    <p className="task-remaining-duration">
                      {formatTime(Math.floor(getTaskTimeSpent(nowTask) / 60))}
                    </p>
                    <p className="task-remaining-duration">
                      {formatTime(
                        Math.floor(parseDurationToSeconds(nowTask.time) / 60) -
                          Math.floor(getTaskTimeSpent(nowTask) / 60)
                      )}
                    </p>
                  </div>
                </div>
              )}
            {laterTasks.length > 0 ? (
              laterTasks.map((task) => (
                <div key={task.id} className="task-remaining-card">
                  <div className="task-remaining-info">
                    <span className="task-remaining-card-emoji">
                      {task.emoji}
                    </span>
                    <p className="task-remaining-card-title">{task.title.length > 25 ? task.title.slice(0, 25) + "..." : task.title}</p>
                  </div>
                  <div className="task-remaining-times">
                    <p className="task-remaining-time">{task.time}</p>
                    <p className="task-remaining-duration">0h 0m</p>
                    <p className="task-remaining-duration">{task.time}</p>
                  </div>
                </div>
              ))
            ) : (
                <div className="no-remaining-tasks">
                  <LogoIcon className="logo-icon" />
                Nothing left to do — go enjoy a snack!
              </div>
            )}
          </div>
        </div>

        {/* Archived Tasks Section */}
        <div className="remaining-tasks-section">
          <div className="remaining-tasks-header">
            <ArchiveIcon className="remaining-tasks-header-icon" />
            <p className="remaining-tasks-header-text">Archived tasks</p>
          </div>
          {archivedTasks.length > 0 && (
            <div className="tasks-header-columns">
              <div className="left-column"></div>
              <div className="right-columns">
                <span>Planned</span>
                <span>Spent</span>
                <span>Remaining</span>
              </div>
            </div>
          )}
          <div className="tasks-remaining-container">
            {archivedTasks.length > 0 ? (
              archivedTasks.map((task) => (
                <div key={task.id} className="task-remaining-card">
                  <div className="task-remaining-info">
                    <span className="task-remaining-card-emoji">
                      {task.emoji}
                    </span>
                    <p className="task-remaining-card-title">{task.title.length > 25 ? task.title.slice(0, 25) + "..." : task.title}</p>
                  </div>
                  <div className="task-remaining-times">
                    <p className="task-remaining-time">{task.time}</p>
                    <p className="task-remaining-duration">0h 0m</p>
                    <p className="task-remaining-duration">{task.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-remaining-tasks">
                <LogoIcon className="logo-icon" />
                No archived tasks yet!
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Stats;
