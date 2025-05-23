import React, { useState, useEffect, useRef } from 'react';
import './Stats.css';

import TimerWhiteNoises from '../components/Timer-WhiteNoise.jsx';

import { ReactComponent as StatsIcon } from "../icones/stats.svg";

const Stats = () => {
  const [nowTask, setNowTask] = useState(() => {
    const savedNowTask = localStorage.getItem("nowTask");
    return savedNowTask ? JSON.parse(savedNowTask) : null;
  });

  // Add storage event listener
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "nowTask") {
        setNowTask(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Add white noise state initialization
  const [whiteNoiseState, setWhiteNoiseState] = useState(() => {
    const saved = localStorage.getItem("whiteNoiseState");
    return saved ? JSON.parse(saved) : { isPlaying: false, currentTrack: null, volume: 0.5 };
  });
  
  // Add white noise state synchronization
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "whiteNoiseState") {
        setWhiteNoiseState(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Update TimerWhiteNoises usage
  <TimerWhiteNoises
    nowTask={nowTask}
    isPlaying={whiteNoiseState.isPlaying}
    currentTrack={whiteNoiseState.currentTrack}
    volume={whiteNoiseState.volume}
    onStateChange={(newState) => {
      localStorage.setItem("whiteNoiseState", JSON.stringify(newState));
    }}
  />
  
  return (
    <div className="stats-page-container">
      <div className="left-section">
        {/* Pass the nowTask state to the TimerWhiteNoises component */}
        <TimerWhiteNoises nowTask={nowTask} />
      </div>
      <div className="right-section">
        <div className="stats-text">
          <StatsIcon className="stats-icon" />
          <p className="stats-title">Statistics</p>
        </div>
      </div>
    </div>
  );
};

export default Stats;