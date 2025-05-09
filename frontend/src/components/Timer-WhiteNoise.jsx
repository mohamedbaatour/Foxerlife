import React, { useState, useEffect, useRef } from 'react';
import './Timer-WhiteNoise.css'; 
import { ReactComponent as StartIcon } from "../icones/start.svg";
import { ReactComponent as EndIcon } from "../icones/end.svg";
import { ReactComponent as ResetIcon } from "../icones/reset.svg";
import { ReactComponent as PauseIcon } from "../icones/pause.svg";

// import WhiteNoisePlayer from '../components/WhiteNoisePlayer'; // Import the new component

// Timer Icons (same as before)



// const EndIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;

const TimerWhiteNoises = () => {
  const initialTime = 4 * 60 + 32; // Example: 4 min 32 seconds
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);
  const timerIntervalRef = useRef(null);

  const strokeWidth = 10; 
  const ringSize = 270; 
  const radius = (ringSize / 2) - (strokeWidth / 2); 
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeRemaining === 0 || !isActive) {
      clearInterval(timerIntervalRef.current);
      if (timeRemaining === 0 && isActive) {
        console.log('Timer finished!');
        setIsActive(false);
      }
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isActive, timeRemaining]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    clearInterval(timerIntervalRef.current);
    setIsActive(false);
    setTimeRemaining(initialTime); // Reset to the current initialTime
  };

  const endTimer = () => {
    clearInterval(timerIntervalRef.current);
    setIsActive(false);
    setTimeRemaining(0); 
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return (
      <>
        <span className="minutes">{String(minutes)}</span>
        <span className="separator"> min </span>
        <span className="seconds">{String(secs).padStart(2, '0')}</span>
        <span className="separator"> s</span>
      </>
    );
  };

  return (
    <div className="tasks-page-container">
      {/* This main content div will now only hold the left column */}
      
      <div className="tasks-main-content-left-column">
        <div className="timer-section">
          <div className="timer-display-container">
            <svg className="timer-progress-ring" width={ringSize} height={ringSize}>
              <defs>
                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{stopColor: '#119DFF', stopOpacity: 1}} /> 
                  <stop offset="100%" style={{stopColor: '#0056b3', stopOpacity: 1}} />
                </linearGradient>
              </defs>
              <circle
                className="timer-progress-ring__background"
                strokeWidth={strokeWidth}
                fill="transparent"
                r={radius}
                cx={ringSize / 2}
                cy={ringSize / 2}
              />
              <circle
                className="timer-progress-ring__progress"
                strokeWidth={strokeWidth}
                fill="transparent"
                r={radius}
                cx={ringSize / 2}
                cy={ringSize / 2}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: circumference * (1 - (timeRemaining / initialTime)), // Use initialTime here
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%',
                  transition: 'stroke-dashoffset 0.35s linear'
                }}
              />
            </svg>
            <div className="timer-text-content">
              <div className="timer-remaining-label">Remaining</div>
              <div className="timer-time">{formatTime(timeRemaining)}</div>
            </div>
          </div>
          <div className="timer-controls">
            <button onClick={resetTimer} className="timer-button reset-button">
              <ResetIcon className="reset-icon" /> Reset
            </button>
            <button onClick={toggleTimer} className={`start-pause-button ${isActive ? 'pause' : 'start'}`}>
              {isActive ? <PauseIcon /> : <StartIcon className="start-icon" />} {isActive ? 'Pause' : 'Start'} {/* Changed Pause to Start as per image */}
            </button>
            <button onClick={endTimer} className="timer-button end-button">
              <EndIcon className="end-icon" /> End
            </button>
          </div> 
        </div>

        {/* <WhiteNoisePlayer /> { /* Add the white noise player here */} 

      </div>
      {/* The .tasks-list-section (Now and Later tasks) is removed from here for now */}
    </div>
  );
};

export default TimerWhiteNoises;