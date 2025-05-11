import React, { useState, useEffect, useRef } from 'react';
import './Timer-WhiteNoise.css'; 
import { ReactComponent as StartIcon } from "../icones/start.svg";
import { ReactComponent as EndIcon } from "../icones/end.svg";
import { ReactComponent as ResetIcon } from "../icones/reset.svg";
import { ReactComponent as PauseIcon } from "../icones/pause.svg";

import { ReactComponent as RainIcon } from "../icones/rain.svg";
import { ReactComponent as ForestIcon } from "../icones/forest.svg";

import { ReactComponent as SkipForwardIcon } from "../icones/skip-forward.svg";
import { ReactComponent as SkipBackwardIcon } from "../icones/skip-backward.svg";

import { ReactComponent as SoundIcon } from "../icones/sound.svg";
import { ReactComponent as SoundLowIcon } from "../icones/sound-low.svg";

// Assuming you might add these or have them:
// import { ReactComponent as ShuffleIcon } from "../icones/shuffle.svg";
// import { ReactComponent as RepeatIcon } from "../icones/repeat.svg";

// Import the audio file
import lightRainSound from "../../src/white-noises/calming-rain-257596.mp3";
import forestSound from "../../src/white-noises/forest-ambience-296528.mp3";
import airportSound from "../../src/white-noises/airport.mp3";

// import WhiteNoisePlayer from '../components/WhiteNoisePlayer'; // Import the new component

// Timer Icons (same as before)

// const EndIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;

const TimerWhiteNoises = () => {
  const initialTime = 4 * 60 + 32; // Example: 4 min 32 seconds
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);
  const timerIntervalRef = useRef(null);

  // White Noise Player State
  const audioRef = useRef(null);
  const [isNoisePlaying, setIsNoisePlaying] = useState(false);
  const fadeIntervalRef = useRef(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [volume, setVolume] = useState(1); // Initial volume: 100%
  const [isVolumeSliderVisible, setIsVolumeSliderVisible] = useState(false);
  // Add state for shuffle and repeat if needed, e.g.:
  // const [isShuffleOn, setIsShuffleOn] = useState(false);
  // const [isRepeatOn, setIsRepeatOn] = useState(false);

  const strokeWidth = 10;
  const ringSize = 270;
  const radius = ringSize / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeRemaining === 0 || !isActive) {
      clearInterval(timerIntervalRef.current);
      if (timeRemaining === 0 && isActive) {
        console.log("Timer finished!");
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
        <span className="seconds">{String(secs).padStart(2, "0")}</span>
        <span className="separator"> s</span>
      </>
    );
  };

  // White Noise Player Functions with Fade In/Out
  const toggleWhiteNoise = () => {
    if (audioRef.current) {
      clearInterval(fadeIntervalRef.current);
      if (isNoisePlaying) {
        let currentVolume = audioRef.current.volume;
        fadeIntervalRef.current = setInterval(() => {
          currentVolume -= 0.05; 
          if (currentVolume <= 0) {
            audioRef.current.volume = 0;
            audioRef.current.pause();
            clearInterval(fadeIntervalRef.current);
          } else {
            audioRef.current.volume = currentVolume;
          }
        }, 30);
      } else {
        audioRef.current.volume = 0; // Start at 0 for fade-in
        // Ensure current component volume state matches audio element before playing
        if (audioRef.current.volume !== volume) {
            audioRef.current.volume = volume; 
        }
        audioRef.current.play();
        let currentVolumeSetting = audioRef.current.volume; // Target volume for fade-in
        let actualVolume = 0; // Start fade from 0
        audioRef.current.volume = actualVolume; // Set audio element to 0 before starting fade

        fadeIntervalRef.current = setInterval(() => {
          actualVolume += 0.05;
          if (actualVolume >= currentVolumeSetting) {
            audioRef.current.volume = currentVolumeSetting;
            clearInterval(fadeIntervalRef.current);
          } else {
            audioRef.current.volume = actualVolume;
          }
        }, 30);
      }
      setIsNoisePlaying(!isNoisePlaying);
    }
  };

  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.volume = volume; // Set initial volume when component mounts or audioRef changes
    }
    const updateProgress = () => {
      if (audioElement) {
        setAudioProgress(audioElement.currentTime);
        setAudioDuration(audioElement.duration);
      }
    };

    if (audioElement) {
      audioElement.addEventListener("timeupdate", updateProgress);
      audioElement.addEventListener("loadedmetadata", updateProgress); // For initial duration
      const handleAudioEnd = () => {
        setIsNoisePlaying(false);
        // If repeat is on, play again, otherwise reset progress
        // if (isRepeatOn) { audioRef.current.play(); setIsNoisePlaying(true); } else { setAudioProgress(0); }
        setAudioProgress(0); // Simplified for now
      };
      audioElement.addEventListener("ended", handleAudioEnd);
      return () => {
        audioElement.removeEventListener("timeupdate", updateProgress);
        audioElement.removeEventListener("loadedmetadata", updateProgress);
        audioElement.removeEventListener("ended", handleAudioEnd);
      };
    }
  }, [volume]); // Add volume to dependency array if you want to react to its changes elsewhere, though direct set is fine.

  const handleProgressChange = (event) => {
    if (audioRef.current) {
      const newTime = Number(event.target.value);
      audioRef.current.currentTime = newTime;
      setAudioProgress(newTime);
    }
  };

  const handleVolumeChange = (event) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Placeholder handlers for other controls
  // const handleShuffle = () => console.log("Shuffle clicked"); // We are removing shuffle
  const handleSkipBackward = () => console.log("Skip backward clicked");
  const handleSkipForward = () => console.log("Skip forward clicked");
  const handleRepeat = () => console.log("Repeat clicked");

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      clearInterval(fadeIntervalRef.current);
    };
  }, []);

  const getProgressBarStyle = () => {
    if (!audioDuration) return {};
    const percentage = (audioProgress / audioDuration) * 100;
    return {
      background: `linear-gradient(to right, #119DFF 0%, #119DFF ${percentage}%, #181A1C ${percentage}%, #181A1C 100%)`,
    };
  };

  return (
    <div className="tasks-main-content-left-column">
      <div className="timer-section">
        <div className="timer-display-container">
          <svg
            className="timer-progress-ring"
            width={ringSize}
            height={ringSize}
          >
            <defs>
              <linearGradient
                id="timerGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  style={{ stopColor: "#119DFF", stopOpacity: 1 }}
                />
                <stop
                  offset="100%"
                  style={{ stopColor: "#0056b3", stopOpacity: 1 }}
                />
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
                strokeDashoffset:
                  circumference * (1 - timeRemaining / initialTime), // Use initialTime here
                transform: "rotate(-90deg)",
                transformOrigin: "50% 50%",
                transition: "stroke-dashoffset 0.35s linear",
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
          <button
            onClick={toggleTimer}
            className={`start-pause-button ${isActive ? "pause" : "start"}`}
          >
            {isActive ? <PauseIcon /> : <StartIcon className="start-icon" />}{" "}
            {isActive ? "Pause" : "Start"}{" "}
            {/* Changed Pause to Start as per image */}
          </button>
          <button onClick={endTimer} className="timer-button end-button">
            <EndIcon className="end-icon" /> End
          </button>
        </div>
      </div>

      <div className="white-noise-player">
        <div className="white-noise-player-hero">
          <RainIcon className="white-noise-player-icon" />
          <div className="white-noise-player-text">
            <p className="white-noise-player-title">White noises</p>
            <p className="white-noise-player-playing">Light rain</p>
          </div>
          {/* Three-dot icon (placeholder) */}
          {/* <button className="white-noise-options-button">···</button> */}
        </div>
        <div className="white-noise-progress-bar-container">
          <input
            type="range"
            min="0"
            max={audioDuration || 0}
            value={audioProgress}
            onChange={handleProgressChange}
            className="white-noise-progress-bar"
            style={getProgressBarStyle()}
          />
        </div>
        <div className="white-noise-controls">
          <div
            className="control-button volume-control-container"
            onMouseEnter={() => setIsVolumeSliderVisible(true)} // Keep for JS logic if needed, but CSS handles visual
            onMouseLeave={() => setIsVolumeSliderVisible(false)} // Keep for JS logic if needed
          >
            <div className="sound-icon-wrapper">
              {volume < 0.4 ? (
                <SoundLowIcon className="control-button-secondary" />
              ) : (
                <SoundIcon className="control-button-secondary" />
              )}
            </div>
            {/* Slider is always in DOM for CSS transitions, visibility controlled by CSS */}
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider"
            />
          </div>
          <button onClick={handleSkipBackward} className="control-button">
            <SkipBackwardIcon />
          </button>
          <button
            onClick={toggleWhiteNoise}
            className="control-button play-pause-main-button"
          >
            {isNoisePlaying ? (
              <PauseIcon className="pause-play-icon" />
            ) : (
              <StartIcon className="pause-play-icon" />
            )}
          </button>
          <button onClick={handleSkipForward} className="control-button">
            <SkipForwardIcon />
          </button>
            <ResetIcon
              onClick={handleRepeat}
              className="control-button-secondary"
            />
        </div>
        <audio ref={audioRef} src={lightRainSound} />{" "}
        {/* Set initial volume via useEffect or directly */}
      </div>
    </div>
  );
};

export default TimerWhiteNoises;

